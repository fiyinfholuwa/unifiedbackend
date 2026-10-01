<?php

namespace App\Services;

class PaystackService
{
    public function isConfigured(): bool
    {
        return filled(config('services.paystack.secret_key'));
    }
}
