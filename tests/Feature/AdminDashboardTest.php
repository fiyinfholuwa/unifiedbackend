<?php

namespace Tests\Feature;

use App\Models\Plan;
use App\Models\SupportRequest;
use App\Models\User;
use App\Models\Wallet;
use Database\Seeders\DatabaseSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Config;
use Tests\TestCase;

class AdminDashboardTest extends TestCase
{
    use RefreshDatabase;

    public function test_guest_is_redirected_and_non_admin_is_forbidden(): void
    {
        $this->get('/admin')->assertRedirect(route('admin.login'));

        $user = User::factory()->create();

        $this->actingAs($user)->get('/admin')->assertForbidden();
    }

    public function test_admin_can_sign_in_and_sign_out(): void
    {
        $admin = User::factory()->create(['email' => 'admin@example.com', 'is_admin' => true]);

        $this->post(route('admin.login.store'), ['email' => $admin->email, 'password' => 'password'])
            ->assertRedirect(route('admin.dashboard'));
        $this->assertAuthenticatedAs($admin);

        $this->post(route('admin.logout'))->assertRedirect(route('admin.login'));
        $this->assertGuest();
    }

    public function test_explicit_demo_admin_seeding_is_not_restricted_to_local_environment(): void
    {
        Config::set('admin.demo.enabled', true);

        $this->seed(DatabaseSeeder::class);

        $this->assertDatabaseHas('users', [
            'email' => 'demo-admin@unifiechat.test',
            'is_admin' => true,
            'is_active' => true,
        ]);
    }

    public function test_admin_can_view_dashboard_metrics_and_user_pages(): void
    {
        $admin = User::factory()->create(['name' => 'Admin User', 'is_admin' => true]);
        $user = User::factory()->create(['name' => 'Mobile Customer', 'email' => 'customer@example.com']);
        $user->subscription()->create(['plan_id' => 'free', 'period' => now()->format('Y-m'), 'usage' => 4]);

        $response = $this->actingAs($admin)->get('/admin');

        $response->assertOk()->assertSee('Manage the workspace')->assertSee('Recently registered users')->assertSee('4');
        $this->actingAs($admin)->get(route('admin.users'))->assertOk()->assertSee('User management')->assertSee('Mobile Customer');
    }

    public function test_admin_management_sections_render_as_separate_pages(): void
    {
        $admin = User::factory()->create(['is_admin' => true]);

        $this->actingAs($admin)->get(route('admin.support'))->assertOk()->assertSee('Support inbox');
        $this->actingAs($admin)->get(route('admin.kyc'))->assertOk()->assertSee('KYC review');
        $this->actingAs($admin)->get(route('admin.connections'))->assertOk()->assertSee('Live connections');
        $this->actingAs($admin)->get(route('admin.plans'))->assertOk()->assertSee('Plan controls');
        $this->actingAs($admin)->get(route('admin.profile'))->assertOk()->assertSee('My profile');
    }

    public function test_admin_can_update_support_kyc_user_status_and_plan(): void
    {
        $admin = User::factory()->create(['is_admin' => true]);
        $user = User::factory()->create(['name' => 'Managed Customer']);
        $support = SupportRequest::create(['user_id' => $user->id, 'subject' => 'Need help', 'message' => 'Please help.', 'status' => 'open']);
        $wallet = Wallet::create(['user_id' => $user->id, 'kyc_status' => 'pending', 'kyc_submitted_at' => now()]);
        Plan::whereKey('pro')->update(['name' => 'Pro', 'price_units' => 100, 'message_limit' => 1000, 'color' => '#4968E8', 'features' => [], 'is_active' => true, 'sort_order' => 2]);

        $this->actingAs($admin)->patch(route('admin.support-requests.status', $support), ['status' => 'resolved'])->assertRedirect();
        $this->actingAs($admin)->patch(route('admin.wallets.kyc', $wallet), ['kyc_status' => 'verified'])->assertRedirect();
        $this->actingAs($admin)->patch(route('admin.users.plan', $user), ['plan_id' => 'pro'])->assertRedirect();
        $this->actingAs($admin)->patch(route('admin.users.status', $user), ['is_active' => false])->assertRedirect();

        $this->assertDatabaseHas('support_requests', ['id' => $support->id, 'status' => 'resolved']);
        $this->assertDatabaseHas('wallets', ['id' => $wallet->id, 'kyc_status' => 'verified']);
        $this->assertDatabaseHas('subscriptions', ['user_id' => $user->id, 'plan_id' => 'pro']);
        $this->assertDatabaseHas('users', ['id' => $user->id, 'is_active' => false]);
    }

    public function test_admin_can_update_plan_settings(): void
    {
        $admin = User::factory()->create(['is_admin' => true]);
        Plan::whereKey('business')->update(['name' => 'Business', 'price_units' => 250, 'message_limit' => null, 'color' => '#8B5CF6', 'features' => ['Old feature'], 'is_active' => true, 'sort_order' => 3]);
        $plan = Plan::findOrFail('business');

        $this->actingAs($admin)->patch(route('admin.plans.update', $plan), [
            'name' => 'Growth',
            'price_units' => 300,
            'message_limit' => '',
            'color' => '#123456',
            'features' => "Unlimited messages\nPriority support",
            'is_active' => 1,
        ])->assertRedirect();

        $this->assertDatabaseHas('plans', ['id' => 'business', 'name' => 'Growth', 'price_units' => 300, 'color' => '#123456']);
        $this->assertSame(['Unlimited messages', 'Priority support'], Plan::find('business')->features);
    }

    public function test_admin_actions_and_profile_updates_support_ajax_responses(): void
    {
        $admin = User::factory()->create(['name' => 'Admin User', 'is_admin' => true]);
        $support = SupportRequest::create(['user_id' => $admin->id, 'subject' => 'Need help', 'message' => 'Please help.', 'status' => 'open']);

        $this->actingAs($admin)
            ->withHeader('Accept', 'application/json')
            ->patch(route('admin.support-requests.status', $support), ['status' => 'resolved'])
            ->assertOk()
            ->assertJson(['message' => 'Support request status updated.', 'status' => 'resolved']);

        $this->actingAs($admin)
            ->withHeader('Accept', 'application/json')
            ->patch(route('admin.profile.update'), ['name' => 'Updated Admin', 'email' => $admin->email])
            ->assertOk()
            ->assertJsonPath('user.name', 'Updated Admin');

        $this->assertDatabaseHas('users', ['id' => $admin->id, 'name' => 'Updated Admin']);
    }

    public function test_inactive_user_cannot_log_into_the_mobile_api(): void
    {
        $user = User::factory()->create(['email' => 'inactive@example.com', 'is_active' => false]);

        $this->postJson('/unified-api/v1/auth/login', ['email' => $user->email, 'password' => 'password'])
            ->assertUnprocessable()
            ->assertJson(['message' => 'Invalid email or password.']);
    }
}
