<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="csrf-token" content="{{ csrf_token() }}">
    <title>{{ $title ?? 'Admin dashboard' }} · UnifieChat</title>
    @vite(['resources/css/app.css', 'resources/js/app.js'])
</head>
<body class="admin-page bg-[#0d0b20] text-white antialiased">
    <div class="admin-shell min-h-screen lg:flex">
        <aside class="admin-sidebar fixed inset-y-0 left-0 z-40 flex w-72 -translate-x-full flex-col border-r border-white/10 bg-[#11102b] px-5 py-6 transition-transform lg:translate-x-0" data-admin-sidebar>
            <div class="flex items-center justify-between">
                <a href="{{ route('admin.dashboard') }}" class="brand" aria-label="UnifieChat admin dashboard">
                    <span class="brand-mark">U</span>
                    <span>UnifieChat</span>
                </a>
                <button type="button" class="admin-sidebar-close lg:hidden" data-admin-menu-close aria-label="Close navigation">×</button>
            </div>

            <div class="mt-10 px-3 text-xs font-semibold uppercase tracking-[.18em] text-[#8e87b8]">Workspace</div>
            <nav class="mt-3 flex flex-col gap-1" aria-label="Admin navigation">
                <a href="{{ route('admin.dashboard') }}" @class(['admin-nav-link', 'admin-nav-link-active' => request()->routeIs('admin.dashboard')])><span>⌂</span> Overview</a>
                <a href="{{ route('admin.users') }}" @class(['admin-nav-link', 'admin-nav-link-active' => request()->routeIs('admin.users')])><span>♙</span> Users</a>
                <a href="{{ route('admin.support') }}" @class(['admin-nav-link', 'admin-nav-link-active' => request()->routeIs('admin.support')])><span>?</span> Support inbox</a>
                <a href="{{ route('admin.kyc') }}" @class(['admin-nav-link', 'admin-nav-link-active' => request()->routeIs('admin.kyc')])><span>✓</span> KYC review</a>
                <a href="{{ route('admin.connections') }}" @class(['admin-nav-link', 'admin-nav-link-active' => request()->routeIs('admin.connections')])><span>⌁</span> Connections</a>
                <a href="{{ route('admin.plans') }}" @class(['admin-nav-link', 'admin-nav-link-active' => request()->routeIs('admin.plans')])><span>◇</span> Plans</a>
                <a href="{{ route('admin.profile') }}" @class(['admin-nav-link', 'admin-nav-link-active' => request()->routeIs('admin.profile')])><span>◉</span> My profile</a>
            </nav>

            <div class="mt-auto rounded-2xl border border-[#5f4bd0]/30 bg-[#211b4a] p-4">
                <p class="text-xs font-semibold uppercase tracking-[.16em] text-[#a99cff]">Mobile control centre</p>
                <p class="mt-2 text-sm leading-6 text-[#b9b4d4]">Keep the people, plans and connected channels behind the app healthy.</p>
            </div>
        </aside>

        <div class="admin-main min-w-0 flex-1 lg:ml-72">
            <header class="admin-topbar sticky top-0 z-30 flex items-center justify-between border-b border-white/10 bg-[#0d0b20]/90 px-5 py-4 backdrop-blur-xl sm:px-8">
                <div class="flex items-center gap-3">
                    <button type="button" class="admin-menu-button lg:hidden" data-admin-menu-open aria-label="Open navigation">☰</button>
                    <div>
                        <p class="text-xs font-semibold uppercase tracking-[.18em] text-[#8e87b8]">Admin console</p>
                        <p class="mt-1 text-sm text-[#c9c4df]">{{ now()->format('D, j M Y') }}</p>
                    </div>
                </div>
                <div class="flex items-center gap-3">
                    <a href="{{ route('admin.profile') }}" class="hidden text-right sm:block">
                        <p class="text-sm font-semibold text-white">{{ auth()->user()->name }}</p>
                        <p class="text-xs text-[#8e87b8]">{{ auth()->user()->email }}</p>
                    </a>
                    <div class="admin-avatar">{{ str($title ?? 'A')->substr(0, 1)->upper() }}</div>
                    <form method="POST" action="{{ route('admin.logout') }}">
                        @csrf
                        <button type="submit" class="admin-quiet-button" title="Sign out">↪</button>
                    </form>
                </div>
            </header>

            <main class="px-5 py-7 sm:px-8 lg:px-10">
                @if (session('success'))
                    <div class="admin-alert admin-alert-success" role="status">{{ session('success') }}</div>
                @endif

                @if ($errors->any())
                    <div class="admin-alert admin-alert-error" role="alert">{{ $errors->first() }}</div>
                @endif

                {{ $slot ?? '' }}
                @yield('content')
            </main>
        </div>
    </div>
    <div class="admin-sidebar-backdrop hidden" data-admin-backdrop></div>
    <div class="admin-toast" data-admin-toast role="status" aria-live="polite"></div>
</body>
</html>
