<?php

namespace App\Models;

use Database\Factories\WalletFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Wallet extends Model
{
    /** @use HasFactory<WalletFactory> */
    use HasFactory;

    protected $fillable = ['user_id', 'kyc_status', 'kyc_name', 'kyc_business_name', 'kyc_nin', 'kyc_document_path', 'kyc_submitted_at', 'kyc_reviewed_at', 'balance', 'account_number', 'payment_session'];

    protected $hidden = ['kyc_nin', 'kyc_document_path'];

    protected function casts(): array
    {
        return [
            'payment_session' => 'array',
            'kyc_nin' => 'encrypted',
            'kyc_submitted_at' => 'datetime',
            'kyc_reviewed_at' => 'datetime',
        ];
    }

    public function transactions(): HasMany
    {
        return $this->hasMany(WalletTransaction::class);
    }
}
