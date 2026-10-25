<?php

namespace App\Models;

use Database\Factories\CreditBundleFactory;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class CreditBundle extends Model
{
    /** @use HasFactory<CreditBundleFactory> */
    use HasFactory;

    public $incrementing = false;

    protected $keyType = 'string';

    protected $fillable = ['id', 'name', 'credits', 'price_ngn', 'is_active', 'sort_order'];

    protected function casts(): array
    {
        return [
            'credits' => 'integer',
            'price_ngn' => 'integer',
            'is_active' => 'boolean',
            'sort_order' => 'integer',
        ];
    }

    public function scopeActive(Builder $query): Builder
    {
        return $query->where('is_active', true);
    }
}
