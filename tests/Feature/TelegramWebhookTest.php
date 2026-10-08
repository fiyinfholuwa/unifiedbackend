<?php

namespace Tests\Feature;

use App\Models\Conversation;
use App\Models\Message;
use App\Models\PlatformConnection;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Client\Request as ClientRequest;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class TelegramWebhookTest extends TestCase
{
    use RefreshDatabase;

    public function test_valid_telegram_update_creates_one_message_when_delivered_twice(): void
    {
        $user = User::factory()->create();
        $botToken = '123456:telegram-token';
        $connection = PlatformConnection::create([
            'user_id' => $user->id,
            'platform' => 'telegram',
            'connected' => true,
            'access_token' => $botToken,
            'metadata' => ['telegram_webhook_configured' => true],
        ]);
        $secret = hash_hmac('sha256', 'unifiechat-telegram-webhook', $botToken);
        $payload = [
            'update_id' => 7001,
            'message' => [
                'message_id' => 42,
                'date' => 1_791_437_200,
                'chat' => ['id' => 998877, 'first_name' => 'Ada', 'last_name' => 'Lovelace', 'type' => 'private'],
                'text' => 'Hello from Telegram',
            ],
        ];

        $firstResponse = $this->withHeader('X-Telegram-Bot-Api-Secret-Token', $secret)->postJson('/api/v1/webhooks/telegram', $payload);
        $secondResponse = $this->withHeader('X-Telegram-Bot-Api-Secret-Token', $secret)->postJson('/api/v1/webhooks/telegram', $payload);

        $firstResponse->assertOk()->assertJson(['ok' => true]);
        $secondResponse->assertOk()->assertJson(['ok' => true]);

        $conversation = Conversation::query()->where('user_id', $user->id)->firstOrFail();
        $message = Message::query()->where('conversation_id', $conversation->id)->firstOrFail();

        $this->assertModelExists($connection);
        $this->assertModelExists($conversation);
        $this->assertModelExists($message);
        $this->assertSame('Ada Lovelace', $conversation->contact_name);
        $this->assertSame('Hello from Telegram', $message->text);
        $this->assertSame('other', $message->sender);
        $this->assertDatabaseCount('messages', 1);
    }

    public function test_invalid_telegram_webhook_secret_does_not_create_a_message(): void
    {
        $user = User::factory()->create();
        PlatformConnection::create([
            'user_id' => $user->id,
            'platform' => 'telegram',
            'connected' => true,
            'access_token' => '123456:telegram-token',
        ]);

        $response = $this->withHeader('X-Telegram-Bot-Api-Secret-Token', 'wrong-secret')->postJson('/api/v1/webhooks/telegram', [
            'update_id' => 7002,
            'message' => ['message_id' => 43, 'chat' => ['id' => 998878], 'text' => 'Should not arrive'],
        ]);

        $response->assertForbidden();
        $this->assertDatabaseCount('conversations', 0);
        $this->assertDatabaseCount('messages', 0);
    }

    public function test_saving_telegram_credentials_registers_the_webhook(): void
    {
        config(['app.url' => 'https://unifiechat.test']);
        Http::preventStrayRequests();
        Http::fake([
            'https://api.telegram.org/bot123456:telegram-token/getMe' => Http::response(['ok' => true, 'result' => ['id' => 123456, 'username' => 'unifiechat_bot']]),
            'https://api.telegram.org/bot123456:telegram-token/setWebhook' => Http::response(['ok' => true, 'result' => true]),
        ]);

        $registration = $this->postJson('/api/v1/auth/register', ['name' => 'Telegram User', 'email' => 'telegram@example.com', 'password' => 'password123']);
        $token = $registration->json('token');

        $response = $this->withToken($token)->postJson('/api/v1/social/telegram/credentials', ['bot_token' => '123456:telegram-token']);

        $response->assertOk()->assertJson(['connected' => true, 'platform' => 'telegram', 'account_name' => 'unifiechat_bot']);
        Http::assertSent(fn (ClientRequest $request): bool => $request->url() === 'https://api.telegram.org/bot123456:telegram-token/setWebhook'
            && $request->data()['url'] === 'https://unifiechat.test/api/v1/webhooks/telegram');
        $this->assertTrue((bool) PlatformConnection::query()->firstOrFail()->metadata['telegram_webhook_configured']);
    }

    public function test_telegram_reply_is_sent_through_the_connected_bot(): void
    {
        Http::preventStrayRequests();
        Http::fake([
            'https://api.telegram.org/bot123456:telegram-token/sendMessage' => Http::response(['ok' => true, 'result' => ['message_id' => 99]]),
        ]);

        $registration = $this->postJson('/api/v1/auth/register', ['name' => 'Reply User', 'email' => 'reply@example.com', 'password' => 'password123']);
        $token = $registration->json('token');
        $user = User::query()->where('email', 'reply@example.com')->firstOrFail();
        PlatformConnection::create(['user_id' => $user->id, 'platform' => 'telegram', 'connected' => true, 'access_token' => '123456:telegram-token']);
        $conversation = $user->conversations()->create(['external_id' => '998877', 'platform' => 'telegram', 'contact_name' => 'Ada Lovelace']);

        $response = $this->withToken($token)->postJson('/api/v1/conversations/'.$conversation->external_id.'/messages', ['text' => 'Thanks, I will check this now.']);

        $response->assertOk()->assertJsonPath('message.id', 'telegram:99');
        Http::assertSent(fn (ClientRequest $request): bool => $request->url() === 'https://api.telegram.org/bot123456:telegram-token/sendMessage'
            && $request->data()['chat_id'] === '998877'
            && $request->data()['text'] === 'Thanks, I will check this now.');
        $this->assertDatabaseHas('messages', ['conversation_id' => $conversation->id, 'external_id' => 'telegram:99', 'sender' => 'me']);
    }
}
