<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\ConversationController;
use App\Http\Controllers\Api\MetaWebhookController;
use App\Http\Controllers\Api\PlatformController;
use App\Http\Controllers\Api\SocialAuthController;
use App\Http\Controllers\Api\SubscriptionController;
use App\Http\Controllers\Api\SupportController;
use App\Http\Controllers\Api\TelegramWebhookController;
use App\Http\Controllers\Api\WalletController;
use Illuminate\Support\Facades\Route;

Route::prefix('v1')->group(function (): void {
    Route::post('auth/register', [AuthController::class, 'register']);
    Route::post('auth/login', [AuthController::class, 'login']);
    Route::post('auth/forgot-password', [AuthController::class, 'forgot']);
    Route::post('auth/reset-password', [AuthController::class, 'reset']);

    Route::middleware('api.token')->group(function (): void {
        Route::get('auth/me', [AuthController::class, 'me']);
        Route::delete('auth/session', [AuthController::class, 'logout']);
        Route::patch('auth/profile', [AuthController::class, 'update']);
        Route::delete('auth/profile', [AuthController::class, 'destroy']);
        Route::get('platforms', [PlatformController::class, 'index']);
        Route::post('platforms/{platform}/connect', [PlatformController::class, 'connect']);
        Route::delete('platforms/{platform}', [PlatformController::class, 'disconnect']);
        Route::get('conversations', [ConversationController::class, 'index']);
        Route::get('conversations/{id}/messages', [ConversationController::class, 'messages']);
        Route::post('conversations/{id}/messages', [ConversationController::class, 'store']);
        Route::post('conversations/{id}/messages/{message}/reaction', [ConversationController::class, 'react']);
        Route::delete('conversations/{id}/messages/{message}', [ConversationController::class, 'destroy']);
        Route::get('wallet', [WalletController::class, 'show']);
        Route::post('wallet/kyc', [WalletController::class, 'kyc']);
        Route::post('wallet/payment-session', [WalletController::class, 'session']);
        Route::post('wallet/payment-session/confirm', [WalletController::class, 'confirm']);
        Route::delete('wallet/payment-session', [WalletController::class, 'cancel']);
        Route::post('wallet/spend', [WalletController::class, 'spend']);
        Route::post('wallet/activity', [WalletController::class, 'activity']);
        Route::get('subscription', [SubscriptionController::class, 'show']);
        Route::put('subscription', [SubscriptionController::class, 'update']);
        Route::post('support-requests', [SupportController::class, 'store']);
        Route::get('social/{platform}/start', [SocialAuthController::class, 'start']);
        Route::post('social/{platform}/credentials', [SocialAuthController::class, 'credentials']);
    });
    Route::post('webhooks/telegram', TelegramWebhookController::class)->middleware('throttle:120,1');
    Route::get('webhooks/meta', [MetaWebhookController::class, 'verify'])->middleware('throttle:60,1');
    Route::post('webhooks/meta', [MetaWebhookController::class, 'receive'])->middleware('throttle:120,1');
    Route::get('social/callback', [SocialAuthController::class, 'callback']);
    Route::get('plans', [SubscriptionController::class, 'plans']);
});
