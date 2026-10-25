<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\LoginRequest;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Str;
use Illuminate\View\View;

class AuthController extends Controller
{
    public function create(): View|RedirectResponse
    {
        if (Auth::check()) {
            return redirect()->route('admin.dashboard');
        }

        return view('admin.login');
    }

    public function store(LoginRequest $request): RedirectResponse
    {
        $credentials = $request->validated();

        if (! Auth::attempt([...$credentials, 'is_active' => true])) {
            return back()->withErrors(['email' => 'Those credentials are not valid for the admin dashboard.'])->onlyInput('email');
        }

        $user = $request->user();
        $allowListed = in_array(Str::lower($user->email), array_map(Str::lower(...), config('admin.emails', [])), true);

        if (! $user->is_admin && ! $allowListed) {
            Auth::logout();

            return back()->withErrors(['email' => 'Those credentials are not valid for the admin dashboard.'])->onlyInput('email');
        }

        $request->session()->regenerate();

        return redirect()->intended(route('admin.dashboard'));
    }

    public function destroy(Request $request): RedirectResponse
    {
        Auth::logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect()->route('admin.login');
    }
}
