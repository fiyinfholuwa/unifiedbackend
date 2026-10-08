<?php

namespace App\Services;

use App\Models\Conversation;
use App\Models\Message;
use App\Models\PlatformConnection;
use App\Models\User;
use Illuminate\Database\Eloquent\Collection as EloquentCollection;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;
use RuntimeException;

class SocialAuthService
{
    private const GRAPH_API_VERSION = 'v22.0';

    private const OAUTH_PROVIDERS = ['facebook', 'instagram', 'twitter', 'tiktok'];

    private const META_PROVIDERS = ['facebook', 'instagram', 'whatsapp'];

    public function authorizationUrl(User $user, string $provider): string
    {
        if (! in_array($provider, self::OAUTH_PROVIDERS, true)) {
            throw new RuntimeException('This platform requires business credentials instead of OAuth.');
        }

        $clientKey = config("services.social.{$provider}.client_key", config("services.social.{$provider}.client_id"));
        if (! $clientKey) {
            throw new RuntimeException("{$provider} integration is not configured yet.");
        }

        $state = Str::random(64);
        $pending = ['user_id' => $user->id, 'provider' => $provider];
        if ($provider === 'twitter') {
            $pending['code_verifier'] = Str::random(96);
        }
        Cache::put("social-oauth:{$state}", $pending, now()->addMinutes(10));

        $params = [
            'response_type' => 'code',
            'redirect_uri' => config('services.social.callback'),
            'state' => $state,
        ];

        if ($provider === 'tiktok') {
            $params['client_key'] = $clientKey;
            $params['scope'] = config('services.social.tiktok.scope');

            return 'https://www.tiktok.com/v2/auth/authorize/?'.http_build_query($params);
        }

        if ($provider === 'twitter') {
            $params['client_id'] = $clientKey;
            $params['scope'] = config('services.social.twitter.scope');
            $params['code_challenge'] = rtrim(strtr(base64_encode(hash('sha256', $pending['code_verifier'], true)), '+/', '-_'), '=');
            $params['code_challenge_method'] = 'S256';

            return 'https://twitter.com/i/oauth2/authorize?'.http_build_query($params);
        }

        $params['client_id'] = $clientKey;
        $params['scope'] = config("services.social.{$provider}.scope");

        return 'https://www.facebook.com/'.self::GRAPH_API_VERSION.'/dialog/oauth?'.http_build_query($params);
    }

    public function complete(string $code, string $state): PlatformConnection
    {
        $pending = Cache::pull("social-oauth:{$state}");
        if (! $pending) {
            throw new RuntimeException('The connection request expired. Please try again.');
        }

        $provider = $pending['provider'];
        $token = $this->exchangeToken($provider, $code, $pending['code_verifier'] ?? null);
        $accessToken = $token['access_token'] ?? null;
        if (! is_string($accessToken) || $accessToken === '') {
            throw new RuntimeException("{$provider} did not return an access token.");
        }

        if (in_array($provider, ['facebook', 'instagram'], true)) {
            return $this->completeMetaConnection($pending['user_id'], $provider, $accessToken, $token);
        }

        $profile = $this->profile($provider, $accessToken);

        return PlatformConnection::updateOrCreate(['user_id' => $pending['user_id'], 'platform' => $provider], [
            'connected' => true,
            'access_token' => $accessToken,
            'refresh_token' => $token['refresh_token'] ?? null,
            'provider_user_id' => $profile['id'] ?? $profile['data']['user_id'] ?? null,
            'account_name' => $profile['name'] ?? $profile['data']['display_name'] ?? null,
            'expires_at' => isset($token['expires_in']) ? now()->addSeconds($token['expires_in']) : null,
            'metadata' => $profile,
        ]);
    }

    public function saveCredentials(User $user, string $provider, array $credentials): PlatformConnection
    {
        if ($provider === 'telegram') {
            $telegramResponse = Http::connectTimeout(3)
                ->timeout(8)
                ->get('https://api.telegram.org/bot'.$credentials['bot_token'].'/getMe')
                ->throw();

            if ($telegramResponse->json('ok') !== true) {
                throw new RuntimeException($telegramResponse->json('description', 'Telegram rejected the bot token.'));
            }

            $response = $telegramResponse->json('result', []);
            $connection = $this->save($user, $provider, $credentials['bot_token'], $response['id'] ?? null, $response['username'] ?? $response['first_name'] ?? null, $response);
            $this->configureTelegramWebhook($connection);

            return $connection->refresh();
        }

        if ($provider === 'whatsapp') {
            $response = Http::withToken($credentials['access_token'])
                ->connectTimeout(3)
                ->timeout(8)
                ->get($this->graphUrl($credentials['phone_number_id']))
                ->throw()
                ->json();

            $metadata = [
                ...$response,
                'phone_number_id' => $credentials['phone_number_id'],
                'business_account_id' => $credentials['business_account_id'],
            ];
            $this->subscribeMetaAsset('whatsapp', $credentials['access_token'], $credentials['business_account_id']);

            return $this->save(
                $user,
                $provider,
                $credentials['access_token'],
                $credentials['phone_number_id'],
                $response['display_phone_number'] ?? $response['verified_name'] ?? null,
                $metadata,
            );
        }

        throw new RuntimeException('Manual credentials are not supported for this platform.');
    }

    public function configureTelegramWebhook(PlatformConnection $connection): void
    {
        if ($connection->platform !== 'telegram' || ! $connection->access_token) {
            throw new RuntimeException('A Telegram bot token is required to configure the webhook.');
        }

        $webhookUrl = rtrim((string) config('app.url'), '/').'/api/v1/webhooks/telegram';
        if (! str_starts_with($webhookUrl, 'https://')) {
            throw new RuntimeException('Telegram webhooks require a public HTTPS APP_URL.');
        }

        $response = Http::connectTimeout(3)
            ->timeout(8)
            ->post('https://api.telegram.org/bot'.$connection->access_token.'/setWebhook', [
                'url' => $webhookUrl,
                'secret_token' => $this->telegramWebhookSecret($connection->access_token),
                'allowed_updates' => json_encode(['message', 'edited_message']),
            ])
            ->throw();

        if ($response->json('ok') !== true) {
            throw new RuntimeException($response->json('description', 'Telegram rejected the webhook configuration.'));
        }

        $connection->update(['metadata' => [...($connection->metadata ?? []), 'telegram_webhook_configured' => true]]);
    }

    public function telegramConnectionForWebhookSecret(string $secret): ?PlatformConnection
    {
        if ($secret === '') {
            return null;
        }

        return PlatformConnection::query()
            ->where('platform', 'telegram')
            ->where('connected', true)
            ->get()
            ->first(fn (PlatformConnection $connection): bool => hash_equals($this->telegramWebhookSecret((string) $connection->access_token), $secret));
    }

    public function ingestTelegramUpdate(PlatformConnection $connection, array $update): ?Message
    {
        $payload = $update['message'] ?? $update['edited_message'] ?? null;
        $chat = is_array($payload) ? ($payload['chat'] ?? null) : null;
        $messageId = is_array($payload) ? ($payload['message_id'] ?? $update['update_id'] ?? null) : null;

        if (! is_array($payload) || ! is_array($chat) || ! isset($chat['id']) || $messageId === null) {
            return null;
        }

        return $this->storeInboundMessage(
            $connection,
            'telegram',
            (string) $chat['id'],
            $this->telegramContactName($chat),
            'telegram:'.(string) $messageId,
            isset($payload['text']) || isset($payload['caption']) ? 'text' : 'media',
            $payload['text'] ?? $payload['caption'] ?? 'Received a Telegram message.',
            isset($payload['date']) ? now()->setTimestamp((int) $payload['date']) : now(),
        );
    }

    public function ingestMetaWebhook(array $payload): int
    {
        $processed = 0;
        $object = $payload['object'] ?? null;

        foreach ($payload['entry'] ?? [] as $entry) {
            if (! is_array($entry)) {
                continue;
            }

            if ($object === 'whatsapp_business_account') {
                $processed += $this->ingestWhatsAppEntry($entry);

                continue;
            }

            if (in_array($object, ['page', 'instagram'], true)) {
                $processed += $this->ingestMessengerEntry($entry, $object);
            }
        }

        return $processed;
    }

    public function hasValidMetaSignature(string $payload, string $signature): bool
    {
        $appSecret = (string) config('services.social.meta.app_secret');
        if ($appSecret === '' || ! str_starts_with($signature, 'sha256=')) {
            return false;
        }

        return hash_equals('sha256='.hash_hmac('sha256', $payload, $appSecret), $signature);
    }

    public function sendMessage(PlatformConnection $connection, Conversation $conversation, string $text): array
    {
        $recipientId = $this->remoteConversationId($conversation);

        return match ($connection->platform) {
            'telegram' => $this->sendTelegramMessage($connection, $recipientId, $text),
            'whatsapp' => $this->sendWhatsAppMessage($connection, $recipientId, $text),
            'facebook', 'instagram' => $this->sendMessengerMessage($connection, $recipientId, $text),
            default => throw new RuntimeException("Sending messages for {$connection->platform} is not supported yet."),
        };
    }

    public function sendTelegramMessage(PlatformConnection $connection, string $chatId, string $text): array
    {
        $response = Http::connectTimeout(3)
            ->timeout(8)
            ->post('https://api.telegram.org/bot'.$connection->access_token.'/sendMessage', [
                'chat_id' => $chatId,
                'text' => $text,
            ])
            ->throw();

        if ($response->json('ok') !== true) {
            throw new RuntimeException($response->json('description', 'Telegram rejected the message.'));
        }

        return $response->json('result', []);
    }

    private function completeMetaConnection(int|string $userId, string $provider, string $userToken, array $token): PlatformConnection
    {
        $accounts = Http::withToken($userToken)
            ->connectTimeout(3)
            ->timeout(8)
            ->get($this->graphUrl('me/accounts'), [
                'fields' => 'id,name,access_token,instagram_business_account{id,username,name,profile_picture_url}',
            ])
            ->throw()
            ->json('data', []);

        $account = collect($accounts)->first(function (array $candidate) use ($provider): bool {
            return $provider === 'facebook' || isset($candidate['instagram_business_account']['id']);
        });

        if (! is_array($account)) {
            throw new RuntimeException($provider === 'instagram'
                ? 'No Instagram business account was found for this Facebook login.'
                : 'No Facebook Page was found for this account.');
        }

        $instagramAccount = $account['instagram_business_account'] ?? null;
        $providerUserId = $provider === 'instagram' ? ($instagramAccount['id'] ?? null) : ($account['id'] ?? null);
        $pageToken = $account['access_token'] ?? $userToken;
        $pageId = $account['id'] ?? null;
        $metadata = [
            'page_id' => $pageId,
            'page_name' => $account['name'] ?? null,
            'instagram_business_account_id' => $instagramAccount['id'] ?? null,
            'instagram_username' => $instagramAccount['username'] ?? null,
            'oauth_user_id' => $token['user_id'] ?? null,
        ];

        if (! is_string($providerUserId) || $providerUserId === '' || ! is_string($pageId) || $pageId === '') {
            throw new RuntimeException('Meta did not return a usable page or Instagram business account.');
        }

        $this->subscribeMetaAsset($provider, $pageToken, $pageId);

        $user = User::query()->findOrFail($userId);

        return PlatformConnection::updateOrCreate(['user_id' => $user->id, 'platform' => $provider], [
            'connected' => true,
            'access_token' => $pageToken,
            'provider_user_id' => $providerUserId,
            'account_name' => $provider === 'instagram' ? ($instagramAccount['username'] ?? $account['name'] ?? null) : ($account['name'] ?? null),
            'expires_at' => isset($token['expires_in']) ? now()->addSeconds($token['expires_in']) : null,
            'metadata' => $metadata,
        ]);
    }

    private function exchangeToken(string $provider, string $code, ?string $codeVerifier = null): array
    {
        if ($provider === 'tiktok') {
            return Http::asForm()->connectTimeout(3)->timeout(8)->post('https://open.tiktokapis.com/v2/oauth/token/', [
                'client_key' => config('services.social.tiktok.client_key'),
                'client_secret' => config('services.social.tiktok.client_secret'),
                'code' => $code,
                'grant_type' => 'authorization_code',
                'redirect_uri' => config('services.social.callback'),
            ])->throw()->json();
        }

        if ($provider === 'twitter') {
            return Http::withBasicAuth(config('services.social.twitter.client_id'), config('services.social.twitter.client_secret'))
                ->asForm()
                ->connectTimeout(3)
                ->timeout(8)
                ->post('https://api.x.com/2/oauth2/token', [
                    'code' => $code,
                    'grant_type' => 'authorization_code',
                    'redirect_uri' => config('services.social.callback'),
                    'code_verifier' => $codeVerifier,
                ])
                ->throw()
                ->json();
        }

        return Http::connectTimeout(3)
            ->timeout(8)
            ->get($this->graphUrl('oauth/access_token'), [
                'client_id' => config("services.social.{$provider}.client_id"),
                'client_secret' => config("services.social.{$provider}.client_secret"),
                'redirect_uri' => config('services.social.callback'),
                'code' => $code,
            ])
            ->throw()
            ->json();
    }

    private function profile(string $provider, string $token): array
    {
        if ($provider === 'tiktok') {
            return Http::withToken($token)->connectTimeout(3)->timeout(8)->get('https://open.tiktokapis.com/v2/user/info/', ['fields' => 'open_id,display_name,avatar_url'])->throw()->json();
        }

        if ($provider === 'twitter') {
            return Http::withToken($token)->connectTimeout(3)->timeout(8)->get('https://api.x.com/2/users/me')->throw()->json('data', []);
        }

        return Http::withToken($token)->connectTimeout(3)->timeout(8)->get($this->graphUrl('me'), ['fields' => 'id,name'])->throw()->json();
    }

    private function subscribeMetaAsset(string $provider, string $accessToken, string $assetId): void
    {
        if (! in_array($provider, self::META_PROVIDERS, true)) {
            return;
        }

        $response = Http::withToken($accessToken)
            ->connectTimeout(3)
            ->timeout(8)
            ->post($this->graphUrl($assetId.'/subscribed_apps'))
            ->throw();

        if ($response->json('success') !== true) {
            throw new RuntimeException($response->json('error.message', "Meta rejected the {$provider} webhook subscription."));
        }
    }

    private function ingestWhatsAppEntry(array $entry): int
    {
        $entryId = (string) ($entry['id'] ?? '');
        $messages = [];
        $phoneNumberId = '';

        foreach ($entry['changes'] ?? [] as $change) {
            if (($change['field'] ?? null) === 'messages') {
                $messages = [...$messages, ...($change['value']['messages'] ?? [])];
                $phoneNumberId = (string) ($change['value']['metadata']['phone_number_id'] ?? '');
            }
        }

        if ($messages === [] || $entryId === '') {
            return 0;
        }

        $connections = $this->metaConnections('whatsapp')->filter(function (PlatformConnection $connection) use ($entryId, $phoneNumberId): bool {
            $metadata = $connection->metadata ?? [];

            return (string) ($metadata['business_account_id'] ?? '') === $entryId
                || (string) ($metadata['phone_number_id'] ?? '') === $phoneNumberId;
        });
        $processed = 0;

        foreach ($connections as $connection) {
            foreach ($messages as $message) {
                $remoteId = (string) ($message['from'] ?? '');
                $messageId = (string) ($message['id'] ?? '');
                if ($remoteId === '' || $messageId === '') {
                    continue;
                }

                $contact = collect($this->whatsappContacts($entry))->firstWhere('wa_id', $remoteId);
                $contactName = data_get($contact, 'profile.name', 'WhatsApp contact');
                $stored = $this->storeInboundMessage(
                    $connection,
                    'whatsapp',
                    $remoteId,
                    $contactName,
                    'whatsapp:'.$messageId,
                    ($message['type'] ?? 'text') === 'text' ? 'text' : 'media',
                    data_get($message, 'text.body', 'Received a WhatsApp message.'),
                    isset($message['timestamp']) ? now()->setTimestamp((int) $message['timestamp']) : now(),
                );
                $processed += $stored->wasRecentlyCreated ? 1 : 0;
            }
        }

        return $processed;
    }

    private function ingestMessengerEntry(array $entry, string $object): int
    {
        $entryId = (string) ($entry['id'] ?? '');
        if ($entryId === '') {
            return 0;
        }

        $connections = $this->metaConnections()->filter(function (PlatformConnection $connection) use ($entryId, $object): bool {
            $metadata = $connection->metadata ?? [];
            $expectedIds = $connection->platform === 'instagram'
                ? [$metadata['instagram_business_account_id'] ?? null, $metadata['page_id'] ?? null, $connection->provider_user_id]
                : [$metadata['page_id'] ?? null, $connection->provider_user_id];

            return $connection->platform === ($object === 'instagram' ? 'instagram' : 'facebook')
                && in_array($entryId, array_map('strval', array_filter($expectedIds)), true);
        });

        $processed = 0;
        foreach ($connections as $connection) {
            foreach ($entry['messaging'] ?? [] as $event) {
                $message = $event['message'] ?? null;
                $senderId = (string) ($event['sender']['id'] ?? '');
                $messageId = (string) ($message['mid'] ?? '');
                if (! is_array($message) || $senderId === '' || $messageId === '' || $senderId === (string) $connection->provider_user_id) {
                    continue;
                }

                $stored = $this->storeInboundMessage(
                    $connection,
                    $connection->platform,
                    $senderId,
                    ucfirst($connection->platform).' contact',
                    $connection->platform.':'.$messageId,
                    isset($message['text']) ? 'text' : 'media',
                    $message['text'] ?? 'Received a '.ucfirst($connection->platform).' message.',
                    isset($event['timestamp']) ? now()->setTimestamp((int) floor(((int) $event['timestamp']) / 1000)) : now(),
                );
                $processed += $stored->wasRecentlyCreated ? 1 : 0;
            }
        }

        return $processed;
    }

    private function storeInboundMessage(PlatformConnection $connection, string $platform, string $remoteId, string $contactName, string $externalMessageId, string $type, string $text, mixed $sentAt): Message
    {
        $conversation = Conversation::query()->firstOrNew([
            'user_id' => $connection->user_id,
            'external_id' => $platform === 'telegram' ? $remoteId : $platform.':'.$remoteId,
        ]);
        $conversation->platform = $platform;
        $conversation->contact_name = $contactName;
        $conversation->save();

        $message = $conversation->messages()->firstOrCreate(
            ['external_id' => $externalMessageId],
            [
                'sender' => 'other',
                'type' => $type,
                'text' => $text,
                'sent_at' => $sentAt,
            ],
        );

        if ($message->wasRecentlyCreated) {
            $conversation->update(['last_message' => $message->text, 'last_message_at' => $message->sent_at ?? now()]);
        }

        return $message;
    }

    private function sendWhatsAppMessage(PlatformConnection $connection, string $recipientId, string $text): array
    {
        $phoneNumberId = (string) data_get($connection->metadata, 'phone_number_id', $connection->provider_user_id);
        $response = Http::withToken($connection->access_token)
            ->connectTimeout(3)
            ->timeout(8)
            ->post($this->graphUrl($phoneNumberId.'/messages'), [
                'messaging_product' => 'whatsapp',
                'recipient_type' => 'individual',
                'to' => $recipientId,
                'type' => 'text',
                'text' => ['preview_url' => false, 'body' => $text],
            ])
            ->throw();

        $messageId = $response->json('messages.0.id');
        if (! is_string($messageId) || $messageId === '') {
            throw new RuntimeException('WhatsApp did not return a message id.');
        }

        return ['message_id' => $messageId];
    }

    private function sendMessengerMessage(PlatformConnection $connection, string $recipientId, string $text): array
    {
        $response = Http::withToken($connection->access_token)
            ->connectTimeout(3)
            ->timeout(8)
            ->post($this->graphUrl('me/messages'), [
                'messaging_type' => 'RESPONSE',
                'recipient' => ['id' => $recipientId],
                'message' => ['text' => $text],
            ])
            ->throw()
            ->json();

        if (! is_string($response['message_id'] ?? null) || $response['message_id'] === '') {
            throw new RuntimeException('Meta did not return a message id.');
        }

        return $response;
    }

    private function remoteConversationId(Conversation $conversation): string
    {
        $prefix = $conversation->platform.':';

        return Str::startsWith($conversation->external_id, $prefix)
            ? Str::after($conversation->external_id, $prefix)
            : $conversation->external_id;
    }

    private function metaConnections(?string $platform = null): EloquentCollection
    {
        return PlatformConnection::query()
            ->where('connected', true)
            ->when($platform, fn ($query) => $query->where('platform', $platform))
            ->whereIn('platform', self::META_PROVIDERS)
            ->get();
    }

    private function whatsappContacts(array $entry): array
    {
        foreach ($entry['changes'] ?? [] as $change) {
            if (($change['field'] ?? null) === 'messages') {
                return $change['value']['contacts'] ?? [];
            }
        }

        return [];
    }

    private function graphUrl(string $path): string
    {
        return 'https://graph.facebook.com/'.self::GRAPH_API_VERSION.'/'.$path;
    }

    private function telegramWebhookSecret(string $botToken): string
    {
        return hash_hmac('sha256', 'unifiechat-telegram-webhook', $botToken);
    }

    private function telegramContactName(array $chat): string
    {
        $name = trim(implode(' ', array_filter([$chat['first_name'] ?? null, $chat['last_name'] ?? null])));

        return $name !== '' ? $name : ($chat['username'] ?? 'Telegram contact');
    }

    private function save(User $user, string $provider, string $accessToken, ?string $id, ?string $name, array $metadata): PlatformConnection
    {
        return PlatformConnection::updateOrCreate(['user_id' => $user->id, 'platform' => $provider], [
            'connected' => true,
            'access_token' => $accessToken,
            'provider_user_id' => $id,
            'account_name' => $name,
            'metadata' => $metadata,
        ]);
    }
}
