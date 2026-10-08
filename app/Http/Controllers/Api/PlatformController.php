<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\PlatformConnection;
use App\Services\SocialAuthService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Throwable;

class PlatformController extends Controller
{
    public function __construct(private SocialAuthService $socialAuth) {}

    private array $platforms = [['id' => 'facebook', 'name' => 'Facebook', 'icon' => 'logo-facebook', 'color' => '#1877F2'], ['id' => 'instagram', 'name' => 'Instagram', 'icon' => 'logo-instagram', 'color' => '#E4405F'], ['id' => 'whatsapp', 'name' => 'WhatsApp Business', 'icon' => 'logo-whatsapp', 'color' => '#25D366'], ['id' => 'telegram', 'name' => 'Telegram', 'icon' => 'paper-plane', 'color' => '#0088cc'], ['id' => 'tiktok', 'name' => 'TikTok', 'icon' => 'musical-notes', 'color' => '#111111'], ['id' => 'twitter', 'name' => 'Twitter / X', 'icon' => 'logo-twitter', 'color' => '#1DA1F2']];

    public function index(Request $request): JsonResponse
    {
        $connections = $request->user()->platformConnections()->where('connected', true)->get();

        if (str_starts_with((string) config('app.url'), 'https://')) {
            $connections->where('platform', 'telegram')
                ->filter(fn (PlatformConnection $connection): bool => (($connection->metadata ?? [])['telegram_webhook_configured'] ?? false) !== true)
                ->each(function (PlatformConnection $connection): void {
                    try {
                        $this->socialAuth->configureTelegramWebhook($connection);
                    } catch (Throwable $exception) {
                        report($exception);
                    }
                });
        }

        $connected = $connections->pluck('platform')->all();

        return response()->json(['platforms' => array_map(fn ($p) => [...$p, 'connected' => in_array($p['id'], $connected, true)], $this->platforms)]);
    }

    public function connect(Request $request, string $platform): JsonResponse
    {
        return response()->json(['message' => 'Start the platform sign-in flow to connect this account.'], 422);
    }

    public function disconnect(Request $request, string $platform): JsonResponse
    {
        $request->user()->platformConnections()->where('platform', $platform)->update(['connected' => false]);

        return response()->json(['success' => true]);
    }
}
