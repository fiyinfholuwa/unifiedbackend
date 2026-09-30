<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('plans', function (Blueprint $table) {
            $table->string('id')->primary();
            $table->string('name');
            $table->unsignedInteger('price_units')->default(0);
            $table->unsignedInteger('message_limit')->nullable();
            $table->string('color', 20)->default('#778196');
            $table->json('features')->nullable();
            $table->boolean('is_active')->default(true);
            $table->unsignedSmallInteger('sort_order')->default(0);
            $table->timestamps();
        });

        $timestamp = now();

        DB::table('plans')->insert([
            ['id' => 'free', 'name' => 'Free', 'price_units' => 0, 'message_limit' => 50, 'color' => '#778196', 'features' => json_encode(['Connect every social account', '50 sent messages / month', 'Unified inbox']), 'is_active' => true, 'sort_order' => 1, 'created_at' => $timestamp, 'updated_at' => $timestamp],
            ['id' => 'pro', 'name' => 'Pro', 'price_units' => 100, 'message_limit' => 1000, 'color' => '#4968E8', 'features' => json_encode(['Connect every social account', '1,000 sent messages / month', 'Priority support', 'Advanced search']), 'is_active' => true, 'sort_order' => 2, 'created_at' => $timestamp, 'updated_at' => $timestamp],
            ['id' => 'business', 'name' => 'Business', 'price_units' => 250, 'message_limit' => null, 'color' => '#8B5CF6', 'features' => json_encode(['Connect every social account', 'Unlimited sent messages', 'Team-ready workspace', 'Priority support']), 'is_active' => true, 'sort_order' => 3, 'created_at' => $timestamp, 'updated_at' => $timestamp],
        ]);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('plans');
    }
};
