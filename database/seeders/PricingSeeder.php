<?php

namespace Database\Seeders;

use App\Models\CreditBundle;
use App\Models\Plan;
use Illuminate\Database\Seeder;

class PricingSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $timestamp = now();

        $plans = [
            [
                'id' => 'free',
                'name' => 'Basic',
                'billing_type' => 'free',
                'price_units' => 0,
                'price_ngn' => 0,
                'price_per_reply_ngn' => null,
                'message_limit' => 50,
                'reply_allowance' => 50,
                'channel_limit' => 2,
                'user_limit' => 1,
                'color' => '#778196',
                'features' => ['50 free successful replies once per account', 'Up to 2 connected channels', '1 user account', 'Unified inbox and incoming notifications', 'Basic conversation history'],
                'description' => 'Try Unified Chat and manage your first customer conversations without a subscription.',
                'best_for' => 'Small businesses trying Unified Chat',
                'is_lifetime_allowance' => true,
                'is_active' => true,
                'sort_order' => 1,
            ],
            [
                'id' => 'pro',
                'name' => 'Premium',
                'billing_type' => 'monthly',
                'price_units' => 500,
                'price_ngn' => 5000,
                'price_per_reply_ngn' => null,
                'message_limit' => 1000,
                'reply_allowance' => 1000,
                'channel_limit' => 5,
                'user_limit' => 1,
                'color' => '#4968E8',
                'features' => ['1,000 successful replies per billing month', 'Up to 5 connected channels', 'Unified inbox and notifications', 'Search conversation history', 'Saved replies', 'Basic message activity analytics', 'Priority support'],
                'description' => 'Predictable monthly pricing and more tools for growing customer conversations.',
                'best_for' => 'SMEs with regular daily conversations',
                'is_lifetime_allowance' => false,
                'is_active' => true,
                'sort_order' => 2,
            ],
            [
                'id' => 'payg',
                'name' => 'Pay-As-You-Go',
                'billing_type' => 'payg',
                'price_units' => 0,
                'price_ngn' => 10,
                'price_per_reply_ngn' => 10,
                'message_limit' => null,
                'reply_allowance' => null,
                'channel_limit' => 5,
                'user_limit' => 1,
                'color' => '#8B5CF6',
                'features' => ['50 free replies for new accounts once', '₦10 per successful reply after the free allowance', 'No recurring subscription', 'Prepaid reply credits', 'Usage and remaining-credit tracking'],
                'description' => 'Buy reply credits as needed without committing to a monthly subscription.',
                'best_for' => 'Seasonal or irregular usage',
                'is_lifetime_allowance' => true,
                'is_active' => true,
                'sort_order' => 3,
            ],
        ];

        foreach ($plans as $plan) {
            Plan::updateOrCreate(['id' => $plan['id']], [...$plan, 'created_at' => $timestamp, 'updated_at' => $timestamp]);
        }

        Plan::whereKey('business')->update(['is_active' => false]);

        foreach ([
            ['id' => 'starter-100', 'name' => '100 replies', 'credits' => 100, 'price_ngn' => 1000, 'sort_order' => 1],
            ['id' => 'growth-250', 'name' => '250 replies', 'credits' => 250, 'price_ngn' => 2250, 'sort_order' => 2],
            ['id' => 'scale-500', 'name' => '500 replies', 'credits' => 500, 'price_ngn' => 4000, 'sort_order' => 3],
        ] as $bundle) {
            CreditBundle::updateOrCreate(['id' => $bundle['id']], [...$bundle, 'is_active' => true, 'created_at' => $timestamp, 'updated_at' => $timestamp]);
        }
    }
}
