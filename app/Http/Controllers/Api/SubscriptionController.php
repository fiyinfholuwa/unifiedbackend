<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Plan;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SubscriptionController extends Controller
{
    public function plans(): JsonResponse
    {
        return response()->json(['plans' => Plan::active()->orderBy('sort_order')->get()]);
    }

    public function show(Request $request): JsonResponse
    {
        $s = $request->user()->subscription()->firstOrCreate([], ['plan_id' => 'free', 'period' => now()->format('Y-m'), 'usage' => 0]);
        if ($s->period !== now()->format('Y-m')) {
            $s->update(['period' => now()->format('Y-m'), 'usage' => 0]);
        }

        return response()->json(['subscription' => $s->load('plan')]);
    }

    public function update(Request $request): JsonResponse
    {
        $data = $request->validate(['planId' => ['required', 'string', 'exists:plans,id']]);
        $plan = Plan::active()->findOrFail($data['planId']);
        $s = $request->user()->subscription()->firstOrCreate([]);
        $s->update(['plan_id' => $plan->id]);

        return $this->show($request);
    }

    public function usage(Request $request): JsonResponse
    {
        $s = $request->user()->subscription()->firstOrCreate([]);
        $s->increment('usage');

        return response()->json(['usage' => $s->fresh()->usage]);
    }
}
