<?php

namespace App\Services;

use App\Models\Conversation;
use App\Models\Message;
use App\Models\PlatformConnection;
use App\Models\User;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;
use RuntimeException;

class SocialAuthService
{
    private const OAUTH_PROVIDERS = ['facebook', 'instagram', 'twitter', 'tiktok'];

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
        $params = ['response_type' => 'code', 'redirect_uri' => config('services.social.callback'), 'state' => $state];
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

        return 'https://www.facebook.com/v22.0/dialog/oauth?'.http_build_query($params);
    }

    public function complete(string $code, string $state): PlatformConnection
    {
        $pending = Cache::pull("social-oauth:{$state}");
        if (! $pending) {
            throw new RuntimeException('The connection request expired. Please try again.');
        }
        $provider = $pending['provider'];
        $token = $this->exchangeToken($provider, $code, $pending['code_verifier'] ?? null);
        $profile = $this->profile($provider, $token['access_token']);

        return PlatformConnection::updateOrCreate(['user_id' => $pending['user_id'], 'platform' => $provider], [
            'connected' => true, 'access_token' => $token['access_token'], 'refresh_token' => $token['refresh_token'] ?? null,
            'provider_user_id' => $profile['id'] ?? $profile['data']['user_id'] ?? null, 'account_name' => $profile['name'] ?? $profile['data']['display_name'] ?? null,
            'expires_at' => isset($token['expires_in']) ? now()->addSeconds($token['expires_in']) : null, 'metadata' => $profile,
        ]);
    }

    public function saveCredentials(User $user, string $provider, array $credentials): PlatformConnection
    {
        if ($provider === 'telegram') {
            $telegramResponse = Http::connectTimeout(3)->timeout(8)->get('https://api.telegram.org/bot'.$credentials['bot_token'].'/getMe')->throw();
            if ($telegramResponse->json('ok') !== true) {
                throw new RuntimeException($telegramResponse->json('description', 'Telegram rejected the bot token.'));
            }
            $response = $telegramResponse->json('result', []);
            $connection = $this->save($user, $provider, $credentials['bot_token'], $response['id'] ?? null, $response['username'] ?? $response['first_name'] ?? null, $response);
            $this->configureTelegramWebhook($connection);

            return $connection->refresh();
        }
        if ($provider === 'whatsapp') {
            $response = Http::withToken($credentials['access_token'])->connectTimeout(3)->timeout(8)->get('https://graph.facebook.com/v22.0/'.$credentials['phone_number_id'])->throw()->json();

            return $this->save($user, $provider, $credentials['access_token'], $credentials['phone_number_id'], $response['display_phone_number'] ?? $response['verified_name'] ?? null, [...$response, 'phone_number_id' => $credentials['phone_number_id'], 'business_account_id' => $credentials['business_account_id']]);
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

        $conversation = Conversation::query()->firstOrNew([
            'user_id' => $connection->user_id,
            'external_id' => (string) $chat['id'],
            'platform' => 'telegram',
        ]);
        $conversation->contact_name = $this->telegramContactName($chat);
        $conversation->avatar ??= null;
        $conversation->save();

        $externalMessageId = 'telegram:'.(string) $messageId;
        $message = $conversation->messages()->firstOrCreate(
            ['external_id' => $externalMessageId],
            [
                'sender' => 'other',
                'type' => isset($payload['text']) || isset($payload['caption']) ? 'text' : 'media',
                'text' => $payload['text'] ?? $payload['caption'] ?? 'Received a Telegram message.',
                'sent_at' => isset($payload['date']) ? now()->setTimestamp((int) $payload['date']) : now(),
            ],
        );

        if ($message->wasRecentlyCreated) {
            $conversation->update(['last_message' => $message->text, 'last_message_at' => $message->sent_at ?? now()]);
        }

        return $message;
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

    private function telegramWebhookSecret(string $botToken): string
    {
        return hash_hmac('sha256', 'unifiechat-telegram-webhook', $botToken);
    }

    private function telegramContactName(array $chat): string
    {
        $name = trim(implode(' ', array_filter([$chat['first_name'] ?? null, $chat['last_name'] ?? null])));

        return $name !== '' ? $name : ($chat['username'] ?? 'Telegram contact');
    }

    private function exchangeToken(string $provider, string $code, ?string $codeVerifier = null): array
    {
        if ($provider === 'tiktok') {
            return Http::asForm()->connectTimeout(3)->timeout(8)->post('https://open.tiktokapis.com/v2/oauth/token/', ['client_key' => config('services.social.tiktok.client_key'), 'client_secret' => config('services.social.tiktok.client_secret'), 'code' => $code, 'grant_type' => 'authorization_code', 'redirect_uri' => config('services.social.callback')])->throw()->json();
        }
        if ($provider === 'twitter') {
            return Http::withBasicAuth(config('services.social.twitter.client_id'), config('services.social.twitter.client_secret'))->asForm()->connectTimeout(3)->timeout(8)->post('https://api.x.com/2/oauth2/token', ['code' => $code, 'grant_type' => 'authorization_code', 'redirect_uri' => config('services.social.callback'), 'code_verifier' => $codeVerifier])->throw()->json();
        }

        return Http::connectTimeout(3)->timeout(8)->get('https://graph.facebook.com/v22.0/oauth/access_token', ['client_id' => config("services.social.{$provider}.client_id"), 'client_secret' => config("services.social.{$provider}.client_secret"), 'redirect_uri' => config('services.social.callback'), 'code' => $code])->throw()->json();
    }

    private function profile(string $provider, string $token): array
    {
        if ($provider === 'tiktok') {
            return Http::withToken($token)->connectTimeout(3)->timeout(8)->get('https://open.tiktokapis.com/v2/user/info/', ['fields' => 'open_id,display_name,avatar_url'])->throw()->json();
        }
        if ($provider === 'twitter') {
            return Http::withToken($token)->connectTimeout(3)->timeout(8)->get('https://api.x.com/2/users/me')->throw()->json('data', []);
        }

        return Http::withToken($token)->connectTimeout(3)->timeout(8)->get('https://graph.facebook.com/me', ['fields' => 'id,name'])->throw()->json();
    }

    private function save(User $user, string $provider, string $accessToken, ?string $id, ?string $name, array $metadata): PlatformConnection
    {
        return PlatformConnection::updateOrCreate(['user_id' => $user->id, 'platform' => $provider], ['connected' => true, 'access_token' => $accessToken, 'provider_user_id' => $id, 'account_name' => $name, 'metadata' => $metadata]);
    }
}
