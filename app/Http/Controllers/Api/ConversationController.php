<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Conversation;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class ConversationController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $platforms = $request->user()->platformConnections()->where('connected', true)->pluck('platform');
        $items = $request->user()->conversations()->whereIn('platform', $platforms)->latest('last_message_at')->get()->map(fn ($c) => ['id' => $c->external_id, 'platform' => $c->platform, 'contactName' => $c->contact_name, 'avatar' => $c->avatar, 'lastMessage' => $c->last_message, 'timestamp' => $c->last_message_at?->diffForHumans()]);

        return response()->json(['conversations' => $items]);
    }

    public function messages(Request $request, string $id): JsonResponse
    {
        $c = $this->conversation($request, $id);

        return response()->json(['messages' => $c->messages()->orderBy('sent_at')->get()->map(fn ($m) => ['id' => $m->external_id, 'sender' => $m->sender, 'type' => $m->type, 'text' => $m->text, 'uri' => $m->media_uri, 'reaction' => $m->reaction, 'timestamp' => $m->sent_at?->diffForHumans()])]);
    }

    public function store(Request $request, string $id): JsonResponse
    {
        $c = $this->conversation($request, $id);
        $data = $request->validate(['text' => ['nullable', 'string'], 'type' => ['nullable', 'string'], 'uri' => ['nullable', 'string']]);
        $m = $c->messages()->create(['external_id' => Str::uuid(), 'sender' => 'me', 'text' => $data['text'] ?? null, 'type' => $data['type'] ?? 'text', 'media_uri' => $data['uri'] ?? null, 'sent_at' => now()]);
        $c->update(['last_message' => $m->text ?? 'Media message', 'last_message_at' => now()]);

        return response()->json(['message' => ['id' => $m->external_id, 'sender' => 'me', 'type' => $m->type, 'text' => $m->text, 'uri' => $m->media_uri, 'timestamp' => 'just now']]);
    }

    public function react(Request $request, string $id, string $message): JsonResponse
    {
        $m = $this->conversation($request, $id)->messages()->where('external_id', $message)->firstOrFail();
        $reaction = $request->validate(['reaction' => ['nullable', 'string']])['reaction'] ?? null;
        $m->update(['reaction' => $m->reaction === $reaction ? null : $reaction]);

        return response()->json(['message' => $m]);
    }

    public function destroy(Request $request, string $id, string $message): JsonResponse
    {
        $m = $this->conversation($request, $id)->messages()->where('external_id', $message)->firstOrFail();
        if ($request->boolean('forEveryone')) {
            $m->update(['type' => 'deleted', 'text' => 'This message was deleted', 'deleted' => true]);
        } else {
            $m->delete();
        }

return response()->json(['success' => true]);
    }

    private function conversation(Request $request, string $id): Conversation
    {
        return $request->user()->conversations()->where('external_id', $id)->firstOrFail();
    }
}
