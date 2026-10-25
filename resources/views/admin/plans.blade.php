@extends('admin.layout', ['title' => 'Plans'])

@section('content')
    <div><p class="admin-kicker">Revenue</p><h1 class="admin-heading">Plan controls</h1><p class="mt-3 max-w-2xl text-sm leading-6 text-[#aaa5c3]">Update subscription pricing, reply allowances and feature descriptions used by the mobile app.</p></div>

    <div class="admin-panel mt-8 divide-y divide-white/10">
        @foreach ($plans as $plan)
            <form method="POST" action="{{ route('admin.plans.update', $plan) }}" data-ajax-form data-ajax-kind="plan-update" class="grid gap-4 p-5 sm:grid-cols-[1fr_auto]">
                @csrf @method('PATCH')
                <div>
                    <div class="flex flex-wrap items-center gap-3"><span class="admin-plan-dot" style="background-color: {{ $plan->color }}"></span><input class="admin-plan-name" name="name" value="{{ $plan->name }}" aria-label="Plan name"><span class="admin-badge {{ $plan->is_active ? 'admin-badge-green' : 'admin-badge-coral' }}">{{ $plan->subscriptions_count }} subscribers</span></div>
                    <div class="mt-4 grid gap-3 sm:grid-cols-3"><label class="admin-field-label">Billing type<select class="admin-compact-input" name="billing_type"><option value="free" @selected($plan->billing_type === 'free')>Free</option><option value="monthly" @selected($plan->billing_type === 'monthly')>Monthly</option><option value="payg" @selected($plan->billing_type === 'payg')>Pay as you go</option></select></label><label class="admin-field-label">Price (NGN)<input class="admin-compact-input" name="price_ngn" type="number" min="0" value="{{ $plan->price_ngn }}"></label><label class="admin-field-label">Price / reply<input class="admin-compact-input" name="price_per_reply_ngn" type="number" min="0" value="{{ $plan->price_per_reply_ngn }}" placeholder="—"></label></div>
                    <div class="mt-3 grid gap-3 sm:grid-cols-3"><label class="admin-field-label">Reply allowance<input class="admin-compact-input" name="reply_allowance" type="number" min="0" value="{{ $plan->reply_allowance }}" placeholder="Unlimited"></label><label class="admin-field-label">Channel limit<input class="admin-compact-input" name="channel_limit" type="number" min="1" value="{{ $plan->channel_limit }}"></label><label class="admin-field-label">User limit<input class="admin-compact-input" name="user_limit" type="number" min="1" value="{{ $plan->user_limit }}"></label></div>
                    <div class="mt-3 grid gap-3 sm:grid-cols-2"><label class="admin-field-label">Best for<input class="admin-compact-input" name="best_for" value="{{ $plan->best_for }}"></label><label class="admin-field-label">Color<input class="admin-compact-input" name="color" value="{{ $plan->color }}"></label></div>
                    <label class="admin-field-label mt-4">Description<textarea class="admin-textarea" name="description" rows="2">{{ $plan->description }}</textarea></label>
                    <label class="admin-field-label mt-4">Features <textarea class="admin-textarea" name="features" rows="3" placeholder="One feature per line">{{ implode("\n", $plan->features ?? []) }}</textarea></label>
                    <div class="mt-4 flex flex-wrap gap-5 text-xs text-[#aaa5c3]"><label class="flex items-center gap-2"><input type="hidden" name="is_active" value="0"><input type="checkbox" name="is_active" value="1" @checked($plan->is_active)> Active in mobile pricing</label><label class="flex items-center gap-2"><input type="hidden" name="is_lifetime_allowance" value="0"><input type="checkbox" name="is_lifetime_allowance" value="1" @checked($plan->is_lifetime_allowance)> One-time allowance</label></div>
                </div>
                <div class="flex items-end"><button type="submit" class="admin-small-button">Save</button></div>
            </form>
        @endforeach
    </div>

    <section class="mt-12"><div><p class="admin-kicker">Prepaid credits</p><h2 class="admin-section-title">Credit bundles</h2><p class="mt-2 text-sm text-[#aaa5c3]">Optional discounts for Pay-As-You-Go customers.</p></div><div class="admin-panel mt-5 divide-y divide-white/10">
        @foreach ($bundles as $bundle)
            <form method="POST" action="{{ route('admin.credit-bundles.update', $bundle) }}" data-ajax-form data-ajax-kind="bundle-update" class="grid gap-4 p-5 sm:grid-cols-[1fr_auto]">@csrf @method('PATCH')<div class="grid gap-3 sm:grid-cols-3"><label class="admin-field-label">Bundle name<input class="admin-compact-input" name="name" value="{{ $bundle->name }}"></label><label class="admin-field-label">Credits<input class="admin-compact-input" name="credits" type="number" min="1" value="{{ $bundle->credits }}"></label><label class="admin-field-label">Price (NGN)<input class="admin-compact-input" name="price_ngn" type="number" min="1" value="{{ $bundle->price_ngn }}"></label></div><div class="flex items-end"><button type="submit" class="admin-small-button">Save</button></div><label class="flex items-center gap-2 text-xs text-[#aaa5c3]"><input type="hidden" name="is_active" value="0"><input type="checkbox" name="is_active" value="1" @checked($bundle->is_active)> Active in mobile wallet</label></form>
        @endforeach
    </div></section>
@endsection
