<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('platform_connections', function (Blueprint $table) {
            $table->text('access_token')->nullable();
            $table->text('refresh_token')->nullable();
            $table->string('provider_user_id')->nullable();
            $table->string('account_name')->nullable();
            $table->json('metadata')->nullable();
            $table->timestamp('expires_at')->nullable();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('platform_connections', function (Blueprint $table) {
            $table->dropColumn(['access_token', 'refresh_token', 'provider_user_id', 'account_name', 'metadata', 'expires_at']);
        });
    }
};
