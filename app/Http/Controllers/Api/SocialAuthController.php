<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\SocialAuthService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Throwable;

class SocialAuthController extends Controller
{
    public function __construct(private SocialAuthService $socialAuth) {}

    public function start(Request $request, string $platform): JsonResponse
    {
        try {
            return response()->json(['authorization_url' => $this->socialAuth->authorizationUrl($request->user(), $platform)]);
        } catch (Throwable $exception) {
            return response()->json(['message' => $exception->getMessage()], 422);
        }
    }

    public function callback(Request $request): mixed
    {
        $success = false;
        $platform = 'social';
        try {
            $connection = $this->socialAuth->complete($request->string('code')->toString(), $request->string('state')->toString());
            $platform = $connection->platform;
            $success = true;
        } catch (Throwable $exception) {
            $platform = $request->string('platform')->toString() ?: $platform;
            report($exception);
        }

        return redirect()->away(config('services.social.mobile_redirect').'/'.$platform.'?success='.($success ? '1' : '0'));
    }

    public function credentials(Request $request, string $platform): JsonResponse
    {
        try {
            $rules = match ($platform) {
                'telegram' => ['bot_token' => ['required', 'string']],
                'whatsapp' => [
                    'access_token' => ['required', 'string'],
                    'phone_number_id' => ['required', 'string'],
                    'business_account_id' => ['required', 'string'],
                ],
                default => throw new \RuntimeException('This platform must be connected with its sign-in flow.'),
            };
            $connection = $this->socialAuth->saveCredentials($request->user(), $platform, $request->validate($rules));

            return response()->json(['connected' => true, 'platform' => $connection->platform, 'account_name' => $connection->account_name]);
        } catch (Throwable $exception) {
            return response()->json(['message' => $exception->getMessage()], 422);
        }
    }
}
