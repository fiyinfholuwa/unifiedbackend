<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\CreditBundleUpdateRequest;
use App\Http\Requests\Admin\PlanUpdateRequest;
use App\Models\CreditBundle;
use App\Models\Message;
use App\Models\Plan;
use App\Models\PlatformConnection;
use App\Models\Subscription;
use App\Models\SupportRequest;
use App\Models\User;
use App\Models\Wallet;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Illuminate\View\View;

class DashboardController extends Controller
{
    public function index(): View
    {
        return view('admin.dashboard', [
            'stats' => $this->stats(),
            'recentUsers' => User::query()
                ->with(['subscription.plan'])
                ->latest()
                ->limit(6)
                ->get(),
        ]);
    }

    public function users(Request $request): View
    {
        $search = $request->string('search')->trim()->toString();

        $users = User::query()
            ->with(['subscription.plan', 'wallet'])
            ->withCount(['platformConnections', 'conversations'])
            ->when($search !== '', function ($query) use ($search): void {
                $query->where(function ($query) use ($search): void {
                    $query->where('name', 'like', "%{$search}%")
                        ->orWhere('email', 'like', "%{$search}%");
                });
            })
            ->orderByDesc('created_at')
            ->orderByDesc('id')
            ->paginate(10)
            ->withQueryString();

        return view('admin.users', [
            'users' => $users,
            'plans' => $this->plansQuery()->get(),
        ]);
    }

    public function support(Request $request): View
    {
        $status = $request->string('status')->trim()->toString();
        $supportRequests = SupportRequest::query()
            ->with('user:id,name,email')
            ->when(in_array($status, ['open', 'in_progress', 'resolved', 'closed'], true), fn ($query) => $query->where('status', $status))
            ->latest()
            ->paginate(12)
            ->withQueryString();

        return view('admin.support', compact('supportRequests', 'status'));
    }

    public function kyc(Request $request): View
    {
        $status = $request->string('status')->trim()->toString();
        $wallets = Wallet::query()
            ->with('user:id,name,email')
            ->when(in_array($status, ['pending', 'verified', 'rejected', 'not_started'], true), fn ($query) => $query->where('kyc_status', $status))
            ->latest('kyc_submitted_at')
            ->paginate(12)
            ->withQueryString();

        return view('admin.kyc', compact('wallets', 'status'));
    }

    public function connections(Request $request): View
    {
        $platform = $request->string('platform')->trim()->toString();
        $connections = PlatformConnection::query()
            ->with('user:id,name,email')
            ->when($platform !== '', fn ($query) => $query->where('platform', $platform))
            ->latest()
            ->paginate(15)
            ->withQueryString();

        return view('admin.connections', compact('connections', 'platform'));
    }

    public function plans(): View
    {
        return view('admin.plans', ['plans' => $this->plansQuery()->get(), 'bundles' => CreditBundle::orderBy('sort_order')->get()]);
    }

    public function updateSupportStatus(Request $request, SupportRequest $supportRequest): RedirectResponse|JsonResponse
    {
        $data = $request->validate(['status' => ['required', 'in:open,in_progress,resolved,closed']]);
        $supportRequest->update($data);
        $message = 'Support request status updated.';

        if ($request->expectsJson()) {
            return response()->json(['message' => $message, 'status' => $supportRequest->status]);
        }

        return back()->with('success', $message);
    }

    public function reviewKyc(Request $request, Wallet $wallet): RedirectResponse|JsonResponse
    {
        $data = $request->validate(['kyc_status' => ['required', 'in:pending,verified,rejected']]);
        $data['kyc_reviewed_at'] = $data['kyc_status'] === 'pending' ? null : now();
        $wallet->update($data);
        $message = 'KYC review saved.';

        if ($request->expectsJson()) {
            return response()->json(['message' => $message, 'status' => $wallet->kyc_status]);
        }

        return back()->with('success', $message);
    }

    public function updateUserPlan(Request $request, User $user): RedirectResponse|JsonResponse
    {
        $data = $request->validate(['plan_id' => ['required', Rule::exists('plans', 'id')]]);
        $plan = Plan::findOrFail($data['plan_id']);

        DB::transaction(function () use ($user, $plan): void {
            $user->subscription()->updateOrCreate([], [
                'plan_id' => $plan->id,
                'period' => now()->format('Y-m'),
            ]);
        });

        $message = "{$user->name}'s plan updated to {$plan->name}.";

        if ($request->expectsJson()) {
            return response()->json(['message' => $message, 'plan' => $plan->name]);
        }

        return back()->with('success', $message);
    }

    public function updateUserStatus(Request $request, User $user): RedirectResponse|JsonResponse
    {
        $data = $request->validate(['is_active' => ['required', 'boolean']]);
        $user->update($data);

        if (! $data['is_active']) {
            $user->apiTokens()->delete();
        }

        $message = $user->name.' is now '.($data['is_active'] ? 'active.' : 'inactive.');

        if ($request->expectsJson()) {
            return response()->json(['message' => $message, 'is_active' => (bool) $user->is_active]);
        }

        return back()->with('success', $message);
    }

    public function updatePlan(PlanUpdateRequest $request, Plan $plan): RedirectResponse|JsonResponse
    {
        $plan->update($request->planData());
        $message = "{$plan->name} plan updated.";

        if ($request->expectsJson()) {
            return response()->json(['message' => $message, 'plan' => $plan->fresh()]);
        }

        return back()->with('success', $message);
    }

    public function updateBundle(CreditBundleUpdateRequest $request, CreditBundle $creditBundle): RedirectResponse|JsonResponse
    {
        $creditBundle->update($request->validated());
        $message = "{$creditBundle->name} bundle updated.";

        if ($request->expectsJson()) {
            return response()->json(['message' => $message, 'bundle' => $creditBundle->fresh()]);
        }

        return back()->with('success', $message);
    }

    /**
     * @return array<string, int>
     */
    private function stats(): array
    {
        return [
            'users' => User::count(),
            'activeUsers' => User::where('is_active', true)->count(),
            'messages' => Message::count(),
            'connections' => PlatformConnection::where('connected', true)->count(),
            'openSupport' => SupportRequest::whereIn('status', ['open', 'in_progress'])->count(),
            'pendingKyc' => Wallet::where('kyc_status', 'pending')->count(),
            'monthlyUsage' => Subscription::where('period', now()->format('Y-m'))->sum('usage'),
        ];
    }

    private function plansQuery(): Builder
    {
        return Plan::withCount('subscriptions')->orderBy('sort_order')->orderBy('id');
    }
}
