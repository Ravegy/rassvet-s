<?php
declare(strict_types=1);

return [
    'csrf' => [
        'token_bytes' => 32,
        'field_name' => 'csrf_token',
        'header_name' => 'X-CSRF-Token',
    ],
    'session' => [
        'name' => 'RASSVET_SID',
        'lifetime' => 2592000,
        'device_cookie' => 'device_id',
        'device_lifetime' => 31536000,
    ],
    'password' => [
        'min_length' => 8,
        'reset_ttl' => 3600,
        'verify_ttl' => 86400,
    ],
    'antibot' => [
        'honeypot_field' => 'website_url',
        'timestamp_field' => 'form_ts',
        'min_fill_seconds' => 2,
        'max_form_age_seconds' => 14400,
    ],
    'rate_limits' => [
        'login' => ['limit' => 5, 'window' => 300],
        'register' => ['limit' => 3, 'window' => 3600],
        'forgot' => ['limit' => 3, 'window' => 3600],
        'contact' => ['limit' => 5, 'window' => 600],
        'order' => ['limit' => 5, 'window' => 600],
        'search' => ['limit' => 60, 'window' => 60],
        'stock_ajax' => ['limit' => 60, 'window' => 60],
        'stock_export' => ['limit' => 10, 'window' => 600],
        'cart_fav' => ['limit' => 60, 'window' => 60],
        'api_default' => ['limit' => 60, 'window' => 60],
    ],
    'uploads' => [
        'stock_images' => [
            'max_size' => 5242880,
            'max_files' => 15,
            'allowed_mimes' => [
                'image/jpeg' => 'jpg',
                'image/png' => 'png',
                'image/webp' => 'webp',
            ],
            'allowed_extensions' => ['jpg', 'jpeg', 'png', 'webp'],
        ],
        'csv_import' => [
            'max_size' => 10485760,
            'allowed_mimes' => [
                'text/plain',
                'text/csv',
                'application/csv',
                'application/vnd.ms-excel',
            ],
            'allowed_extensions' => ['csv'],
        ],
    ],
    'csp' => [
        'base' => [
            'default-src' => ["'self'"],
            'base-uri' => ["'self'"],
            'form-action' => ["'self'"],
            'frame-ancestors' => ["'none'"],
            'object-src' => ["'none'"],
            'script-src' => ["'self'", "'nonce-{nonce}'"],
            'style-src' => ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
            'font-src' => ["'self'", 'https://fonts.gstatic.com'],
            'img-src' => ["'self'", 'data:', 'blob:'],
            'connect-src' => ["'self'"],
            'manifest-src' => ["'self'"],
            'upgrade-insecure-requests' => [],
        ],
        'yandex_maps' => [
            'script-src' => ['https://api-maps.yandex.ru', 'https://yastatic.net', 'https://*.maps.yandex.net'],
            'img-src' => ['https://*.maps.yandex.net', 'https://*.yandex.ru', 'https://yastatic.net'],
            'connect-src' => ['https://api-maps.yandex.ru', 'https://*.maps.yandex.net', 'https://*.yandex.ru'],
            'style-src' => ['https://yastatic.net'],
            'font-src' => ['https://yastatic.net'],
        ],
    ],
];