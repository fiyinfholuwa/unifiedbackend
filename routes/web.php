<?php

use App\Http\Controllers\Admin\AuthController as AdminAuthController;
use App\Http\Controllers\Admin\DashboardController;
use App\Http\Controllers\Admin\ProfileController;
use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return view('welcome');
});

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
    });
});
