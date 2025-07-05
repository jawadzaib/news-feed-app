<?php

use App\Http\Controllers\ArticlesController;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\UserPreferencesController;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Here is where you can register API routes for your application. These
| routes are loaded by the RouteServiceProvider within a group which
| is assigned the "api" middleware group. Enjoy building your API!
|
*/

Route::post('/register', [AuthController::class, 'register'])->middleware('throttle:auth');
Route::post('/login', [AuthController::class, 'login'])->middleware('throttle:auth');

// Protected routes
Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/user', [AuthController::class, 'user']);

    // Article Search & Filtering
    Route::get('/articles', [ArticlesController::class, 'index'])->middleware('throttle:articles-feed');

    // User Preferences
    Route::get('/preferences', [UserPreferencesController::class, 'show']);
    Route::post('/preferences', [UserPreferencesController::class, 'store']);
    Route::get('/feed', [UserPreferencesController::class, 'feed'])->middleware('throttle:articles-feed');

    // endpoints for preferences (sources, categories, authors)
    Route::get('/sources', [UserPreferencesController::class, 'getSources'])->middleware('throttle:metadata');
    Route::get('/categories', [UserPreferencesController::class, 'getCategories'])->middleware('throttle:metadata');
    Route::get('/authors', [UserPreferencesController::class, 'getAuthors'])->middleware('throttle:metadata');
});
