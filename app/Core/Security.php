<?php
declare(strict_types=1);

namespace App\Core;

final class Security
{
    private static ?string $cspNonce = null;
    private static array $cspProfiles = [];

    public static function e(mixed $value): string
    {
        if ($value === null) {
            return '';
        }
        return htmlspecialchars((string)$value, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
    }

    public static function cspNonce(): string
    {
        if (self::$cspNonce === null) {
            self::$cspNonce = base64_encode(random_bytes(16));
        }
        return self::$cspNonce;
    }

    public static function enableCspProfile(string $profile): void
    {
        $profile = trim($profile);
        if ($profile !== '' && !in_array($profile, self::$cspProfiles, true)) {
            self::$cspProfiles[] = $profile;
        }
    }

    public static function buildCspHeader(): string
    {
        $base = Config::get('security.csp.base', []);
        if (!is_array($base)) {
            return '';
        }

        $directives = [];
        foreach ($base as $name => $sources) {
            if (!is_string($name)) {
                continue;
            }
            $directives[$name] = is_array($sources) ? array_values($sources) : [];
        }

        foreach (self::$cspProfiles as $profile) {
            $extra = Config::get('security.csp.' . $profile, []);
            if (!is_array($extra)) {
                continue;
            }
            foreach ($extra as $name => $sources) {
                if (!is_string($name) || !is_array($sources)) {
                    continue;
                }
                if (!isset($directives[$name])) {
                    $directives[$name] = [];
                }
                foreach ($sources as $source) {
                    if (is_string($source) && !in_array($source, $directives[$name], true)) {
                        $directives[$name][] = $source;
                    }
                }
            }
        }

        $nonce = self::cspNonce();
        $parts = [];
        foreach ($directives as $name => $sources) {
            if ($sources === []) {
                $parts[] = $name;
                continue;
            }
            $resolved = [];
            foreach ($sources as $source) {
                if (!is_string($source) || $source === '') {
                    continue;
                }
                $resolved[] = str_replace('{nonce}', $nonce, $source);
            }
            $parts[] = $name . ' ' . implode(' ', array_unique($resolved));
        }

        return implode('; ', $parts);
    }

    public static function csrfToken(): string
    {
        $existing = Session::get('_csrf_token');
        if (is_string($existing) && strlen($existing) >= 32) {
            return $existing;
        }

        $bytes = max(16, (int)Config::get('security.csrf.token_bytes', 32));
        $token = bin2hex(random_bytes($bytes));
        Session::set('_csrf_token', $token);
        return $token;
    }

    public static function csrfField(): string
    {
        $name = (string)Config::get('security.csrf.field_name', 'csrf_token');
        return '<input type="hidden" name="' . self::e($name) . '" value="' . self::e(self::csrfToken()) . '">';
    }

    public static function verifyCsrf(Request $request): bool
    {
        $sessionToken = Session::get('_csrf_token');
        if (!is_string($sessionToken) || $sessionToken === '') {
            return false;
        }

        $headerName = (string)Config::get('security.csrf.header_name', 'X-CSRF-Token');
        $fieldName = (string)Config::get('security.csrf.field_name', 'csrf_token');

        $provided = $request->header($headerName);
        if (!is_string($provided) || $provided === '') {
            $rawInput = $request->input($fieldName);
            $provided = is_string($rawInput) ? trim($rawInput) : '';
        } else {
            $provided = trim($provided);
        }

        if ($provided === '') {
            return false;
        }

        return hash_equals($sessionToken, $provided);
    }

    public static function verifySameOrigin(Request $request): bool
    {
        $fetchSite = strtolower(trim((string)($request->header('sec-fetch-site') ?? '')));
        if ($fetchSite !== '' && !in_array($fetchSite, ['same-origin', 'same-site', 'none'], true)) {
            return false;
        }

        $origin = trim((string)($request->header('origin') ?? ''));
        if ($origin !== '' && $origin !== 'null') {
            $originHost = strtolower((string)(parse_url($origin, PHP_URL_HOST) ?? ''));
            if ($originHost === '' || $originHost !== $request->host()) {
                return false;
            }
        }

        return true;
    }

    public static function antibotFields(): string
    {
        $hpField = (string)Config::get('security.antibot.honeypot_field', 'website_url');
        $tsField = (string)Config::get('security.antibot.timestamp_field', 'form_ts');
        $now = (string)time();
        $signedTs = $now . '.' . self::hmac('form_ts:' . $now);

        return '<div aria-hidden="true" style="position:absolute;left:-9999px;width:1px;height:1px;overflow:hidden;">'
            . '<input type="text" name="' . self::e($hpField) . '" value="" tabindex="-1" autocomplete="off">'
            . '</div>'
            . '<input type="hidden" name="' . self::e($tsField) . '" value="' . self::e($signedTs) . '">';
    }

    public static function verifyAntibot(Request $request): bool
    {
        $hpField = (string)Config::get('security.antibot.honeypot_field', 'website_url');
        $tsField = (string)Config::get('security.antibot.timestamp_field', 'form_ts');
        $minSeconds = (int)Config::get('security.antibot.min_fill_seconds', 2);
        $maxAge = (int)Config::get('security.antibot.max_form_age_seconds', 14400);

        $honeypot = $request->string($hpField, '');
        if ($honeypot !== '') {
            return false;
        }

        $rawTs = $request->string($tsField, '');
        if ($rawTs === '' || !str_contains($rawTs, '.')) {
            return false;
        }

        [$timestampStr, $signature] = explode('.', $rawTs, 2);
        if (!ctype_digit($timestampStr) || $signature === '') {
            return false;
        }

        if (!self::verifyHmac('form_ts:' . $timestampStr, $signature)) {
            return false;
        }

        $elapsed = time() - (int)$timestampStr;
        if ($elapsed < $minSeconds || $elapsed > $maxAge) {
            return false;
        }

        return true;
    }

    public static function hashPassword(string $password): string
    {
        if (defined('PASSWORD_ARGON2ID')) {
            return password_hash($password, PASSWORD_ARGON2ID);
        }
        return password_hash($password, PASSWORD_BCRYPT, ['cost' => 12]);
    }

    public static function verifyPassword(string $password, string $hash): bool
    {
        if ($password === '' || $hash === '') {
            return false;
        }
        return password_verify($password, $hash);
    }

    public static function needsPasswordRehash(string $hash): bool
    {
        if (defined('PASSWORD_ARGON2ID')) {
            return password_needs_rehash($hash, PASSWORD_ARGON2ID);
        }
        return password_needs_rehash($hash, PASSWORD_BCRYPT, ['cost' => 12]);
    }

    public static function isPasswordStrongEnough(string $password): bool
    {
        $minLength = (int)Config::get('security.password.min_length', 8);
        return mb_strlen($password, 'UTF-8') >= $minLength;
    }

    public static function randomToken(int $bytes = 32): string
    {
        return bin2hex(random_bytes(max(16, $bytes)));
    }

    public static function hashToken(string $token): string
    {
        return hash('sha256', $token);
    }

    public static function hmac(string $data): string
    {
        return hash_hmac('sha256', $data, self::secretKey());
    }

    public static function verifyHmac(string $data, string $signature): bool
    {
        if ($signature === '') {
            return false;
        }
        return hash_equals(self::hmac($data), $signature);
    }

    private static function secretKey(): string
    {
        $key = (string)Config::env('APP_KEY', '');
        if ($key !== '') {
            return $key;
        }

        $fallback = (string)(Config::env('DB_PASS') ?? Config::env('DB_PASSWORD', ''))
            . '|' . (string)(Config::env('DB_NAME') ?? Config::env('DB_DATABASE', ''))
            . '|' . APP_ROOT;

        return hash('sha256', $fallback);
    }
}