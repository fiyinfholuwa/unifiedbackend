<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="description" content="Explore UnifieChat plans for every stage of your customer conversations.">
    <title>Pricing — UnifieChat</title>
    @vite(['resources/css/app.css', 'resources/js/app.js'])
</head>
<body class="bg-ink text-white antialiased pricing-page">
    <div class="page-glow page-glow-top" aria-hidden="true"></div>
    <div class="page-glow page-glow-bottom" aria-hidden="true"></div>

    <header class="site-header">
        <div class="shell header-inner">
            <a class="brand" href="{{ route('home') }}#top" aria-label="UnifieChat home">
                <span class="brand-mark">U</span>
                <span>UnifieChat</span>
            </a>

            <button class="menu-toggle" type="button" aria-label="Open menu" aria-expanded="false" data-menu-toggle>
                <span></span><span></span><span></span>
            </button>

            <nav class="main-nav" data-menu>
                <a href="{{ route('home') }}#solutions">Solutions</a>
                <a href="{{ route('home') }}#audience">Who it’s for</a>
                <a href="{{ route('pricing') }}" aria-current="page">Pricing</a>
                <a href="{{ route('home') }}#faq">FAQ</a>
                <a class="nav-cta" href="{{ route('home') }}#waitlist">Start free trial <span>↗</span></a>
            </nav>
        </div>
    </header>

    <main id="top" class="pricing-page-main">
        <section class="pricing-hero shell">
            <div class="eyebrow">Simple pricing. Better conversations.</div>
            <h1>More customers. <span>Less wahala.</span></h1>
            <p>Start free, then choose the plan that fits how your business talks to customers.</p>
            <span class="pricing-status">All plans · clear pricing · no surprises</span>
        </section>

        <section class="section shell pricing-section pricing-page-section" id="pricing">
            <div class="pricing-grid">
                @include('partials.pricing-cards', ['plans' => $plans, 'creditBundles' => $creditBundles])
            </div>
            <p class="pricing-note">A successful outgoing reply counts as one reply. Failed messages are not charged. Premium replies reset each paid billing cycle; unused replies do not roll over.</p>
        </section>

        <section class="pricing-page-cta shell">
            <div>
                <div class="eyebrow">Ready when you are</div>
                <h2>Bring every customer conversation into one calm workspace.</h2>
            </div>
            <a class="button button-primary" href="{{ route('home') }}#waitlist">Start free trial <span>↗</span></a>
        </section>
    </main>

    <footer class="site-footer shell">
        <a class="brand" href="{{ route('home') }}#top"><span class="brand-mark">U</span><span>UnifieChat</span></a>
        <p>© {{ date('Y') }} UnifieChat. All rights reserved.</p>
        <p class="footer-tagline">One inbox for every customer message.</p>
    </footer>
</body>
</html>
