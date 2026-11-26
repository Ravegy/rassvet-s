<?php
declare(strict_types=1);

namespace App\Core;

final class Router
{
    public const string FOUND = 'found';
    public const string NOT_FOUND = 'not_found';
    public const string METHOD_NOT_ALLOWED = 'method_not_allowed';

    private array $staticRoutes = [];
    private array $dynamicRoutes = [];

    public function __construct(array $routes = [])
    {
        foreach ($routes as $route) {
            if (!is_array($route) || count($route) < 3) {
                continue;
            }
            $method = (string)$route[0];
            $pattern = (string)$route[1];
            $handler = $route[2];
            $middleware = isset($route[3]) && is_array($route[3]) ? $route[3] : [];
            $this->add($method, $pattern, $handler, $middleware);
        }
    }

    public function add(string $method, string $pattern, array|callable $handler, array $middleware = []): void
    {
        $method = strtoupper(trim($method));
        $pattern = self::normalizePattern($pattern);

        $definition = [
            'method' => $method,
            'pattern' => $pattern,
            'handler' => $handler,
            'middleware' => $middleware,
        ];

        if (!str_contains($pattern, '{')) {
            $this->staticRoutes[$pattern][$method] = $definition;
            return;
        }

        [$regex, $paramNames] = self::compilePattern($pattern);
        $definition['regex'] = $regex;
        $definition['params'] = $paramNames;
        $this->dynamicRoutes[] = $definition;
    }

    public function dispatch(Request $request): array
    {
        $method = $request->method();
        $lookupMethod = $method === 'HEAD' ? 'GET' : $method;
        $path = $request->path();
        $allowedMethods = [];

        if (isset($this->staticRoutes[$path])) {
            if (isset($this->staticRoutes[$path][$lookupMethod])) {
                $route = $this->staticRoutes[$path][$lookupMethod];
                return [
                    'status' => self::FOUND,
                    'handler' => $route['handler'],
                    'params' => [],
                    'middleware' => $route['middleware'],
                ];
            }
            foreach (array_keys($this->staticRoutes[$path]) as $allowed) {
                $allowedMethods[$allowed] = true;
            }
        }

        foreach ($this->dynamicRoutes as $route) {
            if (preg_match($route['regex'], $path, $matches) !== 1) {
                continue;
            }

            $params = [];
            $valid = true;
            foreach ($route['params'] as $name) {
                $decoded = rawurldecode((string)($matches[$name] ?? ''));
                if (!self::isSafeParam($decoded)) {
                    $valid = false;
                    break;
                }
                $params[$name] = $decoded;
            }

            if (!$valid) {
                continue;
            }

            if ($route['method'] === $lookupMethod) {
                return [
                    'status' => self::FOUND,
                    'handler' => $route['handler'],
                    'params' => $params,
                    'middleware' => $route['middleware'],
                ];
            }

            $allowedMethods[$route['method']] = true;
        }

        if ($allowedMethods !== []) {
            if (isset($allowedMethods['GET'])) {
                $allowedMethods['HEAD'] = true;
            }
            return [
                'status' => self::METHOD_NOT_ALLOWED,
                'allowed' => array_keys($allowedMethods),
            ];
        }

        return ['status' => self::NOT_FOUND];
    }

    private static function normalizePattern(string $pattern): string
    {
        $pattern = str_replace('\\', '/', trim($pattern));
        $pattern = preg_replace('#/+#', '/', $pattern) ?? '/';
        if ($pattern === '' || $pattern[0] !== '/') {
            $pattern = '/' . $pattern;
        }
        if ($pattern !== '/') {
            $pattern = rtrim($pattern, '/');
        }
        return $pattern === '' ? '/' : $pattern;
    }

    private static function compilePattern(string $pattern): array
    {
        $parts = preg_split('/(\{[a-zA-Z_][a-zA-Z0-9_]*\})/', $pattern, -1, PREG_SPLIT_DELIM_CAPTURE);
        if ($parts === false) {
            return ['#^' . preg_quote($pattern, '#') . '$#u', []];
        }

        $regex = '';
        $paramNames = [];
        foreach ($parts as $part) {
            if ($part === '') {
                continue;
            }
            if (preg_match('/^\{([a-zA-Z_][a-zA-Z0-9_]*)\}$/', $part, $match) === 1) {
                $paramNames[] = $match[1];
                $regex .= '(?P<' . $match[1] . '>[^/]+)';
            } else {
                $regex .= preg_quote($part, '#');
            }
        }

        return ['#^' . $regex . '$#u', $paramNames];
    }

    private static function isSafeParam(string $value): bool
    {
        if ($value === '' || strlen($value) > 200) {
            return false;
        }
        if (!mb_check_encoding($value, 'UTF-8')) {
            return false;
        }
        if (preg_match('/[\x00-\x1F\x7F]/', $value) === 1) {
            return false;
        }
        if (str_contains($value, '..') || str_contains($value, '/') || str_contains($value, '\\')) {
            return false;
        }
        return true;
    }
}