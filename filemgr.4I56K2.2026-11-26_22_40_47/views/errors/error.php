<?php
declare(strict_types=1);

use App\Core\View;

$code = (int)($statusCode ?? 404);
$title = (string)($errorTitle ?? 'Страница не найдена');
$message = (string)($errorMessage ?? 'Запрошенная страница не существует или была перемещена.');
$auth = (bool)($isAuth ?? false);

$badgeClass = match (true) {
    $code >= 500 || $code === 403 => 'badge--danger',
    $code === 429 => 'badge--warning',
    default => 'badge--accent',
};
?>
<section class="page-section">
    <div class="container">
        <div class="empty-state">
            <div class="empty-state__icon" aria-hidden="true">
                <?php if ($code === 403): ?>
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                <?php elseif ($code >= 500): ?>
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>
                <?php elseif ($code === 429): ?>
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                <?php else: ?>
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/><path d="M8 11h6"/></svg>
                <?php endif; ?>
            </div>

            <span class="badge <?= View::e($badgeClass) ?> mono">Ошибка <?= $code ?></span>

            <h1 class="empty-state__title"><?= View::e($title) ?></h1>
            <p class="empty-state__text"><?= View::e($message) ?></p>

            <div class="cluster">
                <a class="btn btn--primary" href="/">На главную</a>
                <a class="btn btn--secondary" href="/stock">В наличии на складе</a>
                <a class="btn btn--secondary" href="/catalog">Каталог схем</a>
                <?php if ($code === 403 && !$auth): ?>
                <a class="btn btn--dark" href="/cabinet/authorization">Войти в кабинет</a>
                <?php endif; ?>
            </div>
        </div>
    </div>
</section>