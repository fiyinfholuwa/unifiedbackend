<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\SocialAuthService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class MetaWebhookController extends Controller
{
    public function __construct(private SocialAuthService $socialAuth) {}

    public function verify(Request $request): Response
    {
        $mode = $request->query('hub_mode', $request->query('hub.mode'));
        $verifyToken = $request->query('hub_verify_token', $request->query('hub.verify_token'));
        $challenge = $request->query('hub_challenge', $request->query('hub.challenge'));
        $configuredToken = (string) config('services.social.meta.webhook_verify_token');

        if ($mode !== 'subscribe' || $configuredToken === '' || ! is_string($verifyToken) || ! hash_equals($configuredToken, $verifyToken)) {
            return response('Forbidden', 403);
        }

        return response((string) $challenge, 200)->header('Content-Type', 'text/plain');
    }

    public function receive(Request $request): JsonResponse
    {
        if (! $this->socialAuth->hasValidMetaSignature($request->getContent(), (string) $request->header('X-Hub-Signature-256'))) {
            return response()->json(['message' => 'Invalid webhook signature.'], 403);
        }

        $this->socialAuth->ingestMetaWebhook($request->json()->all());

        return response()->json(['received' => true]);
    }
}
