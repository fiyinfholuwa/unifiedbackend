<?php

namespace App\Services;

class MonnifyService
{
    public function isConfigured(): bool
    {
        return filled(config('services.monnify.api_key'))
            && filled(config('services.monnify.secret_key'))
            && filled(config('services.monnify.contract_code'));
    }
}
