<?php
declare(strict_types=1);

namespace App\Core;

final class RateLimiter
{
    public static function attempt(
        string $bucket,
        string $identifier,
        ?int $limit = null,
        ?int $window = null
    ): array {
        [$maxAttempts, $windowSeconds] = self::resolvePolicy($bucket, $limit, $window);
        $now = time();
        $dir = self::storageDir();

        if ($dir === null) {
            return [
                'allowed' => true,
                'limit' => $maxAttempts,
                'remaining' => $maxAttempts - 1,
                'retry_after' => 0,
                'reset' => $now + $windowSeconds,
            ];
        }

        if (random_int(1, 100) === 1) {
            self::prune();
        }

        $path = self::filePath($dir, $bucket, $identifier);
        $fp = @fopen($path, 'c+');
        if ($fp === false) {
            return [
                'allowed' => true,
                'limit' => $maxAttempts,
                'remaining' => $maxAttempts - 1,
                'retry_after' => 0,
                'reset' => $now + $windowSeconds,
            ];
        }

        try {
            if (!flock($fp, LOCK_EX)) {
                return [
                    'allowed' => true,
                    'limit' => $maxAttempts,
                    'remaining' => $maxAttempts - 1,
                    'retry_after' => 0,
                    'reset' => $now + $windowSeconds,
                ];
            }

            $raw = stream_get_contents($fp);
            $decoded = is_string($raw) && $raw !== '' ? json_decode($raw, true) : [];
            $timestamps = [];

            if (is_array($decoded)) {
                $cutoff = $now - $windowSeconds;
                foreach ($decoded as $ts) {
                    if (is_int($ts) && $ts > $cutoff) {
                        $timestamps[] = $ts;
                    }
                }
            }

            $count = count($timestamps);
            if ($count >= $maxAttempts) {
                $oldest = min($timestamps);
                $reset = $oldest + $windowSeconds;
                $retryAfter = max(1, $reset - $now);

                self::writeLocked($fp, $timestamps);

                return [
                    'allowed' => false,
                    'limit' => $maxAttempts,
                    'remaining' => 0,
                    'retry_after' => $retryAfter,
                    'reset' => $reset,
                ];
            }

            $timestamps[] = $now;
            self::writeLocked($fp, $timestamps);

            $oldest = $timestamps[0];

            return [
                'allowed' => true,
                'limit' => $maxAttempts,
                'remaining' => max(0, $maxAttempts - count($timestamps)),
                'retry_after' => 0,
                'reset' => $oldest + $windowSeconds,
            ];
        } finally {
            flock($fp, LOCK_UN);
            fclose($fp);
        }
    }

    public static function clear(string $bucket, string $identifier): void
    {
        $dir = self::storageDir();
        if ($dir === null) {
            return;
        }
        $path = self::filePath($dir, $bucket, $identifier);
        if (is_file($path)) {
            @unlink($path);
        }
    }

    public static function prune(int $maxAge = 86400): void
    {
        $dir = self::storageDir();
        if ($dir === null) {
            return;
        }

        $files = @glob($dir . '/*.json');
        if (!is_array($files)) {
            return;
        }

        $threshold = time() - max(60, $maxAge);
        foreach ($files as $file) {
            if (!is_file($file)) {
                continue;
            }
            $mtime = @filemtime($file);
            if ($mtime !== false && $mtime < $threshold) {
                @unlink($file);
            }
        }
    }

    private static function resolvePolicy(string $bucket, ?int $limit, ?int $window): array
    {
        $config = Config::get('security.rate_limits.' . $bucket);
        if (!is_array($config)) {
            $config = Config::get('security.rate_limits.api_default', []);
        }

        $resolvedLimit = $limit ?? (int)($config['limit'] ?? 60);
        $resolvedWindow = $window ?? (int)($config['window'] ?? 60);

        return [max(1, $resolvedLimit), max(1, $resolvedWindow)];
    }

    private static function storageDir(): ?string
    {
        $dir = rtrim((string)Config::get('app.paths.ratelimit', APP_ROOT . '/storage/ratelimit'), '/\\');
        if (!is_dir($dir)) {
            @mkdir($dir, 0755, true);
        }
        if (!is_dir($dir) || !is_writable($dir)) {
            return null;
        }
        return $dir;
    }

    private static function filePath(string $dir, string $bucket, string $identifier): string
    {
        return $dir . '/' . hash('sha256', $bucket . '|' . $identifier) . '.json';
    }

    private static function writeLocked($fp, array $timestamps): void
    {
        rewind($fp);
        ftruncate($fp, 0);
        fwrite($fp, (string)json_encode(array_values($timestamps)));
        fflush($fp);
    }
}