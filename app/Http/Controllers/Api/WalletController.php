<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class WalletController extends Controller
{
    public function show(Request $request): JsonResponse
    {
        $w = $request->user()->wallet()->firstOrCreate([], ['kyc_status' => 'not_started', 'balance' => 0]);

        return response()->json(['wallet' => [...$w->toArray(), 'transactions' => $w->transactions()->latest('occurred_at')->get()]]);
    }

    public function kyc(Request $request): JsonResponse
    {
        $data = $request->validate([
            'businessName' => ['required', 'string', 'max:150'],
            'nin' => ['required', 'digits:11'],
            'ninDocument' => ['required', 'file', 'mimes:jpg,jpeg,png,pdf', 'max:10240'],
        ]);
        $w = $request->user()->wallet()->firstOrCreate([]);
        $documentPath = $data['ninDocument']->store('kyc-documents');

        $w->update([
            'kyc_status' => 'pending',
            'kyc_name' => $data['businessName'],
            'kyc_business_name' => $data['businessName'],
            'kyc_nin' => $data['nin'],
            'kyc_document_path' => $documentPath,
            'kyc_submitted_at' => now(),
            'kyc_reviewed_at' => null,
        ]);
        $this->transaction($w, 'kyc', 'KYC submitted for review');

        return $this->show($request);
    }

    public function session(Request $request): JsonResponse
    {
        $amount = (int) $request->validate(['amount' => ['required', 'integer', 'min:10', 'max:100000']])['amount'];
        $w = $request->user()->wallet()->firstOrCreate([]);
        if ($w->kyc_status !== 'verified') {
            return response()->json(['message' => 'KYC_REQUIRED'], 422);
        } $session = ['accountNumber' => '99'.substr((string) now()->timestamp, -8), 'amount' => $amount, 'paymentAmount' => $amount * 10, 'currency' => 'NGN', 'unitPrice' => 10, 'expiresAt' => now()->addMinutes(30)->valueOf(), 'status' => 'pending'];
        $w->update(['account_number' => $session['accountNumber'], 'payment_session' => $session]);

        return response()->json(['session' => $session]);
    }

    public function confirm(Request $request): JsonResponse
    {
        $w = $request->user()->wallet()->firstOrFail();
        $s = $w->payment_session;
        if (! $s || $s['status'] !== 'pending' || $s['expiresAt'] <= now()->valueOf()) {
            $w->update(['account_number' => null, 'payment_session' => null]);

            return response()->json(['success' => false]);
        } DB::transaction(function () use ($w, $s) {
            $w->increment('balance', $s['amount']);
            $this->transaction($w, 'funding', 'Wallet funding confirmed', $s['amount'], 'credit');
            $w->update(['account_number' => null, 'payment_session' => null]);
        });

        return response()->json(['success' => true]);
    }

    public function cancel(Request $request): JsonResponse
    {
        $request->user()->wallet()->update(['account_number' => null, 'payment_session' => null]);

        return response()->json(['success' => true]);
    }

    public function spend(Request $request): JsonResponse
    {
        $data = $request->validate(['amount' => ['required', 'integer', 'min:0'], 'title' => ['required', 'string']]);
        $w = $request->user()->wallet()->firstOrFail();
        if ($w->balance < $data['amount']) {
            return response()->json(['success' => false], 422);
        } DB::transaction(function () use ($w, $data) {
            $w->decrement('balance', $data['amount']);
            $this->transaction($w, 'subscription', $data['title'], $data['amount'], 'debit');
        });

        return response()->json(['success' => true]);
    }

    public function activity(Request $request): JsonResponse
    {
        $w = $request->user()->wallet()->firstOrFail();
        $this->transaction($w, 'activity', $request->validate(['title' => ['required', 'string']])['title']);

        return response()->json(['success' => true]);
    }

    private function transaction($wallet, string $type, string $title, int $amount = 0, string $direction = 'neutral'): void
    {
        $wallet->transactions()->create(compact('type', 'title', 'amount', 'direction') + ['occurred_at' => now()]);
    }
}
