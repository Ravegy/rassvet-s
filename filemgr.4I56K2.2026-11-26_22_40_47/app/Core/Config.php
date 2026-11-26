<?php
declare(strict_types=1);

namespace App\Core;

final class Config
{
    private static array $files = [];
    private static ?array $env = null;

    public static function get(string $key, mixed $default = null): mixed
    {
        if ($key === '') {
            return $default;
        }

        $segments = explode('.', $key);
        $file = array_shift($segments);
        if ($file === null || $file === '') {
            return $default;
        }

        $data = self::all($file);
        if ($segments === []) {
            return $data;
        }

        $value = $data;
        foreach ($segments as $segment) {
            if (!is_array($value) || !array_key_exists($segment, $value)) {
                return $default;
            }
            $value = $value[$segment];
        }

        return $value;
    }

    public static function all(string $file): array
    {
        if (!preg_match('/^[a-zA-Z0-9_-]+$/', $file)) {
            return [];
        }

        if (!array_key_exists($file, self::$files)) {
            $path = APP_ROOT . '/config/' . $file . '.php';
            if (is_file($path)) {
                $loaded = require $path;
                self::$files[$file] = is_array($loaded) ? $loaded : [];
            } else {
                self::$files[$file] = [];
            }
        }

        return self::$files[$file];
    }

    public static function env(string $key, mixed $default = null): mixed
    {
        self::loadEnv();

        if (array_key_exists($key, self::$env)) {
            return self::$env[$key];
        }

        $lowerKey = strtolower($key);
        if (array_key_exists($lowerKey, self::$env)) {
            return self::$env[$lowerKey];
        }

        if (array_key_exists($key, $_ENV)) {
            return $_ENV[$key];
        }

        $sysValue = getenv($key);
        if ($sysValue !== false) {
            return $sysValue;
        }

        if (defined($key)) {
            return constant($key);
        }

        return $default;
    }

    public static function isDebug(): bool
    {
        $val = self::env('APP_DEBUG', false);
        if (is_bool($val)) {
            return $val;
        }
        return in_array(strtolower((string)$val), ['1', 'true', 'yes', 'on'], true);
    }

    public static function baseUrl(): string
    {
        $envUrl = trim((string)self::env('APP_URL', ''));
        if ($envUrl !== '') {
            return rtrim($envUrl, '/');
        }
        return rtrim((string)self::get('app.default_url', 'https://rassvet-s.tech'), '/');
    }

    private static function loadEnv(): void
    {
        if (self::$env !== null) {
            return;
        }

        self::$env = [];
        if (!defined('ENV_PATH') || !is_file(ENV_PATH)) {
            return;
        }

        $loader = static function (string $path): array {
            $result = require $path;
            $data = is_array($result) ? $result : [];
            $vars = get_defined_vars();
            unset($vars['path'], $vars['result'], $vars['data']);
            foreach ($vars as $name => $value) {
                if (!array_key_exists($name, $data)) {
                    $data[$name] = $value;
                }
            }
            return $data;
        };

        self::$env = $loader(ENV_PATH);
    }
}