<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\ProfileUpdateRequest;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\Auth;
use Illuminate\View\View;

class ProfileController extends Controller
{
    public function edit(): View
    {
        return view('admin.profile');
    }

    public function update(ProfileUpdateRequest $request): RedirectResponse|JsonResponse
    {
        $data = $request->validated();
        $updates = Arr::only($data, ['name', 'email']);

        if (! empty($data['password'])) {
            $updates['password'] = $data['password'];
        }

        $request->user()->update($updates);
        Auth::login($request->user()->fresh());

        $message = 'Your admin profile has been updated.';

        if ($request->expectsJson()) {
            return response()->json(['message' => $message, 'user' => $request->user()->fresh()]);
        }

        return back()->with('success', $message);
    }
}
