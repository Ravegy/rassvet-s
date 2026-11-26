<?php
declare(strict_types=1);

namespace App\Core;

use Throwable;

final class Logger
{
    private const int MAX_FILE_SIZE = 5242880;
    private const int MAX_CONTEXT_DEPTH = 4;
    private const int MAX_STRING_LENGTH = 500;
    private const array SENSITIVE_KEYS = [
        'password',
        'pass',
        'passwd',
        'pwd',
        'token',
        'csrf',
        'secret',
        'api_key',
        'apikey',
        'authorization',
        'cookie',
        'session',
        'hash',
        'smtp_pass',
        'db_pass',
    ];

    public static function info(string $message, array $context = [], string $channel = 'app'): void
    {
        self::write('INFO', $message, $context, $channel);
    }

    public static function warning(string $message, array $context = [], string $channel = 'app'): void
    {
        self::write('WARNING', $message, $context, $channel);
    }

    public static function error(string $message, array $context = [], string $channel = 'error'): void
    {
        self::write('ERROR', $message, $context, $channel);
    }

    public static function security(string $message, array $context = []): void
    {
        self::write('SECURITY', $message, $context, 'security');
    }

    public static function exception(Throwable $e, array $context = [], string $channel = 'error'): void
    {
        $payload = array_merge([
            'exception' => $e::class,
            'code' => $e->getCode(),
            'file' => $e->getFile(),
            'line' => $e->getLine(),
        ], $context);

        self::write('ERROR', $e->getMessage(), $payload, $channel);
    }

    public static function write(string $level, string $message, array $context = [], string $channel = 'app'): void
    {
        $dir = self::resolveDir();
        if ($dir === null) {
            return;
        }

        $safeChannel = self::sanitizeChannel($channel);
        $filePath = $dir . '/' . $safeChannel . '.log';
        self::rotateIfNeeded($filePath);

        $safeLevel = preg_replace('/[^A-Z0-9_-]/', '', strtoupper(trim($level))) ?: 'INFO';
        $safeMessage = self::sanitizeString($message, 1000);

        $line = sprintf('[%s] [%s] %s', date('Y-m-d H:i:s'), $safeLevel, $safeMessage);

        if ($context !== []) {
            $cleanContext = self::sanitizeContext($context);
            $encoded = json_encode($cleanContext, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
            if (is_string($encoded) && $encoded !== '') {
                $line .= ' ' . $encoded;
            }
        }

        @file_put_contents($filePath, $line . PHP_EOL, FILE_APPEND | LOCK_EX);
    }

    private static function resolveDir(): ?string
    {
        $dir = rtrim((string)Config::get('app.paths.logs', APP_ROOT . '/storage/logs'), '/\\');
        if (!is_dir($dir)) {
            @mkdir($dir, 0755, true);
        }
        if (!is_dir($dir) || !is_writable($dir)) {
            return null;
        }
        return $dir;
    }

    private static function sanitizeChannel(string $channel): string
    {
        $clean = preg_replace('/[^a-z0-9_-]/', '', strtolower(trim($channel))) ?? '';
        return $clean !== '' ? $clean : 'app';
    }

    private static function sanitizeString(string $value, int $maxLength = self::MAX_STRING_LENGTH): string
    {
        $clean = str_replace(["\r\n", "\r", "\n", "\t"], ' ', $value);
        $clean = preg_replace('/[\x00-\x1F\x7F]/u', '', $clean) ?? '';
        $clean = trim($clean);
        if (mb_strlen($clean, 'UTF-8') > $maxLength) {
            $clean = mb_substr($clean, 0, $maxLength, 'UTF-8') . '...';
        }
        return $clean;
    }

    private static function sanitizeContext(array $context, int $depth = 0): array
    {
        if ($depth >= self::MAX_CONTEXT_DEPTH) {
            return ['_truncated' => true];
        }

        $result = [];
        foreach ($context as $key => $value) {
            $keyStr = is_string($key) ? $key : (string)$key;
            if (self::isSensitiveKey($keyStr)) {
                $result[$keyStr] = '[REDACTED]';
                continue;
            }

            if (is_array($value)) {
                $result[$keyStr] = self::sanitizeContext($value, $depth + 1);
            } elseif (is_string($value)) {
                $result[$keyStr] = self::sanitizeString($value);
            } elseif (is_int($value) || is_float($value) || is_bool($value) || $value === null) {
                $result[$keyStr] = $value;
            } elseif ($value instanceof Throwable) {
                $result[$keyStr] = $value::class . ': ' . self::sanitizeString($value->getMessage());
            } else {
                $result[$keyStr] = get_debug_type($value);
            }
        }

        return $result;
    }

    private static function isSensitiveKey(string $key): bool
    {
        $lower = strtolower($key);
        foreach (self::SENSITIVE_KEYS as $sensitive) {
            if (str_contains($lower, $sensitive)) {
                return true;
            }
        }
        return false;
    }

    private static function rotateIfNeeded(string $filePath): void
    {
        if (!is_file($filePath)) {
            return;
        }
        $size = @filesize($filePath);
        if ($size === false || $size < self::MAX_FILE_SIZE) {
            return;
        }

        $backup2 = $filePath . '.2';
        $backup1 = $filePath . '.1';

        if (is_file($backup2)) {
            @unlink($backup2);
        }
        if (is_file($backup1)) {
            @rename($backup1, $backup2);
        }
        @rename($filePath, $backup1);
    }
}