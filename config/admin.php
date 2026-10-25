<?php

return [
    'emails' => array_values(array_filter(array_map('trim', explode(',', (string) env('ADMIN_EMAILS', ''))))),

    'demo' => [
        'enabled' => (bool) env('ADMIN_DEMO_ENABLED', env('APP_ENV', 'production') === 'local'),
        'email' => env('ADMIN_DEMO_EMAIL', 'demo-admin@unifiechat.test'),
        'password' => env('ADMIN_DEMO_PASSWORD', 'demo-admin-password'),
    ],
];
