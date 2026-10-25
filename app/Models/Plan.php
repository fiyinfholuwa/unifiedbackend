<?php

namespace App\Models;

use Database\Factories\PlanFactory;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Plan extends Model
{
    /** @use HasFactory<PlanFactory> */
    use HasFactory;

    public $incrementing = false;

    protected $keyType = 'string';

    protected $fillable = ['id', 'name', 'billing_type', 'price_units', 'price_ngn', 'price_per_reply_ngn', 'message_limit', 'reply_allowance', 'channel_limit', 'user_limit', 'color', 'features', 'description', 'best_for', 'is_lifetime_allowance', 'is_active', 'sort_order'];

    protected function casts(): array
    {
        return [
            'price_units' => 'integer',
            'price_ngn' => 'integer',
            'price_per_reply_ngn' => 'integer',
            'message_limit' => 'integer',
            'reply_allowance' => 'integer',
            'channel_limit' => 'integer',
            'user_limit' => 'integer',
            'features' => 'array',
            'is_lifetime_allowance' => 'boolean',
            'is_active' => 'boolean',
            'sort_order' => 'integer',
        ];
    }

    public function subscriptions(): HasMany
    {
        return $this->hasMany(Subscription::class, 'plan_id');
    }

    public function scopeActive(Builder $query): Builder
    {
        return $query->where('is_active', true);
    }
}
