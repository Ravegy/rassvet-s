<?php
declare(strict_types=1);

namespace App\Core;

final class Autoloader
{
    private static array $prefixes = [];
    private static bool $registered = false;

    public static function register(string $baseDir): void
    {
        $normalizedBase = rtrim($baseDir, '/\\') . DIRECTORY_SEPARATOR;

        self::addNamespace('App\\', $normalizedBase);
        self::addNamespace('PHPMailer\\PHPMailer\\', $normalizedBase . 'Vendor' . DIRECTORY_SEPARATOR . 'PHPMailer' . DIRECTORY_SEPARATOR);

        if (!self::$registered) {
            spl_autoload_register([self::class, 'loadClass']);
            self::$registered = true;
        }
    }

    public static function addNamespace(string $prefix, string $baseDir): void
    {
        $prefix = trim($prefix, '\\') . '\\';
        $baseDir = rtrim($baseDir, '/\\') . DIRECTORY_SEPARATOR;
        self::$prefixes[$prefix] = $baseDir;
    }

    public static function loadClass(string $class): void
    {
        $class = ltrim($class, '\\');

        foreach (self::$prefixes as $prefix => $baseDir) {
            if (!str_starts_with($class, $prefix)) {
                continue;
            }

            $relativeClass = substr($class, strlen($prefix));
            if ($relativeClass === '' || !preg_match('/^[A-Za-z0-9_\\\\]+$/', $relativeClass)) {
                return;
            }

            $file = $baseDir . str_replace('\\', DIRECTORY_SEPARATOR, $relativeClass) . '.php';
            if (is_file($file)) {
                require_once $file;
            }
            return;
        }
    }
}