<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $this->call(PricingSeeder::class);

        if (config('admin.demo.enabled') && app()->environment('local')) {
            User::updateOrCreate(
                ['email' => config('admin.demo.email')],
                [
                    'name' => 'Demo Admin',
                    'password' => config('admin.demo.password'),
                    'is_admin' => true,
                    'is_active' => true,
                ],
            );
        }

        // User::factory(10)->create();

        User::factory()->create([
            'name' => 'Test User',
            'email' => 'test@example.com',
        ]);
    }
}
