<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Admin sign in · UnifieChat</title>
    @vite(['resources/css/app.css', 'resources/js/app.js'])
</head>
<body class="admin-page admin-login-page bg-[#0d0b20] text-white antialiased">
    <main class="flex min-h-screen items-center justify-center px-5 py-10">
        <div class="w-full max-w-md">
            <div class="mb-8 text-center">
                <a href="{{ url('/') }}" class="brand justify-center">
                    <span class="brand-mark">U</span>
                    <span>UnifieChat</span>
                </a>
                <p class="mt-6 text-xs font-semibold uppercase tracking-[.2em] text-[#9f91ff]">Admin console</p>
                <h1 class="mt-3 text-3xl font-bold tracking-tight text-white">Welcome back</h1>
                <p class="mt-3 text-sm leading-6 text-[#a7a2c2]">Sign in to manage the mobile app workspace.</p>
            </div>

            <form method="POST" action="{{ route('admin.login.store') }}" class="rounded-3xl border border-white/10 bg-[#171430] p-6 shadow-2xl shadow-black/30 sm:p-8">
                @csrf
                <div>
                    <label for="email" class="admin-label">Email address</label>
                    <input id="email" name="email" type="email" value="{{ old('email') }}" required autofocus autocomplete="email" class="admin-input" placeholder="admin@example.com">
                    @error('email') <p class="mt-2 text-xs text-[#ff8e9a]">{{ $message }}</p> @enderror
                </div>
                <div class="mt-5">
                    <label for="password" class="admin-label">Password</label>
                    <input id="password" name="password" type="password" required autocomplete="current-password" class="admin-input" placeholder="••••••••">
                    @error('password') <p class="mt-2 text-xs text-[#ff8e9a]">{{ $message }}</p> @enderror
                </div>
                <button type="submit" class="admin-primary-button mt-7 w-full">Sign in to dashboard <span>↗</span></button>
            </form>

            @if (app()->environment('local') && config('admin.demo.enabled'))
                <div class="mt-4 rounded-2xl border border-[#5f4bd0]/30 bg-[#211b4a] p-4 text-sm text-[#c8c1e6]">
                    <p class="font-semibold text-white">Demo access</p>
                    <p class="mt-2 text-xs leading-5 text-[#aaa3c7]">Email: <code>{{ config('admin.demo.email') }}</code><br>Password: <code>{{ config('admin.demo.password') }}</code></p>
                </div>
            @endif

            <p class="mt-6 text-center text-xs text-[#726d91]">Access is limited to admin users and configured admin emails.</p>
        </div>
    </main>
</body>
</html>
