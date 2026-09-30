<?php

namespace Tests\Feature;

use App\Models\Plan;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class ApiFlowTest extends TestCase
{
    use RefreshDatabase;

    public function test_user_can_register_and_persist_a_message(): void
    {
        $response = $this->postJson('/api/v1/auth/register', ['name' => 'Jane', 'email' => 'jane@example.com', 'password' => 'password123']);
        $response->assertCreated();
        $token = $response->json('token');
        $response->assertJsonPath('user.email', 'jane@example.com');
        $this->withToken($token)->postJson('/api/v1/platforms/facebook/connect')->assertOk();
        $this->withToken($token)->postJson('/api/v1/conversations/conv1/messages', ['text' => 'Persist me'])->assertOk();
        $this->withToken($token)->getJson('/api/v1/conversations/conv1/messages')->assertOk()->assertJsonFragment(['text' => 'Persist me']);
    }

    public function test_wallet_and_subscription_flows_are_persisted(): void
    {
        Storage::fake('local');
        $response = $this->postJson('/api/v1/auth/register', ['name' => 'Wallet User', 'email' => 'wallet@example.com', 'password' => 'password123']);
        $token = $response->json('token');
        $this->withToken($token)->post('/api/v1/wallet/kyc', ['businessName' => 'Wallet Business', 'nin' => '12345678901', 'ninDocument' => UploadedFile::fake()->image('nin.jpg')])->assertOk()->assertJsonPath('wallet.kyc_status', 'pending');
        $this->withToken($token)->postJson('/api/v1/wallet/payment-session', ['amount' => 100])->assertStatus(422)->assertJson(['message' => 'KYC_REQUIRED']);
        User::where('email', 'wallet@example.com')->firstOrFail()->wallet()->update(['kyc_status' => 'verified']);
        $this->withToken($token)->postJson('/api/v1/wallet/payment-session', ['amount' => 100])->assertOk();
        $this->withToken($token)->postJson('/api/v1/wallet/payment-session/confirm')->assertJson(['success' => true]);
        $this->withToken($token)->putJson('/api/v1/subscription', ['planId' => 'pro'])->assertOk();
        $this->withToken($token)->getJson('/api/v1/wallet')->assertJsonPath('wallet.balance', 100);
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
        $this->withToken($response->json('token'))->putJson('/api/v1/subscription', ['planId' => 'pro'])->assertOk()->assertJsonPath('subscription.plan.name', 'Growth');
    }
}
