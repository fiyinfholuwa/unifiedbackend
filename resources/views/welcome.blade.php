<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="description" content="UnifieChat brings every customer conversation into one simple inbox.">
    <title>UnifieChat — One inbox for every customer message</title>
    @vite(['resources/css/app.css', 'resources/js/app.js'])
</head>
<body class="bg-ink text-white antialiased">
    <div class="page-glow page-glow-top" aria-hidden="true"></div>
    <div class="page-glow page-glow-bottom" aria-hidden="true"></div>

    <header class="site-header">
        <div class="shell header-inner">
            <a class="brand" href="#top" aria-label="UnifieChat home">
                <span class="brand-mark">U</span>
                <span>UnifieChat</span>
            </a>

            <button class="menu-toggle" type="button" aria-label="Open menu" aria-expanded="false" data-menu-toggle>
                <span></span><span></span><span></span>
            </button>

            <nav class="main-nav" data-menu>
                <a href="#solutions">Solutions</a>
                <a href="#audience">Who it’s for</a>
                <a href="#faq">FAQ</a>
                <a class="nav-cta" href="#waitlist">Start free trial <span>↗</span></a>
            </nav>
        </div>
    </header>

    <main id="top">
        <section class="hero shell">
            <div class="hero-copy-block">
                <div class="eyebrow"><span class="eyebrow-dot"></span> One inbox for every customer message</div>
                <h1>Your customers are talking.<br><span>Don’t miss the conversation.</span></h1>
                <p class="hero-copy">Stop jumping between WhatsApp, Instagram, Facebook, X, TikTok and more. Bring every conversation into one simple dashboard and reply faster.</p>
                <div class="hero-actions">
                    <a class="button button-primary" href="#waitlist">Start free trial <span>↗</span></a>
                    <a class="button button-secondary" href="#inbox-demo">See how it works <span>↓</span></a>
                </div>
                <div class="channel-chips" aria-label="Connected channels">
                    <span><i class="channel-logo whatsapp">W</i> WhatsApp</span>
                    <span><i class="channel-logo instagram">I</i> Instagram</span>
                    <span><i class="channel-logo facebook">f</i> Facebook</span>
                    <span><i class="channel-logo tiktok">♪</i> TikTok</span>
                    <span><i class="channel-logo telegram">T</i> Telegram</span>
                    <span><i class="channel-logo x-icon">𝕏</i> X</span>
                </div>
                <p class="hero-note">Built for small and growing businesses. No technical setup.</p>
            </div>

            <div class="inbox-demo-wrap" id="inbox-demo">
                <div class="inbox-window" aria-label="Interactive preview of the unified inbox">
                    <div class="window-top">
                        <div class="window-dots"><i></i><i></i><i></i></div>
                        <span class="window-title">UnifieChat inbox</span>
                        <span class="window-date">Today <b>⌄</b></span>
                    </div>
                    <div class="inbox-tabs" role="tablist" aria-label="Filter conversations by channel">
                        <button class="inbox-tab active" type="button" data-inbox-channel="all">All <b>8</b></button>
                        <button class="inbox-tab" type="button" data-inbox-channel="whatsapp">WhatsApp</button>
                        <button class="inbox-tab" type="button" data-inbox-channel="instagram">Instagram</button>
                        <button class="inbox-tab" type="button" data-inbox-channel="facebook">Facebook</button>
                        <button class="inbox-tab" type="button" data-inbox-channel="telegram">Telegram</button>
                    </div>
                    <div class="inbox-layout">
                        <div class="conversation-list">
                            <div class="list-heading"><strong>Messages</strong><button type="button" aria-label="Search conversations">⌕</button></div>
                            <div class="conversation-items" data-conversation-list></div>
                        </div>
                        <div class="chat-panel">
                            <div class="chat-header">
                                <div><strong data-chat-name>Amaka Eze</strong><small><span class="online-dot"></span> <span data-chat-channel>WhatsApp</span> · Online</small></div>
                                <button type="button" aria-label="More conversation options">⋯</button>
                            </div>
                            <div class="chat-body" data-chat-body></div>
                            <form class="chat-input" data-chat-form>
                                <label class="sr-only" for="chat-reply">Reply to customer</label>
                                <input id="chat-reply" name="reply" type="text" autocomplete="off" placeholder="Reply without switching apps…" required>
                                <button type="submit" aria-label="Send reply">↑</button>
                            </form>
                        </div>
                    </div>
                </div>
                <p class="demo-note"><span class="demo-pulse"></span> Try it: pick a channel, open a chat and send a reply.</p>
            </div>
        </section>

        <section class="section shell" id="solutions">
            <div class="section-intro split-intro">
                <div>
                    <div class="eyebrow">Your business. Your customers. One inbox.</div>
                    <h2>Know who messaged, who needs a reply, and who’s waiting.</h2>
                </div>
                <p>Running a small business already means doing a lot. Stop switching apps just to find out who messaged you.</p>
            </div>
            <div class="feature-row">
                <article class="mini-card"><span class="card-icon">◉</span><h3>See every message</h3><p>A unified view of conversations across your connected channels at a glance.</p></article>
                <article class="mini-card"><span class="card-icon coral">♢</span><h3>Never miss a notification</h3><p>New messages, mentions, replies and key interactions all in one place.</p></article>
                <article class="mini-card"><span class="card-icon purple">↗</span><h3>Reply without switching</h3><p>Respond from your dashboard in a minute instead of opening multiple platforms.</p></article>
                <article class="mini-card"><span class="card-icon gold">▣</span><h3>Stay organized</h3><p>Spot unread, pending and resolved conversations at a glance.</p></article>
            </div>
        </section>

        <section class="section shell channel-section" id="channels">
            <div class="section-intro">
                <div class="eyebrow">Meet your customers where they are</div>
                <h2>One conversation, wherever it starts.</h2>
                <p>Connect the channels your business already uses and keep every reply moving from one calm workspace.</p>
            </div>
            <div class="tabs" data-tabs role="tablist" aria-label="Channel solutions">
                <button class="tab active" type="button" data-tab="whatsapp">WhatsApp</button>
                <button class="tab" type="button" data-tab="instagram">Instagram</button>
                <button class="tab" type="button" data-tab="facebook">Facebook</button>
                <button class="tab" type="button" data-tab="more">More channels</button>
            </div>
            <div class="channel-panel" data-channel-panel>
                <div class="channel-panel-icon whatsapp" data-channel-icon>W</div>
                <div><h3 data-channel-title>WhatsApp</h3><p data-channel-copy>Customer questions, orders, support requests, and follow-ups.</p></div>
                <span class="panel-arrow">↗</span>
            </div>
        </section>

        <section class="section shell" id="features">
            <div class="section-intro">
                <div class="eyebrow">Everything in one place</div>
                <h2>Less switching. Faster replies. Happier customers.</h2>
            </div>
            <div class="feature-grid">
                <article class="feature-card"><span>▣</span><h3>Unified inbox</h3><p>Conversations from your connected platforms in one centralized inbox.</p></article>
                <article class="feature-card"><span>♢</span><h3>Smart notifications</h3><p>Know when a customer messages, replies, mentions you, or needs attention.</p></article>
                <article class="feature-card"><span>↗</span><h3>Fast replies</h3><p>Read and respond without constantly switching applications.</p></article>
                <article class="feature-card"><span>⌕</span><h3>Search conversations</h3><p>Find previous conversations quickly when you need context.</p></article>
                <article class="feature-card"><span>◉</span><h3>Customer context</h3><p>See who you’re talking to and their history before replying.</p></article>
                <article class="feature-card"><span>✓</span><h3>Conversation status</h3><p>Track what’s new, ongoing, waiting for a response, or resolved.</p></article>
                <article class="feature-card feature-card-wide"><span>♧</span><h3>Team inbox</h3><p>One place for your team to manage communication and avoid duplicate replies.</p><a href="#waitlist">Bring your team together <span>↗</span></a></article>
            </div>
        </section>

        <section class="section shell audience-section" id="audience">
            <div class="section-intro split-intro">
                <div><div class="eyebrow">Who it’s for</div><h2>Your customers are already messaging you.</h2></div>
                <p>Stay responsive without adding more complexity to your day.</p>
            </div>
            <div class="audience-tabs" role="tablist" aria-label="Business types">
                <button class="audience-tab active" type="button">Retail</button>
                <button class="audience-tab" type="button">Services</button>
                <button class="audience-tab" type="button">Restaurants</button>
                <button class="audience-tab" type="button">Online businesses</button>
                <button class="audience-tab" type="button">Growing teams</button>
            </div>
            <div class="audience-panel">
                <div><span class="panel-kicker">For <strong data-audience-label>Retail</strong></span><h3 data-audience-title>Manage every product question with context.</h3><p data-audience-copy>Manage product enquiries, orders, availability questions, and customer follow-ups.</p></div>
                <span class="panel-arrow">→</span>
            </div>
        </section>

        <section class="section shell comparison">
            <div class="section-intro split-intro">
                <div><div class="eyebrow">A better way to work</div><h2>What changes when every message has a home.</h2></div>
                <p>See the difference a shared, organized inbox makes for your business and your customers.</p>
            </div>
            <div class="toggle" data-comparison role="tablist" aria-label="Compare inbox workflows">
                <button class="active" type="button" data-view="without">Without UnifieChat</button>
                <button type="button" data-view="with">With UnifieChat</button>
            </div>
            <div class="comparison-card"><div class="comparison-heading"><span class="comparison-status" data-comparison-status>Scattered across apps</span><span data-comparison-count>6 friction points</span></div><ul class="comparison-list" data-comparison-list></ul></div>
        </section>

        <section class="section shell faq-section" id="faq">
            <div class="section-intro centered"><div class="eyebrow">Questions, answered</div><h2>Frequently asked questions</h2><p>Everything you need to know before bringing your inbox together.</p></div>
            <div class="faq-list">
                <details open><summary>What is UnifieChat?<span>+</span></summary><p>A customer communication platform that helps small and medium-sized businesses manage messages and notifications from multiple channels in one place.</p></details>
                <details><summary>Who is it for?<span>+</span></summary><p>Primarily SMEs that receive enquiries, orders, bookings, support requests and other messages through social and messaging platforms.</p></details>
                <details><summary>Can I reply to customers from the platform?<span>+</span></summary><p>Yes. Read and respond without constantly switching between applications or losing the thread of a conversation.</p></details>
                <details><summary>Can my team use it?<span>+</span></summary><p>Yes. A shared inbox helps team members manage conversations and coordinate responses.</p></details>
                <details><summary>Will I still get notifications from existing platforms?<span>+</span></summary><p>It’s designed to centralize relevant customer notifications and conversations so you can manage them from one dashboard.</p></details>
                <details><summary>Do I need technical knowledge?<span>+</span></summary><p>No. It’s simple enough for a business owner or team member to start using without technical expertise.</p></details>
            </div>
        </section>

        <section class="cta shell" id="waitlist">
            <div><div class="eyebrow">Stay in the loop</div><h2>Are you seeing every message?</h2><p>Your customers are already reaching out. Connect. See. Reply. Grow.</p></div>
            <form class="waitlist-form" data-waitlist><label class="sr-only" for="email">Business email</label><input id="email" name="email" type="email" placeholder="Business email" required><button class="button button-light" type="submit">Join the waitlist <span>↗</span></button><small data-form-message></small></form>
        </section>
    </main>

    <footer class="site-footer shell">
        <a class="brand" href="#top"><span class="brand-mark">U</span><span>UnifieChat</span></a>
        <p>© {{ date('Y') }} UnifieChat. All rights reserved.</p>
        <p class="footer-tagline">One inbox for every customer message.</p>
    </footer>
</body>
</html>
