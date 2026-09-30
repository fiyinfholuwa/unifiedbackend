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

    protected $fillable = ['user_id', 'kyc_status', 'kyc_name', 'balance', 'account_number', 'payment_session'];

    protected $casts = ['payment_session' => 'array'];

    public function transactions(): HasMany
    {
        return $this->hasMany(WalletTransaction::class);
    }
}
