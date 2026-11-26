<?php
declare(strict_types=1);

namespace App\Core;

use RuntimeException;
use Throwable;

final class View
{
    private static array $shared = [];
    private static array $assetCache = [];

    public static function share(string|array $key, mixed $value = null): void
    {
        if (is_array($key)) {
            foreach ($key as $name => $item) {
                if (is_string($name) && $name !== '') {
                    self::$shared[$name] = $item;
                }
            }
            return;
        }

        if ($key !== '') {
            self::$shared[$key] = $value;
        }
    }

    public static function render(string $template, array $data = [], ?string $layout = 'layouts/main'): string
    {
        $templatePath = self::resolvePath($template);
        $mergedData = array_merge(self::defaultData(), self::$shared, $data);
        $content = self::renderFile($templatePath, $mergedData);

        if ($layout === null || $layout === '') {
            return $content;
        }

        $layoutPath = self::resolvePath($layout);
        $layoutData = array_merge($mergedData, ['content' => $content]);

        return self::renderFile($layoutPath, $layoutData);
    }

    public static function partial(string $template, array $data = []): string
    {
        $templatePath = self::resolvePath($template);
        $mergedData = array_merge(self::defaultData(), self::$shared, $data);

        return self::renderFile($templatePath, $mergedData);
    }

    public static function response(
        string $template,
        array $data = [],
        ?string $layout = 'layouts/main',
        int $status = 200,
        array $headers = []
    ): Response {
        $html = self::render($template, $data, $layout);
        return Response::html($html, $status, $headers);
    }

    public static function exists(string $template): bool
    {
        try {
            self::resolvePath($template);
            return true;
        } catch (RuntimeException) {
            return false;
        }
    }

    public static function e(mixed $value): string
    {
        return Security::e($value);
    }

    public static function asset(string $path): string
    {
        $clean = '/' . ltrim(trim($path), '/');
        if (isset(self::$assetCache[$clean])) {
            return self::$assetCache[$clean];
        }

        $pathWithoutQuery = explode('?', $clean, 2)[0];
        if (str_contains($pathWithoutQuery, '..') || str_contains($pathWithoutQuery, '\\')) {
            return $clean;
        }

        $fullPath = APP_ROOT . $pathWithoutQuery;
        if (is_file($fullPath)) {
            $mtime = @filemtime($fullPath);
            if ($mtime !== false) {
                $separator = str_contains($clean, '?') ? '&' : '?';
                $versioned = $clean . $separator . 'v=' . $mtime;
                self::$assetCache[$clean] = $versioned;
                return $versioned;
            }
        }

        self::$assetCache[$clean] = $clean;
        return $clean;
    }

    public static function url(string $path = ''): string
    {
        $base = Config::baseUrl();
        $clean = '/' . ltrim(trim($path), '/');
        return $clean === '/' ? $base . '/' : $base . $clean;
    }

    public static function json(mixed $value): string
    {
        $encoded = json_encode(
            $value,
            JSON_UNESCAPED_UNICODE
            | JSON_UNESCAPED_SLASHES
            | JSON_HEX_TAG
            | JSON_HEX_AMP
            | JSON_HEX_APOS
            | JSON_HEX_QUOT
        );
        return is_string($encoded) ? $encoded : 'null';
    }

    private static function defaultData(): array
    {
        return [
            'cspNonce' => Security::cspNonce(),
            'baseUrl' => Config::baseUrl(),
            'appName' => (string)Config::get('app.name', 'Рассвет-С'),
        ];
    }

    private static function resolvePath(string $template): string
    {
        $clean = trim(str_replace('\\', '/', $template), '/');
        if (
            $clean === ''
            || str_contains($clean, '..')
            || preg_match('/^[a-zA-Z0-9_\/-]+$/', $clean) !== 1
        ) {
            throw new RuntimeException('Invalid view template name.');
        }

        $viewsDir = rtrim((string)Config::get('app.paths.views', APP_ROOT . '/views'), '/\\');
        $fullPath = $viewsDir . '/' . $clean . '.php';

        if (!is_file($fullPath) || !is_readable($fullPath)) {
            throw new RuntimeException('View template not found: ' . $clean);
        }

        return $fullPath;
    }

    private static function renderFile(string $filePath, array $data): string
    {
        $renderer = static function (string $__viewFilePath, array $__viewData): string {
            extract($__viewData, EXTR_SKIP);
            ob_start();
            try {
                require $__viewFilePath;
                $output = ob_get_clean();
                return is_string($output) ? $output : '';
            } catch (Throwable $e) {
                while (ob_get_level() > 0) {
                    ob_end_clean();
                }
                throw $e;
            }
        };

        return $renderer($filePath, $data);
    }
}