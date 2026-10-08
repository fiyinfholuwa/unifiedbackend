<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        $conversationIds = DB::table('conversations')
            ->whereIn('external_id', ['conv1', 'conv2', 'conv3', 'conv4', 'conv5', 'conv6', 'conv7'])
            ->pluck('id');

        DB::table('messages')->whereIn('conversation_id', $conversationIds)->delete();
        DB::table('conversations')->whereIn('id', $conversationIds)->delete();
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void {}
};
