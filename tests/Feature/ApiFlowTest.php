<?php

namespace Tests\Feature;

use App\Models\Plan;
use App\Models\PlatformConnection;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class ApiFlowTest extends TestCase
{
    use RefreshDatabase;

    public function test_user_can_register_and_persist_a_message(): void
    {
        Http::preventStrayRequests();
        Http::fake(['https://graph.facebook.com/v22.0/me/messages' => Http::response(['message_id' => 'mid-1'])]);
        $response = $this->postJson('/api/v1/auth/register', ['name' => 'Jane', 'email' => 'jane@example.com', 'password' => 'password123']);
        $response->assertCreated();
        $token = $response->json('token');
        $response->assertJsonPath('user.email', 'jane@example.com');
        $user = User::query()->where('email', 'jane@example.com')->firstOrFail();
        PlatformConnection::create(['user_id' => $user->id, 'platform' => 'facebook', 'connected' => true, 'access_token' => 'page-token', 'provider_user_id' => 'page-1', 'metadata' => ['page_id' => 'page-1']]);
        $user->conversations()->create(['external_id' => 'facebook:conv1', 'platform' => 'facebook', 'contact_name' => 'Jane Contact']);
        $this->withToken($token)->postJson('/api/v1/conversations/facebook:conv1/messages', ['text' => 'Persist me'])->assertOk();
        $this->withToken($token)->getJson('/api/v1/conversations/facebook:conv1/messages')->assertOk()->assertJsonFragment(['text' => 'Persist me']);
        $this->assertDatabaseHas('subscriptions', ['user_id' => $user->id, 'usage' => 1]);
    }

    public function test_message_limit_and_media_sending_are_enforced_server_side(): void
    {
        Http::preventStrayRequests();
        $response = $this->postJson('/api/v1/auth/register', ['name' => 'Quota User', 'email' => 'quota@example.com', 'password' => 'password123']);
        $token = $response->json('token');
        $user = User::where('email', 'quota@example.com')->firstOrFail();
        PlatformConnection::create(['user_id' => $user->id, 'platform' => 'facebook', 'connected' => true, 'access_token' => 'page-token', 'provider_user_id' => 'page-1', 'metadata' => ['page_id' => 'page-1']]);
        $conversation = $user->conversations()->create(['external_id' => 'facebook:quota', 'platform' => 'facebook', 'contact_name' => 'Quota Contact']);
        $user->subscription()->update(['usage' => 50]);

        $this->withToken($token)->postJson('/api/v1/conversations/'.$conversation->external_id.'/messages', ['text' => 'Blocked'])->assertStatus(422)->assertJson(['message' => 'MESSAGE_LIMIT_REACHED']);
        $this->withToken($token)->postJson('/api/v1/conversations/'.$conversation->external_id.'/messages', ['uri' => 'file:///photo.jpg', 'type' => 'image'])->assertStatus(422)->assertJson(['message' => 'MESSAGE_LIMIT_REACHED']);
        $this->assertDatabaseCount('messages', 0);
    }

    public function test_media_send_is_rejected_when_the_user_has_remaining_quota(): void
    {
        $response = $this->postJson('/api/v1/auth/register', ['name' => 'Media User', 'email' => 'media@example.com', 'password' => 'password123']);
        $token = $response->json('token');
        $user = User::where('email', 'media@example.com')->firstOrFail();
        PlatformConnection::create(['user_id' => $user->id, 'platform' => 'facebook', 'connected' => true, 'access_token' => 'page-token', 'provider_user_id' => 'page-1', 'metadata' => ['page_id' => 'page-1']]);
        $conversation = $user->conversations()->create(['external_id' => 'facebook:media', 'platform' => 'facebook', 'contact_name' => 'Media Contact']);

        $this->withToken($token)->postJson('/api/v1/conversations/'.$conversation->external_id.'/messages', ['uri' => 'file:///photo.jpg', 'type' => 'image'])->assertStatus(422)->assertJson(['message' => 'MEDIA_MESSAGING_NOT_SUPPORTED']);
        $this->assertDatabaseCount('messages', 0);
    }

    public function test_logout_revokes_the_current_token_and_expired_tokens_are_rejected(): void
    {
        $response = $this->postJson('/api/v1/auth/register', ['name' => 'Token User', 'email' => 'token@example.com', 'password' => 'password123']);
        $token = $response->json('token');

        $this->withToken($token)->deleteJson('/api/v1/auth/session')->assertOk();
        $this->withToken($token)->getJson('/api/v1/auth/me')->assertUnauthorized();

        $user = User::where('email', 'token@example.com')->firstOrFail();
        $expired = 'expired-token';
        $user->apiTokens()->create(['token_hash' => hash('sha256', $expired), 'expires_at' => now()->subMinute()]);
        $this->withToken($expired)->getJson('/api/v1/auth/me')->assertUnauthorized();
    }

    public function test_password_reset_uses_an_expiring_hashed_code_and_revokes_sessions(): void
    {
        Mail::fake();
        $response = $this->postJson('/api/v1/auth/register', ['name' => 'Reset User', 'email' => 'reset@example.com', 'password' => 'password123']);
        $token = $response->json('token');

        $this->postJson('/api/v1/auth/forgot-password', ['email' => 'reset@example.com'])->assertOk()->assertJson(['success' => true]);
        $reset = DB::table('password_reset_tokens')->where('email', 'reset@example.com')->first();
        $this->assertNotNull($reset);
        $this->assertStringStartsWith('$2y$', $reset->token);
        $this->assertDatabaseHas('api_tokens', ['user_id' => User::where('email', 'reset@example.com')->value('id')]);
        DB::table('password_reset_tokens')->where('email', 'reset@example.com')->update(['token' => Hash::make('654321')]);
        $this->postJson('/api/v1/auth/reset-password', ['email' => 'reset@example.com', 'code' => '654321', 'password' => 'newpassword123'])->assertOk()->assertJson(['success' => true]);

        $user = User::where('email', 'reset@example.com')->firstOrFail();
        $this->assertTrue(Hash::check('newpassword123', $user->password));
        $this->assertDatabaseCount('api_tokens', 0);
        $this->assertDatabaseMissing('password_reset_tokens', ['email' => 'reset@example.com']);
    }

    public function test_new_users_do_not_receive_demo_conversations(): void
    {
        $response = $this->postJson('/api/v1/auth/register', ['name' => 'Inbox User', 'email' => 'inbox@example.com', 'password' => 'password123']);

        $this->withToken($response->json('token'))->getJson('/api/v1/conversations')->assertOk()->assertJson(['conversations' => []]);
    }

    public function test_platform_cannot_be_marked_connected_without_provider_credentials(): void
    {
        $response = $this->postJson('/api/v1/auth/register', ['name' => 'Connection User', 'email' => 'connection@example.com', 'password' => 'password123']);

        $this->withToken($response->json('token'))->postJson('/api/v1/platforms/facebook/connect')
            ->assertStatus(422)
            ->assertJson(['message' => 'Start the platform sign-in flow to connect this account.']);
        $this->assertDatabaseCount('platform_connections', 0);
    }

    public function test_wallet_and_subscription_flows_are_persisted(): void
    {
        Storage::fake('local');
        $response = $this->postJson('/api/v1/auth/register', ['name' => 'Wallet User', 'email' => 'wallet@example.com', 'password' => 'password123']);
        $token = $response->json('token');
        $this->withToken($token)->post('/api/v1/wallet/kyc', ['businessName' => 'Wallet Business', 'nin' => '12345678901', 'ninDocument' => UploadedFile::fake()->image('nin.jpg')])->assertOk()->assertJsonPath('wallet.kyc_status', 'pending');
        $this->withToken($token)->postJson('/api/v1/wallet/payment-session', ['amount' => 100, 'method' => 'globus_bank_transfer'])->assertStatus(422)->assertJson(['message' => 'KYC_REQUIRED']);
        User::where('email', 'wallet@example.com')->firstOrFail()->wallet()->update(['kyc_status' => 'verified']);
        $this->withToken($token)->postJson('/api/v1/wallet/payment-session', ['amount' => 100, 'method' => 'paystack'])->assertStatus(422)->assertJson(['message' => 'PAYSTACK_NOT_CONFIGURED']);
        $this->withToken($token)->postJson('/api/v1/wallet/payment-session', ['amount' => 100, 'method' => 'globus_bank_transfer'])->assertOk();
        $this->withToken($token)->postJson('/api/v1/wallet/payment-session/confirm')->assertJson(['success' => true]);
        $this->withToken($token)->putJson('/api/v1/subscription', ['planId' => 'pro'])->assertOk();
        $this->withToken($token)->getJson('/api/v1/wallet')->assertJsonPath('wallet.balance', 0);
        $this->withToken($token)->getJson('/api/v1/subscription')->assertJsonPath('subscription.plan_id', 'pro');
    }

    public function test_subscription_plans_are_loaded_from_the_database(): void
    {
        Plan::whereKey('pro')->update(['name' => 'Growth', 'price_units' => 175, 'message_limit' => 2500]);

        $this->getJson('/api/v1/plans')
            ->assertOk()
            ->assertJsonPath('plans.1.name', 'Growth')
            ->assertJsonPath('plans.1.price_units', 175)
            ->assertJsonPath('plans.1.message_limit', 2500);

        $response = $this->postJson('/api/v1/auth/register', ['name' => 'Plan User', 'email' => 'plan@example.com', 'password' => 'password123']);
        User::where('email', 'plan@example.com')->firstOrFail()->wallet()->update(['kyc_status' => 'verified', 'balance' => 175]);
        $this->withToken($response->json('token'))->putJson('/api/v1/subscription', ['planId' => 'pro'])->assertOk()->assertJsonPath('subscription.plan.name', 'Growth');
    }

    public function test_paid_plan_activation_is_rejected_without_verified_funded_wallet(): void
    {
        $response = $this->postJson('/api/v1/auth/register', ['name' => 'Paid User', 'email' => 'paid@example.com', 'password' => 'password123']);
        $token = $response->json('token');

        $this->withToken($token)->putJson('/api/v1/subscription', ['planId' => 'pro'])->assertStatus(422)->assertJson(['message' => 'KYC_REQUIRED']);
        User::where('email', 'paid@example.com')->firstOrFail()->wallet()->update(['kyc_status' => 'verified']);
        $this->withToken($token)->putJson('/api/v1/subscription', ['planId' => 'pro'])->assertStatus(422)->assertJson(['message' => 'INSUFFICIENT_UNITS']);
    }

    public function test_user_can_update_profile_and_upload_avatar(): void
    {
        Storage::fake('public');
        $response = $this->postJson('/api/v1/auth/register', ['name' => 'Profile User', 'email' => 'profile@example.com', 'password' => 'password123']);

        $this->withToken($response->json('token'))->patch('/api/v1/auth/profile', [
            'name' => 'Updated Profile',
            'email' => 'updated@example.com',
            'bio' => 'A short profile bio.',
            'avatar' => UploadedFile::fake()->image('avatar.jpg'),
        ])->assertOk()->assertJsonPath('user.email', 'updated@example.com')->assertJsonPath('user.name', 'Updated Profile');
    }

    public function test_user_can_submit_support_request(): void
    {
        $response = $this->postJson('/api/v1/auth/register', ['name' => 'Support User', 'email' => 'support@example.com', 'password' => 'password123']);

        $this->withToken($response->json('token'))->postJson('/api/v1/support-requests', [
            'mode' => 'feedback',
            'subject' => 'A useful idea',
            'message' => 'Please add message templates.',
        ])->assertOk()->assertJson(['success' => true]);
    }
}
