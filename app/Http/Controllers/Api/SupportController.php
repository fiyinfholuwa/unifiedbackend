<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SupportController extends Controller
{
    public function store(Request $request): JsonResponse
    {
        $data = $request->validate(['mode' => ['nullable', 'in:support,feedback'], 'subject' => ['nullable', 'string', 'max:200'], 'message' => ['required', 'string', 'max:5000']]);
        $request->user()->supportRequests()->create($data);

        return response()->json(['success' => true]);
    }
}
