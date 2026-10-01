<?php

namespace App\Services;

use Illuminate\Support\Str;

class GlobusService
{
    /**
     * @return array<string, int|string>
     */
    public function createTransferSession(int $units): array
    {
        $unitPrice = (int) config('services.wallet.unit_price_ngn', 10);

        return [
            'method' => 'globus_bank_transfer',
            'provider' => 'Globus Bank',
            'accountNumber' => (string) config('services.globus.demo_account_number', '0001234567'),
            'accountName' => 'Unified Messenger Wallet',
            'reference' => 'GLB-'.Str::upper(Str::random(10)),
            'amount' => $units,
            'paymentAmount' => $units * $unitPrice,
            'currency' => 'NGN',
            'unitPrice' => $unitPrice,
            'expiresAt' => now()->addMinutes(30)->valueOf(),
            'status' => 'pending',
        ];
    }

    /**
     * @param  array<string, mixed>  $session
     */
    public function confirmTransfer(array $session): bool
    {
        return ($session['method'] ?? null) === 'globus_bank_transfer'
            && ($session['status'] ?? null) === 'pending'
            && ($session['expiresAt'] ?? 0) > now()->valueOf();
    }
}
