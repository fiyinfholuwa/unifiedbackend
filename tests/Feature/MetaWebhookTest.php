<?php

namespace Tests\Feature;

use App\Models\PlatformConnection;
use App\Models\User;
use App\Services\SocialAuthService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Client\Request as ClientRequest;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class MetaWebhookTest extends TestCase
{
    use RefreshDatabase;

    public function test_meta_webhook_verification_returns_the_challenge(): void
    {
        config(['services.social.meta.webhook_verify_token' => 'verify-me']);

        $response = $this->get('/api/v1/webhooks/meta?hub.mode=subscribe&hub.verify_token=verify-me&hub.challenge=challenge-123');

        $response->assertOk()->assertSeeText('challenge-123');
    }

    public function test_whatsapp_webhook_is_routed_to_the_user_connection_and_is_idempotent(): void
    {
        config(['services.social.meta.app_secret' => 'meta-app-secret']);
        $user = User::factory()->create();
        PlatformConnection::create([
            'user_id' => $user->id,
            'platform' => 'whatsapp',
            'connected' => true,
            'access_token' => 'user-whatsapp-token',
            'provider_user_id' => 'phone-123',
            'metadata' => ['phone_number_id' => 'phone-123', 'business_account_id' => 'business-123'],
        ]);
        $payload = [
            'object' => 'whatsapp_business_account',
            'entry' => [[
                'id' => 'business-123',
                'changes' => [[
                    'field' => 'messages',
                    'value' => [
                        'metadata' => ['phone_number_id' => 'phone-123'],
                        'contacts' => [['wa_id' => '2348000000000', 'profile' => ['name' => 'Ada Lovelace']]],
                        'messages' => [[
                            'from' => '2348000000000',
                            'id' => 'wamid-1',
                            'timestamp' => '1791437200',
                            'type' => 'text',
                            'text' => ['body' => 'Hello from WhatsApp'],
                        ]],
                    ],
                ]],
            ]],
        ];
        $body = json_encode($payload, JSON_THROW_ON_ERROR);
        $signature = 'sha256='.hash_hmac('sha256', $body, 'meta-app-secret');

        $first = $this->call('POST', '/api/v1/webhooks/meta', [], [], [], ['CONTENT_TYPE' => 'application/json', 'HTTP_X_HUB_SIGNATURE_256' => $signature], $body);
        $second = $this->call('POST', '/api/v1/webhooks/meta', [], [], [], ['CONTENT_TYPE' => 'application/json', 'HTTP_X_HUB_SIGNATURE_256' => $signature], $body);

        $first->assertOk()->assertJson(['received' => true]);
        $second->assertOk()->assertJson(['received' => true]);
        $this->assertDatabaseCount('conversations', 1);
        $this->assertDatabaseCount('messages', 1);
        $this->assertDatabaseHas('conversations', ['user_id' => $user->id, 'external_id' => 'whatsapp:2348000000000', 'contact_name' => 'Ada Lovelace']);
        $this->assertDatabaseHas('messages', ['external_id' => 'whatsapp:wamid-1', 'text' => 'Hello from WhatsApp', 'sender' => 'other']);
    }

    public function test_invalid_meta_signature_does_not_create_a_message(): void
    {
        config(['services.social.meta.app_secret' => 'meta-app-secret']);
        $user = User::factory()->create();
        PlatformConnection::create([
            'user_id' => $user->id,
            'platform' => 'whatsapp',
            'connected' => true,
            'access_token' => 'user-whatsapp-token',
            'metadata' => ['phone_number_id' => 'phone-123', 'business_account_id' => 'business-123'],
        ]);

        $response = $this->withHeader('X-Hub-Signature-256', 'sha256=wrong')->postJson('/api/v1/webhooks/meta', [
            'object' => 'whatsapp_business_account',
            'entry' => [],
        ]);

        $response->assertForbidden();
        $this->assertDatabaseCount('conversations', 0);
        $this->assertDatabaseCount('messages', 0);
    }

    public function test_facebook_webhook_is_routed_to_the_connected_page(): void
    {
        config(['services.social.meta.app_secret' => 'meta-app-secret']);
        $user = User::factory()->create();
        PlatformConnection::create([
            'user_id' => $user->id,
            'platform' => 'facebook',
            'connected' => true,
            'access_token' => 'page-token',
            'provider_user_id' => 'page-123',
            'metadata' => ['page_id' => 'page-123'],
        ]);
        $payload = [
            'object' => 'page',
            'entry' => [[
                'id' => 'page-123',
                'messaging' => [[
                    'sender' => ['id' => 'customer-123'],
                    'recipient' => ['id' => 'page-123'],
                    'timestamp' => 1791437200000,
                    'message' => ['mid' => 'mid-1', 'text' => 'Hello from Messenger'],
                ]],
            ]],
        ];
        $body = json_encode($payload, JSON_THROW_ON_ERROR);

        $response = $this->call('POST', '/api/v1/webhooks/meta', [], [], [], [
            'CONTENT_TYPE' => 'application/json',
            'HTTP_X_HUB_SIGNATURE_256' => 'sha256='.hash_hmac('sha256', $body, 'meta-app-secret'),
        ], $body);

        $response->assertOk();
        $this->assertDatabaseHas('messages', ['external_id' => 'facebook:mid-1', 'text' => 'Hello from Messenger']);
    }

    public function test_whatsapp_reply_is_sent_using_the_user_connection(): void
    {
        Http::preventStrayRequests();
        Http::fake([
            'https://graph.facebook.com/v22.0/phone-123/messages' => Http::response(['messages' => [['id' => 'wamid-outbound-1']]]),
        ]);
        $registration = $this->postJson('/api/v1/auth/register', ['name' => 'WhatsApp User', 'email' => 'whatsapp@example.com', 'password' => 'password123']);
        $token = $registration->json('token');
        $user = User::query()->where('email', 'whatsapp@example.com')->firstOrFail();
        PlatformConnection::create([
            'user_id' => $user->id,
            'platform' => 'whatsapp',
            'connected' => true,
            'access_token' => 'user-whatsapp-token',
            'provider_user_id' => 'phone-123',
            'metadata' => ['phone_number_id' => 'phone-123', 'business_account_id' => 'business-123'],
        ]);
        $conversation = $user->conversations()->create(['external_id' => 'whatsapp:2348000000000', 'platform' => 'whatsapp', 'contact_name' => 'Ada Lovelace']);

        $response = $this->withToken($token)->postJson('/api/v1/conversations/'.$conversation->external_id.'/messages', ['text' => 'Thanks, I will check this now.']);

        $response->assertOk()->assertJsonPath('message.id', 'whatsapp:wamid-outbound-1');
        Http::assertSent(fn (ClientRequest $request): bool => $request->url() === 'https://graph.facebook.com/v22.0/phone-123/messages'
            && $request->data()['to'] === '2348000000000'
            && $request->data()['text']['body'] === 'Thanks, I will check this now.');
        $this->assertDatabaseHas('messages', ['conversation_id' => $conversation->id, 'external_id' => 'whatsapp:wamid-outbound-1', 'sender' => 'me']);
    }

    public function test_facebook_oauth_saves_the_selected_users_page_token_and_subscribes_the_page(): void
    {
        Http::preventStrayRequests();
        Http::fake([
            'https://graph.facebook.com/v22.0/oauth/access_token*' => Http::response(['access_token' => 'user-token', 'expires_in' => 5000]),
            'https://graph.facebook.com/v22.0/me/accounts*' => Http::response(['data' => [['id' => 'page-123', 'name' => 'Ada Store', 'access_token' => 'page-token']]]),
            'https://graph.facebook.com/v22.0/page-123/subscribed_apps' => Http::response(['success' => true]),
        ]);
        config([
            'services.social.facebook.client_id' => 'facebook-client',
            'services.social.facebook.client_secret' => 'facebook-secret',
            'services.social.callback' => 'https://unifiechat.test/api/v1/social/callback',
        ]);
        $user = User::factory()->create();
        Cache::put('social-oauth:facebook-state', ['user_id' => $user->id, 'provider' => 'facebook'], now()->addMinutes(5));

        $connection = app(SocialAuthService::class)->complete('oauth-code', 'facebook-state');

        $this->assertSame($user->id, $connection->user_id);
        $this->assertSame('page-token', $connection->access_token);
        $this->assertSame('page-123', $connection->provider_user_id);
        $this->assertSame('Ada Store', $connection->account_name);
        Http::assertSent(fn (ClientRequest $request): bool => $request->url() === 'https://graph.facebook.com/v22.0/page-123/subscribed_apps');
    }

    public function test_saving_whatsapp_credentials_subscribes_the_users_business_account(): void
    {
        Http::preventStrayRequests();
        Http::fake([
            'https://graph.facebook.com/v22.0/phone-123' => Http::response(['display_phone_number' => '+2348000000000']),
            'https://graph.facebook.com/v22.0/business-123/subscribed_apps' => Http::response(['success' => true]),
        ]);
        $user = User::factory()->create();

        $response = $this->withToken($this->registerToken($user))->postJson('/api/v1/social/whatsapp/credentials', [
            'access_token' => 'user-whatsapp-token',
            'phone_number_id' => 'phone-123',
            'business_account_id' => 'business-123',
        ]);

        $response->assertOk()->assertJson(['connected' => true, 'platform' => 'whatsapp', 'account_name' => '+2348000000000']);
        Http::assertSent(fn (ClientRequest $request): bool => $request->url() === 'https://graph.facebook.com/v22.0/business-123/subscribed_apps');
        $this->assertDatabaseHas('platform_connections', ['user_id' => $user->id, 'platform' => 'whatsapp', 'provider_user_id' => 'phone-123']);
    }

    private function registerToken(User $user): string
    {
        return $this->postJson('/api/v1/auth/login', ['email' => $user->email, 'password' => 'password'])->json('token');
    }
}
