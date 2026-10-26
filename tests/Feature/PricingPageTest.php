<?php

namespace Tests\Feature;

use App\Models\Plan;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PricingPageTest extends TestCase
{
    use RefreshDatabase;

    public function test_home_page_shows_only_the_first_three_active_plans(): void
    {
        Plan::query()->delete();

        foreach (range(1, 4) as $sortOrder) {
            Plan::create([
                'id' => "plan-{$sortOrder}",
                'name' => "Plan {$sortOrder}",
                'billing_type' => 'monthly',
                'price_units' => 100,
                'price_ngn' => 1000,
                'message_limit' => 100,
                'color' => '#4968E8',
                'features' => ['Unified inbox'],
                'description' => 'A plan description.',
                'best_for' => 'Growing teams',
                'is_active' => true,
                'sort_order' => $sortOrder,
            ]);
        }

        $this->get(route('home'))
            ->assertOk()
            ->assertSee('Plan 1')
            ->assertSee('Plan 2')
            ->assertSee('Plan 3')
            ->assertDontSee('Plan 4');
    }

    public function test_pricing_page_shows_all_active_plans_and_is_linked_from_home(): void
    {
        Plan::query()->delete();

        foreach (range(1, 4) as $sortOrder) {
            Plan::create([
                'id' => "plan-{$sortOrder}",
                'name' => "Plan {$sortOrder}",
                'billing_type' => 'monthly',
                'price_units' => 100,
                'price_ngn' => 1000,
                'message_limit' => 100,
                'color' => '#4968E8',
                'features' => ['Unified inbox'],
                'description' => 'A plan description.',
                'best_for' => 'Growing teams',
                'is_active' => true,
                'sort_order' => $sortOrder,
            ]);
        }

        $this->get(route('pricing'))
            ->assertOk()
            ->assertSee('Plan 4');

        $this->get(route('home'))
            ->assertSee(route('pricing'), false)
            ->assertSee('View all pricing');
    }
}
