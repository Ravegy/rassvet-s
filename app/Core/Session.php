<?php
declare(strict_types=1);

namespace App\Core;

final class Session
{
    private static bool $started = false;
    private static bool $isHttps = true;
    private static ?string $deviceId = null;

    public static function start(bool $isHttps = true): void
    {
        self::$isHttps = $isHttps;

        if (session_status() === PHP_SESSION_ACTIVE) {
            self::$started = true;
            self::initDeviceId();
            return;
        }

        if (headers_sent()) {
            return;
        }

        $name = (string)Config::get('security.session.name', 'RASSVET_SID');
        $lifetime = (int)Config::get('security.session.lifetime', 2592000);

        ini_set('session.use_strict_mode', '1');
        ini_set('session.use_only_cookies', '1');
        ini_set('session.gc_maxlifetime', (string)$lifetime);

        session_name($name);
        session_set_cookie_params([
            'lifetime' => $lifetime,
            'path' => '/',
            'domain' => '',
            'secure' => $isHttps,
            'httponly' => true,
            'samesite' => 'Lax',
        ]);

        session_start();
        self::$started = true;
        self::initDeviceId();
    }

    public static function close(): void
    {
        if (session_status() === PHP_SESSION_ACTIVE) {
            session_write_close();
        }
    }

    public static function get(string $key, mixed $default = null): mixed
    {
        self::ensureRead();
        return $_SESSION[$key] ?? $default;
    }

    public static function set(string $key, mixed $value): void
    {
        self::ensureWrite();
        $_SESSION[$key] = $value;
    }

    public static function has(string $key): bool
    {
        self::ensureRead();
        return array_key_exists($key, $_SESSION);
    }

    public static function remove(string $key): void
    {
        self::ensureWrite();
        unset($_SESSION[$key]);
    }

    public static function flash(string $key, mixed $value): void
    {
        self::ensureWrite();
        if (!isset($_SESSION['_flash']) || !is_array($_SESSION['_flash'])) {
            $_SESSION['_flash'] = [];
        }
        $_SESSION['_flash'][$key] = $value;
    }

    public static function pullFlash(string $key, mixed $default = null): mixed
    {
        self::ensureRead();
        if (!isset($_SESSION['_flash']) || !is_array($_SESSION['_flash']) || !array_key_exists($key, $_SESSION['_flash'])) {
            return $default;
        }
        $value = $_SESSION['_flash'][$key];
        self::ensureWrite();
        unset($_SESSION['_flash'][$key]);
        return $value;
    }

    public static function regenerate(): void
    {
        self::ensureWrite();
        if (session_status() === PHP_SESSION_ACTIVE) {
            session_regenerate_id(true);
        }
    }

    public static function login(int $userId, string $role = 'user', array $meta = []): void
    {
        self::ensureWrite();
        self::regenerate();

        $_SESSION['user_id'] = $userId;
        $_SESSION['user_role'] = $role !== '' ? $role : 'user';
        $_SESSION['auth_time'] = time();
        if ($meta !== []) {
            $_SESSION['user_meta'] = $meta;
        }
        unset($_SESSION['_csrf_token']);
    }

    public static function logout(): void
    {
        self::ensureWrite();
        $_SESSION = [];

        if (ini_get('session.use_cookies') && !headers_sent()) {
            $params = session_get_cookie_params();
            setcookie(session_name(), '', [
                'expires' => time() - 42000,
                'path' => $params['path'] ?: '/',
                'domain' => $params['domain'] ?: '',
                'secure' => (bool)$params['secure'],
                'httponly' => (bool)$params['httponly'],
                'samesite' => $params['samesite'] ?: 'Lax',
            ]);
        }

        if (session_status() === PHP_SESSION_ACTIVE) {
            session_destroy();
        }
        self::$started = false;
    }

    public static function userId(): ?int
    {
        $id = self::get('user_id');
        if (is_int($id) && $id > 0) {
            return $id;
        }
        if (is_numeric($id) && (int)$id > 0) {
            return (int)$id;
        }
        return null;
    }

    public static function userRole(): string
    {
        $role = self::get('user_role', 'guest');
        return is_string($role) && $role !== '' ? $role : 'guest';
    }

    public static function isAuthenticated(): bool
    {
        return self::userId() !== null;
    }

    public static function isAdmin(): bool
    {
        return self::isAuthenticated() && self::userRole() === 'admin';
    }

    public static function deviceId(): string
    {
        if (self::$deviceId === null) {
            self::initDeviceId();
        }
        return self::$deviceId ?? '';
    }

    private static function initDeviceId(): void
    {
        if (self::$deviceId !== null) {
            return;
        }

        $cookieName = (string)Config::get('security.session.device_cookie', 'device_id');
        $raw = isset($_COOKIE[$cookieName]) && is_string($_COOKIE[$cookieName]) ? trim($_COOKIE[$cookieName]) : '';

        if ($raw !== '' && preg_match('/^[a-f0-9]{32,64}$/', $raw) === 1) {
            self::$deviceId = $raw;
            return;
        }

        $generated = bin2hex(random_bytes(16));
        self::$deviceId = $generated;
        $_COOKIE[$cookieName] = $generated;

        if (!headers_sent()) {
            $lifetime = (int)Config::get('security.session.device_lifetime', 31536000);
            setcookie($cookieName, $generated, [
                'expires' => time() + $lifetime,
                'path' => '/',
                'domain' => '',
                'secure' => self::$isHttps,
                'httponly' => true,
                'samesite' => 'Lax',
            ]);
        }
    }

    private static function ensureRead(): void
    {
        if (!self::$started && session_status() !== PHP_SESSION_ACTIVE) {
            self::start(self::$isHttps);
        }
    }

    private static function ensureWrite(): void
    {
        if (session_status() !== PHP_SESSION_ACTIVE) {
            self::start(self::$isHttps);
        }
    }
}