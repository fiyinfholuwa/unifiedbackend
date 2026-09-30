<?php

namespace App\Http\Middleware;

use App\Models\ApiToken;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class ApiTokenAuth
{
    /**
     * Handle an incoming request.
     *
     * @param  Closure(Request): (Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $plain = $request->bearerToken();
        $token = $plain ? ApiToken::with('user')->where('token_hash', hash('sha256', $plain))->first() : null;
        if (! $token) {
            return response()->json(['message' => 'Unauthenticated.'], 401);
        }
        $token->update(['last_used_at' => now()]);
        $request->setUserResolver(fn () => $token->user);

        return $next($request);
    }
}
