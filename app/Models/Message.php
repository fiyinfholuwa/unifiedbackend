<?php

namespace App\Models;

use Database\Factories\MessageFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Message extends Model
{
    /** @use HasFactory<MessageFactory> */
    use HasFactory;

    protected $fillable = ['conversation_id', 'external_id', 'sender', 'type', 'text', 'media_uri', 'reaction', 'sent_at', 'deleted'];

    protected $casts = ['sent_at' => 'datetime', 'deleted' => 'boolean'];
}
