<?php
declare(strict_types=1);

namespace App\Core;

abstract class Controller
{
    protected function view(
        string $template,
        array $data = [],
        ?string $layout = 'layouts/main',
        int $status = 200,
        array $headers = []
    ): Response {
        return View::response($template, $data, $layout, $status, $headers);
    }

    protected function partial(string $template, array $data = []): string
    {
        return View::partial($template, $data);
    }

    protected function json(array $data, int $status = 200, array $headers = []): Response
    {
        return Response::json($data, $status, $headers);
    }

    protected function jsonSuccess(array $data = [], int $status = 200, array $headers = []): Response
    {
        return Response::json(array_merge(['success' => true], $data), $status, $headers);
    }

    protected function jsonError(string $message, int $status = 400, array $extra = [], array $headers = []): Response
    {
        return Response::json(array_merge(['success' => false, 'error' => $message], $extra), $status, $headers);
    }

    protected function redirect(string $url, int $status = 302): Response
    {
        return Response::redirect($url, $status);
    }

    protected function abort(Request $request, int $status, string $title, string $message): Response
    {
        if ($request->expectsJson()) {
            return $this->jsonError($message, $status);
        }

        $viewName = 'errors/' . $status;
        if (!View::exists($viewName) && View::exists('errors/error')) {
            $viewName = 'errors/error';
        }

        if (View::exists($viewName)) {
            return $this->view($viewName, [
                'pageTitle' => $status . ' — ' . $title,
                'statusCode' => $status,
                'errorTitle' => $title,
                'errorMessage' => $message,
                'robots' => 'noindex, nofollow',
            ], 'layouts/main', $status);
        }

        return Response::html(
            '<!DOCTYPE html><html lang="ru"><head><meta charset="UTF-8"><title>'
            . $status . ' — ' . Security::e($title)
            . '</title></head><body><h1>' . Security::e($title)
            . '</h1><p>' . Security::e($message) . '</p></body></html>',
            $status
        );
    }

    protected function notFound(Request $request, string $message = 'Запрошенная страница не существует или была перемещена.'): Response
    {
        return $this->abort($request, 404, 'Страница не найдена', $message);
    }

    protected function forbidden(Request $request, string $message = 'У вас недостаточно прав для выполнения этого действия.'): Response
    {
        return $this->abort($request, 403, 'Доступ запрещён', $message);
    }

    protected function flash(string $key, mixed $value): void
    {
        Session::flash($key, $value);
    }

    protected function pullFlash(string $key, mixed $default = null): mixed
    {
        return Session::pullFlash($key, $default);
    }

    protected function userId(): ?int
    {
        return Session::userId();
    }

    protected function isAuth(): bool
    {
        return Session::isAuthenticated();
    }

    protected function isAdmin(): bool
    {
        return Session::isAdmin();
    }

    protected function deviceId(): string
    {
        return Session::deviceId();
    }

    protected function enableCspProfile(string $profile): void
    {
        Security::enableCspProfile($profile);
    }

    protected function verifyAntibot(Request $request): bool
    {
        return Security::verifyAntibot($request);
    }

    protected function seo(string $title, string $description = '', array $overrides = []): array
    {
        $siteName = (string)Config::get('app.name', 'Рассвет-С');
        $fullTitle = str_contains($title, $siteName) ? $title : $title . ' — ' . $siteName;
        $defaultOg = View::url((string)Config::get('app.assets.og_image', '/images/og-home.webp'));

        return array_merge([
            'pageTitle' => $fullTitle,
            'metaDescription' => $description,
            'ogTitle' => $fullTitle,
            'ogDescription' => $description,
            'ogImage' => $defaultOg,
            'ogType' => 'website',
            'robots' => 'index, follow',
            'canonical' => '',
            'jsonLd' => [],
        ], $overrides);
    }
}