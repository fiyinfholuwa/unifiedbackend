<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\SocialAuthService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class TelegramWebhookController extends Controller
{
    public function __invoke(Request $request, SocialAuthService $socialAuth): JsonResponse
    {
        $connection = $socialAuth->telegramConnectionForWebhookSecret((string) $request->header('X-Telegram-Bot-Api-Secret-Token'));

        if (! $connection) {
            return response()->json(['message' => 'Invalid Telegram webhook secret.'], 403);
        }

        $socialAuth->ingestTelegramUpdate($connection, $request->all());

        return response()->json(['ok' => true]);
    }
}
