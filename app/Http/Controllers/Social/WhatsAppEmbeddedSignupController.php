<?php

namespace App\Http\Controllers\Social;

use App\Http\Controllers\Controller;
use App\Services\SocialAuthService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\View\View;
use Throwable;

class WhatsAppEmbeddedSignupController extends Controller
{
    public function __construct(private SocialAuthService $socialAuth) {}

    public function create(Request $request): View
    {
        $state = $request->string('state')->toString();
        abort_unless($state !== '' && $this->socialAuth->pendingWhatsAppEmbeddedSignup($state), 410);

        return view('social.whatsapp-embedded-signup', [
            'state' => $state,
            'configId' => config('services.social.whatsapp.embedded_signup_config_id'),
            'facebookAppId' => config('services.social.facebook.client_id'),
            'graphApiVersion' => config('services.social.meta.graph_api_version', 'v22.0'),
            'mobileRedirect' => config('services.social.mobile_redirect'),
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'state' => ['required', 'string', 'max:128'],
            'code' => ['required', 'string', 'max:4096'],
            'waba_id' => ['required', 'string', 'max:128'],
            'phone_number_id' => ['required', 'string', 'max:128'],
            'business_id' => ['nullable', 'string', 'max:128'],
        ]);

        try {
            $connection = $this->socialAuth->completeWhatsAppEmbeddedSignup(
                $data['state'],
                $data['code'],
                $data['waba_id'],
                $data['phone_number_id'],
                $data['business_id'] ?? null,
            );

            return response()->json([
                'connected' => true,
                'platform' => $connection->platform,
                'account_name' => $connection->account_name,
                'redirect_url' => rtrim((string) config('services.social.mobile_redirect'), '/').'/whatsapp?success=1',
            ]);
        } catch (Throwable $exception) {
            report($exception);

            return response()->json(['message' => $exception->getMessage()], 422);
        }
    }
}
