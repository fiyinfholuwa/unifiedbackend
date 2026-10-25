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
        Schema::table('plans', function (Blueprint $table) {
            $table->string('billing_type', 20)->default('monthly')->after('id');
            $table->unsignedInteger('price_ngn')->default(0)->after('price_units');
            $table->unsignedInteger('price_per_reply_ngn')->nullable()->after('price_ngn');
            $table->unsignedInteger('reply_allowance')->nullable()->after('message_limit');
            $table->unsignedSmallInteger('channel_limit')->nullable()->after('reply_allowance');
            $table->unsignedSmallInteger('user_limit')->default(1)->after('channel_limit');
            $table->text('description')->nullable()->after('features');
            $table->string('best_for')->nullable()->after('description');
            $table->boolean('is_lifetime_allowance')->default(false)->after('best_for');
        });

        Schema::table('subscriptions', function (Blueprint $table) {
            $table->unsignedInteger('free_replies_used')->default(0)->after('usage');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('plans', function (Blueprint $table) {
            $table->dropColumn(['billing_type', 'price_ngn', 'price_per_reply_ngn', 'reply_allowance', 'channel_limit', 'user_limit', 'description', 'best_for', 'is_lifetime_allowance']);
        });

        Schema::table('subscriptions', function (Blueprint $table) {
            $table->dropColumn('free_replies_used');
        });
    }
};
