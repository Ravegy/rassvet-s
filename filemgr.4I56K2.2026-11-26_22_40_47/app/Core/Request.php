<?php
declare(strict_types=1);

namespace App\Core;

final class Request
{
    private string $method;
    private string $path;
    private string $rawUri;
    private array $query;
    private array $post;
    private array $cookies;
    private array $files;
    private array $server;
    private array $headers;
    private array $routeParams = [];
    private bool $jsonParsed = false;
    private array $json = [];

    public function __construct(
        array $query = [],
        array $post = [],
        array $cookies = [],
        array $files = [],
        array $server = []
    ) {
        $this->query = $query;
        $this->post = $post;
        $this->cookies = $cookies;
        $this->files = $files;
        $this->server = $server;
        $this->headers = self::extractHeaders($server);
        $this->method = strtoupper((string)($server['REQUEST_METHOD'] ?? 'GET'));
        $this->rawUri = (string)($server['REQUEST_URI'] ?? '/');
        $this->path = self::normalizePath($this->rawUri);
    }

    public static function capture(): self
    {
        return new self($_GET, $_POST, $_COOKIE, $_FILES, $_SERVER);
    }

    public function method(): string
    {
        return $this->method;
    }

    public function isMethod(string $method): bool
    {
        return $this->method === strtoupper($method);
    }

    public function isGet(): bool
    {
        return $this->method === 'GET';
    }

    public function isPost(): bool
    {
        return $this->method === 'POST';
    }

    public function path(): string
    {
        return $this->path;
    }

    public function rawUri(): string
    {
        return $this->rawUri;
    }

    public function query(?string $key = null, mixed $default = null): mixed
    {
        if ($key === null) {
            return $this->query;
        }
        return $this->query[$key] ?? $default;
    }

    public function post(?string $key = null, mixed $default = null): mixed
    {
        if ($key === null) {
            return $this->post;
        }
        return $this->post[$key] ?? $default;
    }

    public function json(?string $key = null, mixed $default = null): mixed
    {
        if (!$this->jsonParsed) {
            $this->jsonParsed = true;
            $contentType = strtolower((string)$this->header('content-type', ''));
            if (str_contains($contentType, 'application/json')) {
                $raw = file_get_contents('php://input');
                if (is_string($raw) && $raw !== '') {
                    $decoded = json_decode($raw, true);
                    if (is_array($decoded)) {
                        $this->json = $decoded;
                    }
                }
            }
        }

        if ($key === null) {
            return $this->json;
        }
        return $this->json[$key] ?? $default;
    }

    public function input(string $key, mixed $default = null): mixed
    {
        if (array_key_exists($key, $this->post)) {
            return $this->post[$key];
        }
        $json = $this->json();
        if (array_key_exists($key, $json)) {
            return $json[$key];
        }
        if (array_key_exists($key, $this->query)) {
            return $this->query[$key];
        }
        return $default;
    }

    public function string(string $key, string $default = ''): string
    {
        $value = $this->input($key);
        if (!is_scalar($value)) {
            return $default;
        }
        return trim((string)$value);
    }

    public function int(string $key, int $default = 0): int
    {
        $value = $this->input($key);
        if (is_int($value)) {
            return $value;
        }
        if (is_numeric($value)) {
            return (int)$value;
        }
        return $default;
    }

    public function float(string $key, float $default = 0.0): float
    {
        $value = $this->input($key);
        if (is_float($value) || is_int($value)) {
            return (float)$value;
        }
        if (is_string($value)) {
            $normalized = str_replace(',', '.', trim($value));
            if (is_numeric($normalized)) {
                return (float)$normalized;
            }
        }
        return $default;
    }

    public function bool(string $key, bool $default = false): bool
    {
        $value = $this->input($key);
        if ($value === null) {
            return $default;
        }
        if (is_bool($value)) {
            return $value;
        }
        return in_array(strtolower(trim((string)$value)), ['1', 'true', 'yes', 'on'], true);
    }

    public function cookie(string $key, mixed $default = null): mixed
    {
        return $this->cookies[$key] ?? $default;
    }

    public function file(string $key): ?array
    {
        $file = $this->files[$key] ?? null;
        if (!is_array($file) || !isset($file['name']) || is_array($file['name'])) {
            return null;
        }
        return $file;
    }

    public function files(string $key): array
    {
        $entry = $this->files[$key] ?? null;
        if (!is_array($entry) || !isset($entry['name'])) {
            return [];
        }

        if (!is_array($entry['name'])) {
            return [$entry];
        }

        $normalized = [];
        $count = count($entry['name']);
        for ($i = 0; $i < $count; $i++) {
            $normalized[] = [
                'name' => $entry['name'][$i] ?? '',
                'full_path' => $entry['full_path'][$i] ?? '',
                'type' => $entry['type'][$i] ?? '',
                'tmp_name' => $entry['tmp_name'][$i] ?? '',
                'error' => $entry['error'][$i] ?? UPLOAD_ERR_NO_FILE,
                'size' => $entry['size'][$i] ?? 0,
            ];
        }

        return $normalized;
    }

    public function header(string $name, ?string $default = null): ?string
    {
        $key = strtolower(trim($name));
        return $this->headers[$key] ?? $default;
    }

    public function ip(): string
    {
        $ip = trim((string)($this->server['REMOTE_ADDR'] ?? ''));
        if ($ip !== '' && filter_var($ip, FILTER_VALIDATE_IP) !== false) {
            return $ip;
        }
        return '0.0.0.0';
    }

    public function userAgent(): string
    {
        return substr((string)$this->header('user-agent', ''), 0, 500);
    }

    public function isHttps(): bool
    {
        $https = strtolower((string)($this->server['HTTPS'] ?? ''));
        if ($https !== '' && $https !== 'off') {
            return true;
        }
        $forwardedProto = strtolower((string)($this->server['HTTP_X_FORWARDED_PROTO'] ?? ''));
        if ($forwardedProto === 'https') {
            return true;
        }
        return (string)($this->server['SERVER_PORT'] ?? '') === '443';
    }

    public function host(): string
    {
        $host = strtolower(trim((string)($this->server['HTTP_HOST'] ?? '')));
        $host = explode(':', $host, 2)[0];
        if ($host !== '' && preg_match('/^[a-z0-9.-]+$/', $host)) {
            return $host;
        }
        $parsed = parse_url(Config::baseUrl(), PHP_URL_HOST);
        return is_string($parsed) ? strtolower($parsed) : 'rassvet-s.tech';
    }

    public function isAjax(): bool
    {
        $requestedWith = strtolower((string)$this->header('x-requested-with', ''));
        if ($requestedWith === 'xmlhttprequest') {
            return true;
        }
        return $this->query('ajax') === '1';
    }

    public function expectsJson(): bool
    {
        if ($this->isAjax()) {
            return true;
        }
        $accept = strtolower((string)$this->header('accept', ''));
        if (str_contains($accept, 'application/json')) {
            return true;
        }
        $contentType = strtolower((string)$this->header('content-type', ''));
        if (str_contains($contentType, 'application/json')) {
            return true;
        }
        return str_starts_with($this->path, '/api/');
    }

    public function origin(): ?string
    {
        return $this->header('origin');
    }

    public function referer(): ?string
    {
        return $this->header('referer');
    }

    public function setRouteParams(array $params): void
    {
        $this->routeParams = $params;
    }

    public function routeParam(string $key, mixed $default = null): mixed
    {
        return $this->routeParams[$key] ?? $default;
    }

    public function routeParams(): array
    {
        return $this->routeParams;
    }

    private static function extractHeaders(array $server): array
    {
        $headers = [];
        foreach ($server as $key => $value) {
            if (!is_string($key) || !is_scalar($value)) {
                continue;
            }
            if (str_starts_with($key, 'HTTP_')) {
                $name = strtolower(str_replace('_', '-', substr($key, 5)));
                $headers[$name] = (string)$value;
            } elseif ($key === 'CONTENT_TYPE') {
                $headers['content-type'] = (string)$value;
            } elseif ($key === 'CONTENT_LENGTH') {
                $headers['content-length'] = (string)$value;
            }
        }
        return $headers;
    }

    private static function normalizePath(string $rawUri): string
    {
        $path = explode('?', $rawUri, 2)[0];
        $path = str_replace('\\', '/', $path);
        $path = preg_replace('#/+#', '/', $path) ?? '/';
        if ($path === '' || $path[0] !== '/') {
            $path = '/' . $path;
        }
        if ($path !== '/') {
            $path = rtrim($path, '/');
        }
        return $path === '' ? '/' : $path;
    }
}