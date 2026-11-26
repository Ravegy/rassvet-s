<?php
declare(strict_types=1);

use App\Core\View;

$path = (string)($currentPath ?? '/');
$config = isset($appConfig) && is_array($appConfig) ? $appConfig : [];
$contacts = isset($config['contacts']) && is_array($config['contacts']) ? $config['contacts'] : [];
$siteName = trim((string)($appName ?? $config['name'] ?? ''));
$siteSub = trim((string)($config['tagline'] ?? ''));
$phone = trim((string)($contacts['phone'] ?? ''));
$phoneHref = $phone !== '' ? 'tel:' . preg_replace('/[^+\d]/', '', $phone) : '';
$email = trim((string)($contacts['email'] ?? ''));
$workHours = trim((string)($contacts['work_hours'] ?? ''));
$city = trim((string)($contacts['city'] ?? ''));
$logoPath = trim((string)($config['assets']['logo'] ?? '/images/logo.webp'));

$auth = (bool)($isAuth ?? false);
$admin = (bool)($isAdmin ?? false);
$cartCount = (int)($cartCount ?? 0);
$favoritesCount = (int)($favoritesCount ?? 0);
$searchQuery = (string)($searchQuery ?? '');

$hasTopbarLeft = $city !== '' || $workHours !== '';
$hasTopbarRight = $email !== '' || $phone !== '';
$hasTopbar = $hasTopbarLeft || $hasTopbarRight;
$hasDrawerFooter = $phone !== '' || $email !== '' || $workHours !== '';

$isActive = static function (string $target) use ($path): bool {
    if ($target === '/') {
        return $path === '/';
    }
    return $path === $target || str_starts_with($path, $target . '/');
};

$navItems = [
    ['href' => '/stock', 'label' => 'В наличии на складе', 'stock' => true],
    ['href' => '/catalog', 'label' => 'Каталог схем', 'stock' => false],
    ['href' => '/delivery', 'label' => 'Доставка и оплата', 'stock' => false],
    ['href' => '/about', 'label' => 'О компании', 'stock' => false],
    ['href' => '/contacts', 'label' => 'Контакты', 'stock' => false],
];
?>
<?php if ($hasTopbar): ?>
<div class="topbar">
    <div class="container topbar__inner">
        <?php if ($hasTopbarLeft): ?>
        <div class="topbar__group">
            <?php if ($city !== ''): ?>
            <span class="topbar__item">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
                <?= View::e($city) ?>
            </span>
            <?php endif; ?>
            <?php if ($workHours !== ''): ?>
            <span class="topbar__item topbar__item--muted">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                <?= View::e($workHours) ?>
            </span>
            <?php endif; ?>
        </div>
        <?php endif; ?>
        <?php if ($hasTopbarRight): ?>
        <div class="topbar__group">
            <?php if ($email !== ''): ?>
            <a class="topbar__link" href="mailto:<?= View::e($email) ?>">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
                <?= View::e($email) ?>
            </a>
            <?php endif; ?>
            <?php if ($phone !== ''): ?>
            <a class="topbar__link topbar__phone" href="<?= View::e($phoneHref) ?>">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                <?= View::e($phone) ?>
            </a>
            <?php endif; ?>
        </div>
        <?php endif; ?>
    </div>
</div>
<?php endif; ?>

<header class="site-header">
    <div class="container header-main">
        <button type="button" class="header-burger" data-drawer-open aria-label="Открыть меню" aria-controls="mobile-drawer" aria-expanded="false">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="4" x2="20" y1="6" y2="6"/><line x1="4" x2="20" y1="12" y2="12"/><line x1="4" x2="20" y1="18" y2="18"/></svg>
        </button>

        <a class="brand" href="/">
            <?php if ($logoPath !== ''): ?>
            <img class="brand__logo" src="<?= View::e(View::asset($logoPath)) ?>" alt="<?= View::e($siteName) ?>" width="40" height="40">
            <?php endif; ?>
            <span class="brand__text">
                <?php if ($siteName !== ''): ?>
                <span class="brand__name"><?= View::e($siteName) ?></span>
                <?php endif; ?>
                <?php if ($siteSub !== ''): ?>
                <span class="brand__sub"><?= View::e($siteSub) ?></span>
                <?php endif; ?>
            </span>
        </a>

        <a class="btn btn--primary header-catalog-btn" href="/catalog">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect width="7" height="7" x="3" y="3" rx="1"/><rect width="7" height="7" x="14" y="3" rx="1"/><rect width="7" height="7" x="14" y="14" rx="1"/><rect width="7" height="7" x="3" y="14" rx="1"/></svg>
            Каталог
        </a>

        <div class="header-search" data-header-search>
            <form class="header-search__form" action="/stock" method="get" role="search">
                <span class="header-search__icon" aria-hidden="true">
                    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
                </span>
                <input
                    class="header-search__input"
                    type="search"
                    name="q"
                    value="<?= View::e($searchQuery) ?>"
                    placeholder="Поиск по артикулу или названию детали..."
                    autocomplete="off"
                    aria-label="Поиск запчастей"
                    data-search-input
                >
                <button type="button" class="header-search__clear" data-search-clear aria-label="Очистить поиск" hidden>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                </button>
                <button type="submit" class="header-search__submit" aria-label="Найти">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
                </button>
            </form>
            <div class="search-dropdown" data-search-dropdown hidden></div>
        </div>

        <div class="header-actions">
            <button type="button" class="theme-toggle" data-theme-toggle aria-label="Переключить тему">
                <span class="theme-toggle__moon" aria-hidden="true">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/></svg>
                </span>
                <span class="theme-toggle__sun" aria-hidden="true">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/></svg>
                </span>
            </button>

            <a class="header-action<?= $isActive('/favorites') ? ' is-active' : '' ?>" href="/favorites" aria-label="Избранное">
                <span class="header-action__icon">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>
                    <span class="header-action__badge" data-favorites-count data-count="<?= $favoritesCount ?>"><?= $favoritesCount > 0 ? $favoritesCount : '' ?></span>
                </span>
                <span class="header-action__label">Избранное</span>
            </a>

            <a class="header-action<?= $isActive('/cart') ? ' is-active' : '' ?>" href="/cart" aria-label="Корзина">
                <span class="header-action__icon">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"/></svg>
                    <span class="header-action__badge" data-cart-count data-count="<?= $cartCount ?>"><?= $cartCount > 0 ? $cartCount : '' ?></span>
                </span>
                <span class="header-action__label">Корзина</span>
            </a>

            <?php if ($admin): ?>
            <a class="header-action<?= $isActive('/cabinet/stock') ? ' is-active' : '' ?>" href="/cabinet/stock" aria-label="Управление складом">
                <span class="header-action__icon">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>
                </span>
                <span class="header-action__label">Склад</span>
            </a>
            <?php endif; ?>

            <a class="header-action<?= $isActive('/cabinet') && !$isActive('/cabinet/stock') ? ' is-active' : '' ?>" href="<?= $auth ? '/cabinet' : '/cabinet/authorization' ?>" aria-label="<?= $auth ? 'Личный кабинет' : 'Войти' ?>">
                <span class="header-action__icon">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                </span>
                <span class="header-action__label"><?= $auth ? 'Кабинет' : 'Войти' ?></span>
            </a>
        </div>
    </div>

    <nav class="header-nav" aria-label="Основная навигация">
        <div class="container">
            <ul class="header-nav__list">
                <?php foreach ($navItems as $item): ?>
                <li>
                    <a
                        class="header-nav__link<?= $item['stock'] ? ' header-nav__link--stock' : '' ?><?= $isActive($item['href']) ? ' is-active' : '' ?>"
                        href="<?= View::e($item['href']) ?>"
                    ><?= View::e($item['label']) ?></a>
                </li>
                <?php endforeach; ?>
            </ul>
        </div>
    </nav>
</header>

<div class="mobile-drawer" id="mobile-drawer" data-drawer aria-hidden="true">
    <div class="mobile-drawer__backdrop" data-drawer-close></div>
    <aside class="mobile-drawer__panel" role="dialog" aria-modal="true" aria-label="Меню навигации">
        <div class="mobile-drawer__head">
            <a class="brand" href="/">
                <?php if ($logoPath !== ''): ?>
                <img class="brand__logo" src="<?= View::e(View::asset($logoPath)) ?>" alt="<?= View::e($siteName) ?>" width="34" height="34">
                <?php endif; ?>
                <?php if ($siteName !== ''): ?>
                <span class="brand__text">
                    <span class="brand__name"><?= View::e($siteName) ?></span>
                </span>
                <?php endif; ?>
            </a>
            <button type="button" class="icon-btn" data-drawer-close aria-label="Закрыть меню">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
            </button>
        </div>

        <div class="mobile-drawer__body">
            <nav class="mobile-drawer__nav" aria-label="Мобильное меню">
                <a class="mobile-drawer__link<?= $isActive('/') ? ' is-active' : '' ?>" href="/">Главная</a>
                <?php foreach ($navItems as $item): ?>
                <a class="mobile-drawer__link<?= $isActive($item['href']) ? ' is-active' : '' ?>" href="<?= View::e($item['href']) ?>"><?= View::e($item['label']) ?></a>
                <?php endforeach; ?>
            </nav>

            <div class="mobile-drawer__section">
                <div class="mobile-drawer__label">Покупателю</div>
                <nav class="mobile-drawer__nav">
                    <a class="mobile-drawer__link<?= $isActive('/favorites') ? ' is-active' : '' ?>" href="/favorites">Избранное</a>
                    <a class="mobile-drawer__link<?= $isActive('/cart') ? ' is-active' : '' ?>" href="/cart">Корзина</a>
                    <a class="mobile-drawer__link<?= $isActive('/cabinet') && !$isActive('/cabinet/stock') ? ' is-active' : '' ?>" href="<?= $auth ? '/cabinet' : '/cabinet/authorization' ?>"><?= $auth ? 'Личный кабинет' : 'Войти / Регистрация' ?></a>
                    <?php if ($admin): ?>
                    <a class="mobile-drawer__link<?= $isActive('/cabinet/stock') ? ' is-active' : '' ?>" href="/cabinet/stock">Управление складом</a>
                    <?php endif; ?>
                </nav>
            </div>
        </div>

        <?php if ($hasDrawerFooter): ?>
        <div class="mobile-drawer__footer">
            <?php if ($phone !== ''): ?>
            <a class="mobile-drawer__phone" href="<?= View::e($phoneHref) ?>"><?= View::e($phone) ?></a>
            <?php endif; ?>
            <?php if ($email !== ''): ?>
            <a href="mailto:<?= View::e($email) ?>"><?= View::e($email) ?></a>
            <?php endif; ?>
            <?php if ($workHours !== ''): ?>
            <span><?= View::e($workHours) ?></span>
            <?php endif; ?>
        </div>
        <?php endif; ?>
    </aside>
</div>