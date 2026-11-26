<?php
declare(strict_types=1);

namespace App\Core;

use RuntimeException;
use Throwable;

final class App
{
    private array $extraHeaders = [];

    public function run(): void
    {
        $request = Request::capture();

        try {
            Session::start($request->isHttps());

            View::share([
                'currentPath' => $request->path(),
                'isAuth' => Session::isAuthenticated(),
                'isAdmin' => Session::isAdmin(),
                'csrfToken' => Security::csrfToken(),
                'appConfig' => Config::all('app'),
            ]);

            $router = new Router(Config::all('routes'));
            $dispatch = $router->dispatch($request);

            $response = match ($dispatch['status'] ?? Router::NOT_FOUND) {
                Router::FOUND => $this->handleFound($request, $dispatch),
                Router::METHOD_NOT_ALLOWED => $this->handleMethodNotAllowed($request, $dispatch['allowed'] ?? []),
                default => $this->errorResponse($request, 404, 'Страница не найдена', 'Запрошенная страница не существует или была перемещена.'),
            };
        } catch (Throwable $e) {
            Logger::exception($e, [
                'method' => $request->method(),
                'path' => $request->path(),
                'ip' => $request->ip(),
            ]);

            $message = Config::isDebug()
                ? $e->getMessage() . ' in ' . $e->getFile() . ':' . $e->getLine()
                : 'Внутренняя ошибка сервера. Попробуйте повторить запрос позже.';

            $response = $this->errorResponse($request, 500, 'Ошибка сервера', $message);
        }

        $response = $this->applyHeaders($response, $request);
        $response->send($request->isMethod('HEAD'));
    }

    private function handleFound(Request $request, array $dispatch): Response
    {
        $params = is_array($dispatch['params'] ?? null) ? $dispatch['params'] : [];
        $middleware = is_array($dispatch['middleware'] ?? null) ? $dispatch['middleware'] : [];
        $handler = $dispatch['handler'] ?? null;

        $request->setRouteParams($params);

        $blocked = $this->runMiddleware($middleware, $request);
        if ($blocked instanceof Response) {
            return $blocked;
        }

        $response = $this->invokeHandler($handler, $request);

        if (in_array('auth', $middleware, true) || in_array('admin', $middleware, true)) {
            $response = $response->noCache();
        }

        return $response;
    }

    private function handleMethodNotAllowed(Request $request, array $allowed): Response
    {
        $headers = [];
        if ($allowed !== []) {
            $headers['Allow'] = implode(', ', $allowed);
        }

        return $this->errorResponse(
            $request,
            405,
            'Метод не поддерживается',
            'Используемый HTTP-метод недопустим для данного маршрута.',
            $headers
        );
    }

    private function runMiddleware(array $middlewareList, Request $request): ?Response
    {
        foreach ($middlewareList as $rule) {
            if (!is_string($rule) || $rule === '') {
                continue;
            }

            if ($rule === 'csrf') {
                if (!Security::verifySameOrigin($request) || !Security::verifyCsrf($request)) {
                    Logger::security('CSRF validation failed', [
                        'method' => $request->method(),
                        'path' => $request->path(),
                        'ip' => $request->ip(),
                    ]);
                    return $this->errorResponse(
                        $request,
                        403,
                        'Ошибка безопасности',
                        'Сессия устарела или неверный токен безопасности. Обновите страницу и повторите попытку.'
                    );
                }
                continue;
            }

            if ($rule === 'auth') {
                if (!Session::isAuthenticated()) {
                    if ($request->expectsJson()) {
                        return Response::json(['success' => false, 'error' => 'Требуется авторизация.'], 401);
                    }
                    $target = '/cabinet/authorization';
                    if ($request->isGet() && $request->path() !== '/cabinet/authorization') {
                        $target .= '?next=' . rawurlencode($request->rawUri());
                    }
                    return Response::redirect($target);
                }
                continue;
            }

            if ($rule === 'admin') {
                if (!Session::isAdmin()) {
                    Logger::security('Admin access denied', [
                        'user_id' => Session::userId(),
                        'path' => $request->path(),
                        'ip' => $request->ip(),
                    ]);
                    return $this->errorResponse(
                        $request,
                        403,
                        'Доступ запрещён',
                        'У вас недостаточно прав для просмотра этого раздела.'
                    );
                }
                continue;
            }

            if (str_starts_with($rule, 'rate:')) {
                $bucket = trim(substr($rule, 5));
                if ($bucket === '') {
                    $bucket = 'api_default';
                }
                $result = RateLimiter::attempt($bucket, $request->ip());
                $rateHeaders = [
                    'X-RateLimit-Limit' => (string)$result['limit'],
                    'X-RateLimit-Remaining' => (string)$result['remaining'],
                    'X-RateLimit-Reset' => (string)$result['reset'],
                ];
                $this->extraHeaders = array_merge($this->extraHeaders, $rateHeaders);

                if (!$result['allowed']) {
                    Logger::security('Rate limit exceeded', [
                        'bucket' => $bucket,
                        'path' => $request->path(),
                        'ip' => $request->ip(),
                    ]);
                    $rateHeaders['Retry-After'] = (string)$result['retry_after'];
                    return $this->errorResponse(
                        $request,
                        429,
                        'Слишком много запросов',
                        'Превышен лимит обращений. Повторите попытку позже.',
                        $rateHeaders
                    );
                }
            }
        }

        return null;
    }

    private function invokeHandler(mixed $handler, Request $request): Response
    {
        if (is_array($handler) && count($handler) === 2 && is_string($handler[0]) && is_string($handler[1])) {
            [$class, $method] = $handler;
            if (!class_exists($class)) {
                throw new RuntimeException('Controller class not found: ' . $class);
            }
            $instance = new $class();
            if (!method_exists($instance, $method)) {
                throw new RuntimeException('Controller method not found: ' . $class . '::' . $method);
            }
            $result = $instance->$method($request);
        } elseif (is_callable($handler)) {
            $result = $handler($request);
        } else {
            throw new RuntimeException('Invalid route handler.');
        }

        if ($result instanceof Response) {
            return $result;
        }
        if (is_string($result)) {
            return Response::html($result);
        }
        if (is_array($result)) {
            return Response::json($result);
        }

        throw new RuntimeException('Route handler must return Response, string, or array.');
    }

    private function applyHeaders(Response $response, Request $request): Response
    {
        $headers = $this->extraHeaders;

        $defaults = [
            'X-Content-Type-Options' => 'nosniff',
            'X-Frame-Options' => 'DENY',
            'Referrer-Policy' => 'strict-origin-when-cross-origin',
            'Permissions-Policy' => 'geolocation=(), microphone=(), camera=(), payment=()',
        ];

        if ($request->isHttps()) {
            $defaults['Strict-Transport-Security'] = 'max-age=31536000; includeSubDomains';
        }

        if ($response->isHtml() && $response->header('Content-Security-Policy') === null) {
            $csp = Security::buildCspHeader();
            if ($csp !== '') {
                $defaults['Content-Security-Policy'] = $csp;
            }
        }

        foreach ($defaults as $name => $value) {
            if ($response->header($name) === null && !isset($headers[$name])) {
                $headers[$name] = $value;
            }
        }

        return $headers !== [] ? $response->withHeaders($headers) : $response;
    }

    private function errorResponse(
        Request $request,
        int $status,
        string $title,
        string $message,
        array $headers = []
    ): Response {
        if ($request->expectsJson()) {
            return Response::json([
                'success' => false,
                'error' => $message,
            ], $status, $headers);
        }

        $viewName = 'errors/' . $status;
        if (!View::exists($viewName) && View::exists('errors/error')) {
            $viewName = 'errors/error';
        }

        if (View::exists($viewName)) {
            try {
                return View::response($viewName, [
                    'pageTitle' => $status . ' — ' . $title,
                    'statusCode' => $status,
                    'errorTitle' => $title,
                    'errorMessage' => $message,
                ], 'layouts/main', $status, $headers);
            } catch (Throwable) {
            }
        }

        return Response::html($this->fallbackErrorHtml($status, $title, $message), $status, $headers);
    }

    private function fallbackErrorHtml(int $status, string $title, string $message): string
    {
        $safeTitle = Security::e($title);
        $safeMessage = Security::e($message);

        return '<!DOCTYPE html><html lang="ru"><head><meta charset="UTF-8">'
            . '<meta name="viewport" content="width=device-width,initial-scale=1">'
            . '<title>' . $status . ' — ' . $safeTitle . '</title>'
            . '<style>body{margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;background:#f4f5f7;color:#1f2937;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;padding:24px;box-sizing:border-box}'
            . '.box{max-width:460px;width:100%;background:#fff;border:1px solid #e5e7eb;border-radius:10px;padding:32px;text-align:center}'
            . '.code{font-size:48px;font-weight:700;color:#d92d20;line-height:1;margin:0 0 12px}'
            . 'h1{font-size:20px;margin:0 0 10px}p{font-size:15px;color:#4b5563;margin:0 0 24px;line-height:1.5}'
            . 'a{display:inline-block;padding:10px 20px;background:#1f2937;color:#fff;text-decoration:none;border-radius:6px;font-size:14px;font-weight:500}'
            . 'a:hover{background:#111827}</style></head><body><main class="box">'
            . '<div class="code">' . $status . '</div>'
            . '<h1>' . $safeTitle . '</h1>'
            . '<p>' . $safeMessage . '</p>'
            . '<a href="/">На главную</a>'
            . '</main></body></html>';
    }
}