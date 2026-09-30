<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Third Party Services
    |--------------------------------------------------------------------------
    |
    | This file is for storing the credentials for third party services such
    | as Resend, Postmark, AWS, and more. This file provides the de facto
    | location for this type of information, allowing packages to have
    | a conventional file to locate the various service credentials.
    |
    */

    'postmark' => [
        'key' => env('POSTMARK_API_KEY'),
    ],

    'resend' => [
        'key' => env('RESEND_API_KEY'),
    ],

    'ses' => [
        'key' => env('AWS_ACCESS_KEY_ID'),
        'secret' => env('AWS_SECRET_ACCESS_KEY'),
        'region' => env('AWS_DEFAULT_REGION', 'us-east-1'),
    ],

    'slack' => [
        'notifications' => [
            'bot_user_oauth_token' => env('SLACK_BOT_USER_OAUTH_TOKEN'),
            'channel' => env('SLACK_BOT_USER_DEFAULT_CHANNEL'),
        ],
    ],

    'social' => [
        'callback' => env('SOCIAL_OAUTH_CALLBACK', env('APP_URL').'/api/v1/social/callback'),
        'mobile_redirect' => env('SOCIAL_MOBILE_REDIRECT', 'unified://oauth/callback'),
        'facebook' => ['client_id' => env('FACEBOOK_CLIENT_ID'), 'client_secret' => env('FACEBOOK_CLIENT_SECRET'), 'scope' => env('FACEBOOK_SCOPE', 'pages_show_list,pages_messaging')],
        'instagram' => ['client_id' => env('INSTAGRAM_CLIENT_ID', env('FACEBOOK_CLIENT_ID')), 'client_secret' => env('INSTAGRAM_CLIENT_SECRET', env('FACEBOOK_CLIENT_SECRET')), 'scope' => env('INSTAGRAM_SCOPE', 'instagram_basic,instagram_manage_messages,pages_show_list')],
        'twitter' => ['client_id' => env('TWITTER_CLIENT_ID'), 'client_secret' => env('TWITTER_CLIENT_SECRET'), 'scope' => env('TWITTER_SCOPE', 'tweet.read users.read offline.access')],
        'tiktok' => ['client_key' => env('TIKTOK_CLIENT_KEY'), 'client_secret' => env('TIKTOK_CLIENT_SECRET'), 'scope' => env('TIKTOK_SCOPE', 'user.info.basic')],
        'whatsapp' => ['access_token' => env('WHATSAPP_ACCESS_TOKEN'), 'business_account_id' => env('WHATSAPP_BUSINESS_ACCOUNT_ID')],
        'telegram' => ['bot_token' => env('TELEGRAM_BOT_TOKEN')],
    ],

];
