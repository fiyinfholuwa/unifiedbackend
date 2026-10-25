@extends('admin.layout', ['title' => 'My profile'])

@section('content')
    <div><p class="admin-kicker">Account settings</p><h1 class="admin-heading">My profile</h1><p class="mt-3 max-w-2xl text-sm leading-6 text-[#aaa5c3]">Update the details and password you use to access the admin console.</p></div>

    <form method="POST" action="{{ route('admin.profile.update') }}" data-ajax-form class="admin-panel mt-8 max-w-2xl p-6 sm:p-8">
        @csrf
        @method('PATCH')
        <div class="grid gap-5 sm:grid-cols-2">
            <div><label for="name" class="admin-label">Name</label><input id="name" name="name" type="text" value="{{ old('name', auth()->user()->name) }}" required class="admin-input mt-2"><p class="admin-field-error" data-error-for="name"></p></div>
            <div><label for="email" class="admin-label">Email address</label><input id="email" name="email" type="email" value="{{ old('email', auth()->user()->email) }}" required class="admin-input mt-2"><p class="admin-field-error" data-error-for="email"></p></div>
        </div>

        <div class="mt-8 border-t border-white/10 pt-6"><p class="text-sm font-semibold text-white">Change password</p><p class="mt-1 text-xs text-[#8f89aa]">Leave these fields blank if you want to keep your current password.</p><div class="mt-5 grid gap-5 sm:grid-cols-2"><div><label for="current_password" class="admin-label">Current password</label><input id="current_password" name="current_password" type="password" autocomplete="current-password" class="admin-input mt-2"><p class="admin-field-error" data-error-for="current_password"></p></div><div><label for="password" class="admin-label">New password</label><input id="password" name="password" type="password" autocomplete="new-password" class="admin-input mt-2"><p class="admin-field-error" data-error-for="password"></p></div><div><label for="password_confirmation" class="admin-label">Confirm new password</label><input id="password_confirmation" name="password_confirmation" type="password" autocomplete="new-password" class="admin-input mt-2"><p class="admin-field-error" data-error-for="password_confirmation"></p></div></div></div>

        <div class="mt-8 flex items-center gap-4"><button type="submit" class="admin-primary-button">Save profile <span>✓</span></button><span class="admin-inline-feedback" data-form-feedback></span></div>
    </form>
@endsection
