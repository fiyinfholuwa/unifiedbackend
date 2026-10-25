<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\CreditBundle;
use App\Models\Plan;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class SubscriptionController extends Controller
{
    public function plans(): JsonResponse
    {
        $plans = Plan::active()->orderBy('sort_order')->get()->map(fn (Plan $plan): array => [
            ...$plan->toArray(),
            'display_price' => $this->displayPrice($plan),
        ])->values();

        return response()->json([
            'plans' => $plans,
            'credit_bundles' => CreditBundle::active()->orderBy('sort_order')->get(),
            'wallet_unit_price_ngn' => (int) config('services.wallet.unit_price_ngn', 10),
        ]);
    }

    public function show(Request $request): JsonResponse
    {
        $s = $request->user()->subscription()->firstOrCreate([], ['plan_id' => 'free', 'period' => now()->format('Y-m'), 'usage' => 0, 'free_replies_used' => 0]);
        $s->load('plan');
        if (($s->plan?->billing_type ?? 'monthly') === 'monthly' && $s->period !== now()->format('Y-m')) {
            $s->update(['period' => now()->format('Y-m'), 'usage' => 0]);
        }

        return response()->json(['subscription' => $s->load('plan')]);
    }

    public function update(Request $request): JsonResponse
    {
        $data = $request->validate(['planId' => ['required', 'string', 'exists:plans,id']]);
        $plan = Plan::active()->findOrFail($data['planId']);
        $s = $request->user()->subscription()->firstOrCreate([]);

        if ($s->plan_id !== $plan->id) {
            $failure = DB::transaction(function () use ($plan, $request, $s): ?string {
                $subscription = $s->newQuery()->lockForUpdate()->findOrFail($s->id);

                if ($plan->price_units > 0) {
                    $wallet = $request->user()->wallet()->lockForUpdate()->firstOrCreate([], ['kyc_status' => 'not_started', 'balance' => 0]);
                    if ($wallet->kyc_status !== 'verified') {
                        return 'KYC_REQUIRED';
                    }
                    if ($wallet->balance < $plan->price_units) {
                        return 'INSUFFICIENT_UNITS';
                    }

                    $wallet->decrement('balance', $plan->price_units);
                    $wallet->transactions()->create([
                        'type' => 'subscription',
                        'title' => $plan->name.' plan activated',
                        'amount' => $plan->price_units,
                        'direction' => 'debit',
                        'occurred_at' => now(),
                    ]);
                } else {
                    $wallet = $request->user()->wallet()->firstOrCreate([], ['kyc_status' => 'not_started', 'balance' => 0]);
                    $wallet->transactions()->create([
                        'type' => 'subscription',
                        'title' => $plan->name.' plan activated',
                        'amount' => 0,
                        'direction' => 'neutral',
                        'occurred_at' => now(),
                    ]);
                }

                $subscription->update(['plan_id' => $plan->id, 'period' => now()->format('Y-m'), 'usage' => 0]);

                return null;
            });

            if ($failure) {
                return response()->json(['message' => $failure], 422);
            }
        }

        return $this->show($request);
    }

    private function displayPrice(Plan $plan): string
    {
        return match ($plan->billing_type) {
            'free' => 'Free forever',
            'payg' => '₦'.number_format($plan->price_per_reply_ngn ?? $plan->price_ngn).' / reply',
            default => '₦'.number_format($plan->price_ngn).' / month',
        };
    }
}
