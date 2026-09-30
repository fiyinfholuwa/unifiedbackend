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
        Schema::table('wallets', function (Blueprint $table) {
            $table->string('kyc_business_name')->nullable()->after('kyc_name');
            $table->text('kyc_nin')->nullable()->after('kyc_business_name');
            $table->string('kyc_document_path')->nullable()->after('kyc_nin');
            $table->timestamp('kyc_submitted_at')->nullable()->after('kyc_document_path');
            $table->timestamp('kyc_reviewed_at')->nullable()->after('kyc_submitted_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('wallets', function (Blueprint $table) {
            $table->dropColumn(['kyc_business_name', 'kyc_nin', 'kyc_document_path', 'kyc_submitted_at', 'kyc_reviewed_at']);
        });
    }
};
