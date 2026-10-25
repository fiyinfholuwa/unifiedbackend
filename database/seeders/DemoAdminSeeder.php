<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;

class DemoAdminSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        if (! config('admin.demo.enabled')) {
            $this->command?->warn('Demo admin seeding is disabled. Set ADMIN_DEMO_ENABLED=true to enable it.');

            return;
        }

        User::updateOrCreate(
            ['email' => config('admin.demo.email')],
            [
                'name' => 'Demo Admin',
                'password' => config('admin.demo.password'),
                'is_admin' => true,
                'is_active' => true,
            ],
        );

        $this->command?->info('Demo admin account seeded: '.config('admin.demo.email'));
    }
}
