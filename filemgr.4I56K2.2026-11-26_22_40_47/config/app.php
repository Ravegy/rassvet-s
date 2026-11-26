<?php
declare(strict_types=1);

return [
    'name' => 'Рассвет-С',
    'legal_name' => 'ООО «Рассвет-С»',
    'legal_name_upper' => 'ООО "РАССВЕТ-С"',
    'inn' => '4705065491',
    'founding_year' => 2015,
    'vat_rate' => 22,
    'vat_label' => 'НДС 22%',
    'default_url' => 'https://rassvet-s.tech',
    'timezone' => 'Europe/Moscow',
    'locale' => 'ru_RU',
    'lang' => 'ru',
    'contacts' => [
        'phone_display' => '+7 981 494-30-88',
        'phone_raw' => '+79814943088',
        'phone_schema' => '+7-981-494-30-88',
        'email' => 'info@rassvet-s.tech',
        'city' => 'Санкт-Петербург',
        'address' => 'Санкт-Петербург, Парнас',
        'country' => 'RU',
        'work_hours' => 'Пн–Пт, 9:00–18:00',
        'map' => [
            'lat' => 60.0670,
            'lon' => 30.3347,
            'zoom' => 14,
        ],
    ],
    'socials' => [
        'telegram_channel' => [
            'name' => 'Telegram-канал',
            'sub' => 'Новости и поставки',
            'url' => 'https://t.me/rassvet_s_tech',
        ],
        'telegram_direct' => [
            'name' => 'Telegram',
            'sub' => 'Написать нам',
            'url' => 'https://t.me/rassvet_s_tech?direct',
        ],
        'whatsapp' => [
            'name' => 'WhatsApp',
            'sub' => '+7 981 494-30-88',
            'url' => 'https://wa.me/79814943088',
        ],
        'max' => [
            'name' => 'MAX',
            'sub' => 'Мессенджер MAX',
            'url' => 'https://max.ru/u/f9LHodD0cOIDIRrTbvKabEdDX879HUUCE75oDMM4jX0b4poZiMUmeWmmJfg',
        ],
        'avito' => [
            'name' => 'Авито',
            'sub' => 'Наши объявления',
            'url' => 'https://www.avito.ru/brands/80e138ecc05d277b7df61cfbc0041157',
        ],
    ],
    'mail' => [
        'host' => 'mail.rassvet-s.tech',
        'port' => 465,
        'username' => 'lk@rassvet-s.tech',
        'from_email' => 'lk@rassvet-s.tech',
        'from_name' => 'ООО РАССВЕТ-С',
    ],
    'assets' => [
        'logo' => '/images/logo.webp',
        'og_image' => '/images/og-home.webp',
        'no_image' => '/images/noimage.webp',
        'requisites_pdf' => '/docs/requisites.pdf',
    ],
    'seo' => [
        'indexnow_endpoint' => 'https://yandex.com/indexnow',
        'sitemap_cache_ttl' => 86400,
        'sitemap_chunk_size' => 45000,
    ],
    'pagination' => [
        'stock_public' => 24,
        'stock_admin' => 20,
    ],
    'paths' => [
        'views' => APP_ROOT . '/views',
        'cache' => APP_ROOT . '/storage/cache',
        'logs' => APP_ROOT . '/storage/logs',
        'ratelimit' => APP_ROOT . '/storage/ratelimit',
        'stock_images' => APP_ROOT . '/images/stock',
        'stock_update_file' => APP_ROOT . '/storage/cache/stock_update_time.txt',
    ],
];