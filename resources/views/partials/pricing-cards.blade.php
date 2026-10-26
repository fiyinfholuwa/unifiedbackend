@foreach ($plans as $plan)
    @php
        $priceLabel = match ($plan->billing_type) {
            'free' => 'Free forever',
            'payg' => '₦'.number_format($plan->price_per_reply_ngn ?? $plan->price_ngn).' / reply',
            default => '₦'.number_format($plan->price_ngn).' / month',
        };
    @endphp
    <article class="pricing-card {{ $plan->id === 'pro' ? 'pricing-card-featured' : '' }}">
        @if ($plan->id === 'pro')
            <span class="pricing-badge">Most popular</span>
        @endif
        <div class="pricing-card-heading">
            <div>
                <p class="pricing-plan-name">{{ $plan->name }}</p>
                <p class="pricing-best-for">{{ $plan->best_for }}</p>
            </div>
            <span class="pricing-dot" style="background-color: {{ $plan->color }}"></span>
        </div>
        <p class="pricing-price">{{ $priceLabel }}</p>
        <p class="pricing-description">{{ $plan->description }}</p>
        <ul class="pricing-features">
            @foreach ($plan->features ?? [] as $feature)
                <li><span>✓</span>{{ $feature }}</li>
            @endforeach
        </ul>
        @if ($plan->billing_type === 'payg' && $creditBundles->isNotEmpty())
            <div class="pricing-bundles">
                <p>Optional credit bundles</p>
                @foreach ($creditBundles as $bundle)
                    <span>{{ number_format($bundle->credits) }} replies · ₦{{ number_format($bundle->price_ngn) }}</span>
                @endforeach
            </div>
        @endif
        <a class="pricing-cta {{ $plan->id === 'pro' ? 'pricing-cta-primary' : '' }}" href="{{ route('home') }}#waitlist">{{ $plan->billing_type === 'payg' ? 'Buy reply credits' : ($plan->billing_type === 'free' ? 'Get started for free' : 'Upgrade to Premium') }} <span>↗</span></a>
    </article>
@endforeach
