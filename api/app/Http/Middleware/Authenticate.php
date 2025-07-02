<?php

namespace App\Http\Middleware;

use Illuminate\Auth\Middleware\Authenticate as Middleware;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Response; // Import Response facade

class Authenticate extends Middleware
{
    /**
     * Get the path the user should be redirected to when they are not authenticated.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return string|null
     */
    protected function redirectTo(Request $request): ?string
    {
        // If the request is not expecting JSON (i.e., it's a web request),
        // then return the default redirect path.
        // Otherwise, for API requests, return null to prevent redirection
        // and let the exception handler return a JSON 401 response.
        return $request->expectsJson() ? null : route('login');
    }

    /**
     * Handle an unauthenticated user.
     *
     * This method is overridden to return a JSON response for API requests
     * instead of throwing an exception that leads to a redirect.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  array<string>  $guards
     * @return void
     * @throws \Illuminate\Auth\AuthenticationException
     */
    protected function unauthenticated($request, array $guards)
    {
        // If the request expects a JSON response (typical for API calls)
        if ($request->expectsJson()) {
            // Return a JSON response with a 401 Unauthorized status
            Response::json(['message' => 'Unauthenticated.'], 401)->send();
            exit; // Terminate script execution after sending response
        }

        // For non-JSON requests (e.g., web routes), call the parent method
        // which will typically redirect to the login page.
        parent::unauthenticated($request, $guards);
    }
}

