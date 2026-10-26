<?php

use App\Http\Controllers\Admin\AuthController as AdminAuthController;
use App\Http\Controllers\Admin\DashboardController;
use App\Http\Controllers\Admin\ProfileController;
use App\Http\Controllers\Social\WhatsAppEmbeddedSignupController;
use App\Models\CreditBundle;
use App\Models\Plan;
use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return view('welcome', [
        'plans' => Plan::active()->orderBy('sort_order')->limit(3)->get(),
        'creditBundles' => CreditBundle::active()->orderBy('sort_order')->get(),
    ]);
})->name('home');

Route::get('/pricing', function () {
    return view('pricing', [
        'plans' => Plan::active()->orderBy('sort_order')->get(),
        'creditBundles' => CreditBundle::active()->orderBy('sort_order')->get(),
    ]);
})->name('pricing');

Route::get('/connect/whatsapp', [WhatsAppEmbeddedSignupController::class, 'create'])->name('social.whatsapp.signup');
Route::post('/connect/whatsapp/complete', [WhatsAppEmbeddedSignupController::class, 'store'])->name('social.whatsapp.signup.complete');

Route::prefix('admin')->name('admin.')->group(function (): void {
    Route::get('login', [AdminAuthController::class, 'create'])->name('login');
    Route::post('login', [AdminAuthController::class, 'store'])->middleware('throttle:10,1')->name('login.store');

    Route::middleware('admin')->group(function (): void {
        Route::get('/', [DashboardController::class, 'index'])->name('dashboard');
        Route::get('users', [DashboardController::class, 'users'])->name('users');
        Route::get('support', [DashboardController::class, 'support'])->name('support');
        Route::get('kyc', [DashboardController::class, 'kyc'])->name('kyc');
        Route::get('connections', [DashboardController::class, 'connections'])->name('connections');
        Route::get('plans', [DashboardController::class, 'plans'])->name('plans');
        Route::get('profile', [ProfileController::class, 'edit'])->name('profile');
        Route::patch('profile', [ProfileController::class, 'update'])->name('profile.update');
        Route::post('logout', [AdminAuthController::class, 'destroy'])->name('logout');
        Route::patch('support-requests/{supportRequest}/status', [DashboardController::class, 'updateSupportStatus'])->name('support-requests.status');
        Route::patch('wallets/{wallet}/kyc', [DashboardController::class, 'reviewKyc'])->name('wallets.kyc');
        Route::patch('users/{user}/plan', [DashboardController::class, 'updateUserPlan'])->name('users.plan');
        Route::patch('users/{user}/status', [DashboardController::class, 'updateUserStatus'])->name('users.status');
        Route::patch('plans/{plan}', [DashboardController::class, 'updatePlan'])->name('plans.update');
        Route::patch('credit-bundles/{creditBundle}', [DashboardController::class, 'updateBundle'])->name('credit-bundles.update');
    });
});
