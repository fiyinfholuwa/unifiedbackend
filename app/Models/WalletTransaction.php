<?php

namespace App\Models;

use Database\Factories\WalletTransactionFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class WalletTransaction extends Model
{
    /** @use HasFactory<WalletTransactionFactory> */
    use HasFactory;

    protected $fillable = ['wallet_id', 'type', 'title', 'amount', 'direction', 'occurred_at'];

    protected $casts = ['occurred_at' => 'datetime'];
}
