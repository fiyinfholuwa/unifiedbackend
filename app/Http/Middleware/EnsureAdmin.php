<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Str;
use Symfony\Component\HttpFoundation\Response;

class EnsureAdmin
{
    /**
     * Handle an incoming request.
     *
     * @param  Closure(Request): (Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        if (! Auth::check()) {
            return redirect()->route('admin.login');
        }

        $user = $request->user();
        $allowListed = in_array(Str::lower($user->email), array_map(Str::lower(...), config('admin.emails', [])), true);

        if (! $user->is_active || (! $user->is_admin && ! $allowListed)) {
            abort(Response::HTTP_FORBIDDEN, 'You are not authorized to access the admin dashboard.');
        }

        return $next($request);
    }
}
