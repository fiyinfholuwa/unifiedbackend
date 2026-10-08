<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class AuthController extends Controller
{
    public function register(Request $request): JsonResponse
    {
        $data = $request->validate(['name' => ['required', 'string', 'max:100'], 'email' => ['required', 'email', 'unique:users,email'], 'password' => ['required', 'string', 'min:8']]);
        $user = User::create($data);
        $this->initializeUser($user);

        return $this->respond($user, 201);
    }

    public function login(Request $request): JsonResponse
    {
        $data = $request->validate(['email' => ['required', 'email'], 'password' => ['required', 'string']]);
        $user = User::where('email', $data['email'])->first();
        if (! $user || ! Hash::check($data['password'], $user->password)) {
            return response()->json(['message' => 'Invalid email or password.'], 422);
        }
        $this->initializeUser($user);

        return $this->respond($user);
    }

    public function me(Request $request): JsonResponse
    {
        return response()->json(['user' => $request->user()]);
    }

    public function update(Request $request): JsonResponse
    {
        $user = $request->user();
        $data = $request->validate([
            'name' => ['sometimes', 'string', 'max:100'],
            'email' => ['sometimes', 'email', 'unique:users,email,'.$user->id],
            'bio' => ['nullable', 'string', 'max:140'],
            'avatar' => ['nullable', 'image', 'mimes:jpg,jpeg,png,webp', 'max:5120'],
        ]);
        $updates = collect($data)->only(['name', 'email', 'bio'])->all();

        if ($request->hasFile('avatar')) {
            $path = $request->file('avatar')->store('avatars', 'public');
            $updates['avatar'] = url(Storage::disk('public')->url($path));
        }

        $user->update($updates);

        return response()->json(['user' => $user->fresh()]);
    }

    public function destroy(Request $request): JsonResponse
    {
        $request->user()->delete();

        return response()->json(['success' => true]);
    }

    public function forgot(Request $request): JsonResponse
    {
        $data = $request->validate(['email' => ['required', 'email']]);
        $user = User::where('email', $data['email'])->first();
        if (! $user) {
            return response()->json(['message' => 'No account found for that email.'], 404);
        }
        $user->forceFill(['remember_token' => '123456'])->save();

        return response()->json(['success' => true, 'code' => '123456']);
    }

    public function reset(Request $request): JsonResponse
    {
        $data = $request->validate(['email' => ['required', 'email'], 'code' => ['required', 'size:6'], 'password' => ['required', 'min:8']]);
        $user = User::where('email', $data['email'])->where('remember_token', $data['code'])->first();
        if (! $user) {
            return response()->json(['message' => 'Invalid reset code.'], 422);
        }
        $user->update(['password' => $data['password'], 'remember_token' => Str::random(10)]);

        return response()->json(['success' => true]);
    }

    private function respond(User $user, int $status = 200): JsonResponse
    {
        $plain = Str::random(80);
        $user->apiTokens()->create(['token_hash' => hash('sha256', $plain)]);

        return response()->json(['user' => $user->fresh(), 'token' => $plain], $status);
    }

    private function initializeUser(User $user): void
    {
        $user->wallet()->firstOrCreate([], ['kyc_status' => 'not_started', 'balance' => 0]);
        $user->subscription()->firstOrCreate([], ['plan_id' => 'free', 'period' => now()->format('Y-m'), 'usage' => 0]);
    }
}
