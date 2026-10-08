<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\RateLimiter;
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

    public function logout(Request $request): JsonResponse
    {
        $request->attributes->get('api_token')?->delete();

        return response()->json(['success' => true]);
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
        $email = Str::lower($data['email']);
        $limiterKey = 'password-reset:'.$email.'|'.$request->ip();

        if (RateLimiter::tooManyAttempts($limiterKey, 5)) {
            return response()->json(['message' => 'Too many reset attempts. Try again later.'], 429);
        }
        RateLimiter::hit($limiterKey, 3600);

        $user = User::whereRaw('LOWER(email) = ?', [$email])->first();
        if ($user) {
            $code = (string) random_int(100000, 999999);

            DB::table('password_reset_tokens')->updateOrInsert(
                ['email' => $user->email],
                ['token' => Hash::make($code), 'created_at' => now()],
            );

            Mail::raw(
                "Your UnifieChat password reset code is {$code}. It expires in 10 minutes.",
                function ($message) use ($user): void {
                    $message->to($user->email)->subject('Your UnifieChat password reset code');
                },
            );
        }

        return response()->json(['success' => true]);
    }

    public function reset(Request $request): JsonResponse
    {
        $data = $request->validate(['email' => ['required', 'email'], 'code' => ['required', 'digits:6'], 'password' => ['required', 'string', 'min:8']]);
        $email = Str::lower($data['email']);
        $limiterKey = 'password-reset-confirm:'.$email.'|'.$request->ip();

        if (RateLimiter::tooManyAttempts($limiterKey, 10)) {
            return response()->json(['message' => 'Too many reset attempts. Try again later.'], 429);
        }
        RateLimiter::hit($limiterKey, 3600);

        $reset = DB::table('password_reset_tokens')->where('email', $email)->first();
        if (! $reset || ! $reset->created_at || now()->diffInMinutes($reset->created_at) > 10 || ! Hash::check($data['code'], $reset->token)) {
            return response()->json(['message' => 'Invalid reset code.'], 422);
        }

        $user = User::whereRaw('LOWER(email) = ?', [$email])->first();
        if (! $user) {
            return response()->json(['message' => 'Invalid reset code.'], 422);
        }

        DB::transaction(function () use ($data, $email, $user): void {
            $user->update(['password' => $data['password'], 'remember_token' => Str::random(40)]);
            $user->apiTokens()->delete();
            DB::table('password_reset_tokens')->where('email', $email)->delete();
        });

        return response()->json(['success' => true]);
    }

    private function respond(User $user, int $status = 200): JsonResponse
    {
        $plain = Str::random(80);
        $expiresAt = now()->addDays(30);
        $user->apiTokens()->create(['token_hash' => hash('sha256', $plain), 'expires_at' => $expiresAt]);

        return response()->json(['user' => $user->fresh(), 'token' => $plain, 'expires_at' => $expiresAt->toIso8601String()], $status);
    }

    private function initializeUser(User $user): void
    {
        $user->wallet()->firstOrCreate([], ['kyc_status' => 'not_started', 'balance' => 0]);
        $user->subscription()->firstOrCreate([], ['plan_id' => 'free', 'period' => now()->format('Y-m'), 'usage' => 0]);
    }
}
