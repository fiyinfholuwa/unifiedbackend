<?php

namespace App\Models;

use Database\Factories\PlatformConnectionFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PlatformConnection extends Model
{
    /** @use HasFactory<PlatformConnectionFactory> */
    use HasFactory;

    protected $fillable = ['user_id', 'platform', 'connected', 'access_token', 'refresh_token', 'provider_user_id', 'account_name', 'metadata', 'expires_at'];

    protected $hidden = ['access_token', 'refresh_token'];

    protected $casts = ['connected' => 'boolean', 'access_token' => 'encrypted', 'refresh_token' => 'encrypted', 'metadata' => 'array', 'expires_at' => 'datetime'];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
