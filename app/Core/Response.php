<?php
declare(strict_types=1);

namespace App\Core;

use RuntimeException;

final class Response
{
    private int $status;
    private array $headers = [];
    private string $body;
    private ?string $filePath;
    private bool $deleteAfterSend;

    public function __construct(
        string $body = '',
        int $status = 200,
        array $headers = [],
        ?string $filePath = null,
        bool $deleteAfterSend = false
    ) {
        $this->body = $body;
        $this->status = $status;
        $this->filePath = $filePath;
        $this->deleteAfterSend = $deleteAfterSend;

        foreach ($headers as $name => $value) {
            if (is_string($name) && is_scalar($value)) {
                $this->setHeader($name, (string)$value);
            }
        }
    }

    public static function html(string $content, int $status = 200, array $headers = []): self
    {
        $defaults = ['Content-Type' => 'text/html; charset=UTF-8'];
        return new self($content, $status, array_merge($defaults, $headers));
    }

    public static function json(array $data, int $status = 200, array $headers = []): self
    {
        $encoded = json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        if ($encoded === false) {
            $encoded = '{"success":false,"error":"JSON encoding error"}';
            $status = 500;
        }

        $defaults = [
            'Content-Type' => 'application/json; charset=UTF-8',
            'Cache-Control' => 'no-store, no-cache, must-revalidate, max-age=0',
        ];
        return new self($encoded, $status, array_merge($defaults, $headers));
    }

    public static function text(string $content, int $status = 200, array $headers = []): self
    {
        $defaults = ['Content-Type' => 'text/plain; charset=UTF-8'];
        return new self($content, $status, array_merge($defaults, $headers));
    }

    public static function xml(string $content, int $status = 200, array $headers = []): self
    {
        $defaults = ['Content-Type' => 'application/xml; charset=UTF-8'];
        return new self($content, $status, array_merge($defaults, $headers));
    }

    public static function empty(int $status = 204, array $headers = []): self
    {
        return new self('', $status, $headers);
    }

    public static function redirect(string $url, int $status = 302, bool $allowExternal = false): self
    {
        $sanitized = self::sanitizeHeaderValue($url);
        if (!$allowExternal) {
            $sanitized = self::ensureSafeRedirect($sanitized);
        }
        return new self('', $status, ['Location' => $sanitized]);
    }

    public static function download(
        string $filePath,
        string $downloadName,
        string $contentType = 'application/octet-stream',
        bool $deleteAfterSend = false
    ): self {
        if (!is_file($filePath) || !is_readable($filePath)) {
            throw new RuntimeException('Download file is not readable.');
        }

        $cleanName = preg_replace('/[\r\n"\\\\\/]+/', '_', trim($downloadName)) ?? 'file';
        if ($cleanName === '') {
            $cleanName = 'file';
        }
        $asciiName = preg_replace('/[^\x20-\x7E]/', '_', $cleanName) ?? 'file';
        $disposition = sprintf(
            'attachment; filename="%s"; filename*=UTF-8\'\'%s',
            $asciiName,
            rawurlencode($cleanName)
        );

        $headers = [
            'Content-Type' => $contentType,
            'Content-Disposition' => $disposition,
            'Cache-Control' => 'no-store, no-cache, must-revalidate, max-age=0',
            'Pragma' => 'no-cache',
        ];

        return new self('', 200, $headers, $filePath, $deleteAfterSend);
    }

    public function withStatus(int $status): self
    {
        $clone = clone $this;
        $clone->status = $status;
        return $clone;
    }

    public function withHeader(string $name, string $value): self
    {
        $clone = clone $this;
        $clone->setHeader($name, $value);
        return $clone;
    }

    public function withHeaders(array $headers): self
    {
        $clone = clone $this;
        foreach ($headers as $name => $value) {
            if (is_string($name) && is_scalar($value)) {
                $clone->setHeader($name, (string)$value);
            }
        }
        return $clone;
    }

    public function noCache(): self
    {
        return $this->withHeaders([
            'Cache-Control' => 'no-store, no-cache, must-revalidate, max-age=0',
            'Pragma' => 'no-cache',
            'Expires' => '0',
        ]);
    }

    public function status(): int
    {
        return $this->status;
    }

    public function body(): string
    {
        return $this->body;
    }

    public function header(string $name): ?string
    {
        $key = strtolower(trim($name));
        return $this->headers[$key]['value'] ?? null;
    }

    public function isHtml(): bool
    {
        $ct = strtolower((string)($this->header('Content-Type') ?? ''));
        return str_contains($ct, 'text/html');
    }

    public function send(bool $headOnly = false): void
    {
        if ($this->filePath !== null && is_file($this->filePath) && !isset($this->headers['content-length'])) {
            $size = filesize($this->filePath);
            if ($size !== false) {
                $this->setHeader('Content-Length', (string)$size);
            }
        }

        if (!headers_sent()) {
            http_response_code($this->status);
            foreach ($this->headers as $header) {
                header($header['name'] . ': ' . $header['value'], true);
            }
        }

        if ($headOnly || $this->status === 204 || $this->status === 304) {
            $this->cleanupFile();
            return;
        }

        if ($this->filePath !== null) {
            while (ob_get_level() > 0) {
                ob_end_clean();
            }
            if (is_file($this->filePath) && is_readable($this->filePath)) {
                readfile($this->filePath);
            }
            $this->cleanupFile();
            return;
        }

        echo $this->body;
    }

    private function setHeader(string $name, string $value): void
    {
        $cleanName = preg_replace('/[^A-Za-z0-9-]/', '', trim($name)) ?? '';
        if ($cleanName === '') {
            return;
        }
        $key = strtolower($cleanName);
        $this->headers[$key] = [
            'name' => $cleanName,
            'value' => self::sanitizeHeaderValue($value),
        ];
    }

    private static function sanitizeHeaderValue(string $value): string
    {
        return str_replace(["\r", "\n", "\0"], '', $value);
    }

    private static function ensureSafeRedirect(string $url): string
    {
        $url = trim($url);
        if ($url === '') {
            return '/';
        }

        if (str_starts_with($url, '/')) {
            if (str_starts_with($url, '//') || str_contains($url, '\\')) {
                return '/';
            }
            return $url;
        }

        $parsed = parse_url($url);
        $baseHost = strtolower((string)(parse_url(Config::baseUrl(), PHP_URL_HOST) ?? ''));
        $targetHost = strtolower((string)($parsed['host'] ?? ''));
        $scheme = strtolower((string)($parsed['scheme'] ?? ''));

        if ($baseHost !== '' && $targetHost === $baseHost && in_array($scheme, ['http', 'https'], true)) {
            $path = $parsed['path'] ?? '/';
            $query = isset($parsed['query']) ? '?' . $parsed['query'] : '';
            $fragment = isset($parsed['fragment']) ? '#' . $parsed['fragment'] : '';
            return $path . $query . $fragment;
        }

        return '/';
    }

    private function cleanupFile(): void
    {
        if ($this->deleteAfterSend && $this->filePath !== null && is_file($this->filePath)) {
            @unlink($this->filePath);
        }
    }
}