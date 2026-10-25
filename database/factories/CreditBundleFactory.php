<?php

namespace Database\Factories;

use App\Models\CreditBundle;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<CreditBundle>
 */
class CreditBundleFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'id' => fake()->unique()->slug(2),
            'name' => fake()->words(2, true),
            'credits' => 100,
            'price_ngn' => 1000,
            'is_active' => true,
            'sort_order' => 1,
        ];
    }
}
