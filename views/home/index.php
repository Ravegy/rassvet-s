<?php
declare(strict_types=1);

use App\Core\View;

$categories = isset($categories) && is_array($categories) ? $categories : [];
$topModels = isset($topModels) && is_array($topModels) ? $topModels : [];
$stockItems = isset($stockItems) && is_array($stockItems) ? $stockItems : [];
$stats = isset($stats) && is_array($stats) ? $stats : [];

$config = isset($appConfig) && is_array($appConfig) ? $appConfig : [];
$contacts = isset($config['contacts']) && is_array($config['contacts']) ? $config['contacts'] : [];
$phone = trim((string)($contacts['phone'] ?? ''));
$phoneHref = $phone !== '' ? 'tel:' . preg_replace('/[^+\d]/', '', $phone) : '';

$formatCount = static function (int $value): string {
    return $value > 0 ? number_format($value, 0, ',', ' ') : '—';
};
?>
<section class="home-hero">
    <div class="container">
        <div class="home-hero__grid">
            <div>
                <div class="home-hero__eyebrow">Komatsu Forest · Склад и каталог схем</div>
                <h1 class="home-hero__title">Запчасти для лесозаготовительной техники с подбором по схемам</h1>
                <p class="home-hero__lead">Оригинальные комплектующие и проверенные аналоги для харвестеров, форвардеров и харвестерных головок. Актуальные остатки на складе и быстрая отгрузка по всей России.</p>

                <form class="home-hero__search" action="/stock" method="get" role="search">
                    <input
                        class="home-hero__input"
                        type="search"
                        name="q"
                        placeholder="Введите артикул (например, 5227591) или название..."
                        aria-label="Поиск запчасти по артикулу или названию"
                    >
                    <button type="submit" class="btn btn--primary btn--lg">Найти на складе</button>
                </form>

                <div class="home-hero__actions">
                    <a class="btn btn--secondary home-hero__btn-ghost" href="/stock">Смотреть все в наличии</a>
                    <a class="btn btn--secondary home-hero__btn-ghost" href="/catalog">Открыть каталог схем</a>
                </div>
            </div>

            <div class="home-stats">
                <div class="home-stat">
                    <div class="home-stat__value home-stat__value--accent"><?= View::e($formatCount((int)($stats['in_stock'] ?? 0))) ?></div>
                    <div class="home-stat__label">позиций доступно на складе прямо сейчас</div>
                </div>
                <div class="home-stat">
                    <div class="home-stat__value"><?= View::e($formatCount((int)($stats['models'] ?? 0))) ?></div>
                    <div class="home-stat__label">моделей техники в электронном каталоге</div>
                </div>
                <div class="home-stat">
                    <div class="home-stat__value"><?= View::e($formatCount((int)($stats['schemes'] ?? 0))) ?></div>
                    <div class="home-stat__label">интерактивных узловых схем с позициями</div>
                </div>
                <div class="home-stat">
                    <div class="home-stat__value">НДС</div>
                    <div class="home-stat__label">работа с юрлицами и отгрузка транспортными компаниями</div>
                </div>
            </div>
        </div>
    </div>
</section>

<?php if ($categories !== []): ?>
<section class="page-section">
    <div class="container">
        <div class="section-head">
            <div>
                <h2 class="section-title">Каталог техники</h2>
                <p class="section-subtitle">Выберите тип машины для перехода к моделям и узловым схемам</p>
            </div>
            <a class="btn btn--secondary btn--sm" href="/catalog">Весь каталог</a>
        </div>

        <div class="grid grid-3">
            <?php foreach ($categories as $cat): ?>
            <?php
            $catSlug = trim((string)($cat['slug'] ?? ''));
            $catHref = $catSlug !== '' ? '/catalog/' . rawurlencode($catSlug) : '/catalog';
            $catImage = trim((string)($cat['image'] ?? ''));
            $modelsCount = (int)($cat['models_count'] ?? 0);
            ?>
            <a class="cat-card" href="<?= View::e($catHref) ?>">
                <div class="cat-card__media">
                    <?php if ($catImage !== ''): ?>
                    <img class="cat-card__img" src="<?= View::e($catImage) ?>" alt="<?= View::e($cat['name'] ?? '') ?>" loading="lazy">
                    <?php else: ?>
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" class="stock-card__placeholder" aria-hidden="true"><rect width="7" height="7" x="3" y="3" rx="1"/><rect width="7" height="7" x="14" y="3" rx="1"/><rect width="7" height="7" x="14" y="14" rx="1"/><rect width="7" height="7" x="3" y="14" rx="1"/></svg>
                    <?php endif; ?>
                </div>
                <div class="cat-card__body">
                    <div class="cat-card__title"><?= View::e($cat['name'] ?? '') ?></div>
                    <div class="cat-card__meta">
                        <?= $modelsCount > 0 ? 'Моделей: ' . $modelsCount : 'Перейти в раздел' ?>
                    </div>
                </div>
                <svg class="cat-card__arrow" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m9 18 6-6-6-6"/></svg>
            </a>
            <?php endforeach; ?>
        </div>
    </div>
</section>
<?php endif; ?>

<?php if ($stockItems !== []): ?>
<section class="page-section page-section--compact">
    <div class="container">
        <div class="section-head">
            <div>
                <h2 class="section-title">В наличии на складе</h2>
                <p class="section-subtitle">Актуальные остатки готовые к отгрузке</p>
            </div>
            <a class="btn btn--primary btn--sm" href="/stock">Весь склад</a>
        </div>

        <div class="grid grid-4">
            <?php foreach ($stockItems as $item): ?>
            <?php
            $pn = (string)($item['part_number'] ?? '');
            $partUrl = '/part/' . rawurlencode($pn);
            $img = $item['image'] ?? null;
            $qty = (int)($item['stock_qty'] ?? 0);
            $mfg = (string)($item['manufacturer'] ?? '');
            $partTypes = isset($item['part_types']) && is_array($item['part_types']) ? $item['part_types'] : [];
            $cities = isset($item['cities']) && is_array($item['cities']) ? array_keys($item['cities']) : [];
            ?>
            <article class="stock-card">
                <div class="stock-card__media">
                    <a href="<?= View::e($partUrl) ?>" aria-label="<?= View::e($item['name'] ?? $pn) ?>">
                        <?php if (is_string($img) && $img !== ''): ?>
                        <img class="stock-card__img" src="<?= View::e($img) ?>" alt="<?= View::e(($item['name'] ?? '') . ' ' . $pn) ?>" loading="lazy">
                        <?php else: ?>
                        <svg width="42" height="42" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="stock-card__placeholder" aria-hidden="true"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>
                        <?php endif; ?>
                    </a>
                    <button type="button" class="icon-btn stock-card__fav" data-toggle-fav="<?= View::e($pn) ?>" aria-label="В избранное" aria-pressed="false">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>
                    </button>
                </div>

                <div class="stock-card__body">
                    <div class="stock-card__head">
                        <span class="stock-card__code-wrap">
                            <span class="part-code"><?= View::e($pn) ?></span>
                            <button type="button" class="stock-card__copy" data-copy="<?= View::e($pn) ?>" aria-label="Скопировать артикул">
                                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>
                            </button>
                        </span>
                        <span class="badge badge--success">
                            <span class="badge__dot"></span>
                            <?= $qty > 0 ? $qty . ' шт.' : 'В наличии' ?>
                        </span>
                    </div>

                    <a class="stock-card__title" href="<?= View::e($partUrl) ?>"><?= View::e($item['name'] ?? '') ?></a>

                    <div class="stock-card__meta">
                        <div class="stock-card__loc">
                            <span><?= $mfg !== '' ? View::e($mfg) : 'Komatsu Forest' ?></span>
                            <?php if ($partTypes !== []): ?>
                            <span><?= View::e(implode(' / ', $partTypes)) ?></span>
                            <?php endif; ?>
                        </div>
                        <?php if ($cities !== []): ?>
                        <div>Склад: <?= View::e(implode(', ', $cities)) ?></div>
                        <?php endif; ?>
                    </div>
                </div>

                <div class="stock-card__footer">
                    <button
                        type="button"
                        class="btn btn--primary btn--sm btn--block"
                        data-add-cart="<?= View::e($pn) ?>"
                        data-label-default="В корзину"
                        data-label-added="В корзине"
                    >В корзину</button>
                    <a class="btn btn--secondary btn--sm" href="<?= View::e($partUrl) ?>">Подробнее</a>
                </div>
            </article>
            <?php endforeach; ?>
        </div>
    </div>
</section>
<?php endif; ?>

<?php if ($topModels !== []): ?>
<section class="page-section page-section--compact">
    <div class="container">
        <div class="section-head">
            <div>
                <h2 class="section-title">Популярные модели техники</h2>
                <p class="section-subtitle">Быстрый переход к каталогу узлов и деталировок</p>
            </div>
            <a class="btn btn--secondary btn--sm" href="/catalog">Все модели</a>
        </div>

        <div class="grid grid-4">
            <?php foreach ($topModels as $model): ?>
            <?php
            $modelUrl = '/model/' . rawurlencode((string)$model['id']);
            $modelImage = trim((string)($model['image'] ?? ''));
            $series = trim((string)($model['series'] ?? ''));
            $serial = trim((string)($model['serial_number'] ?? ''));
            ?>
            <a class="model-card" href="<?= View::e($modelUrl) ?>">
                <div class="model-card__media">
                    <?php if ($modelImage !== ''): ?>
                    <img class="model-card__img" src="<?= View::e($modelImage) ?>" alt="<?= View::e($model['name'] ?? '') ?>" loading="lazy">
                    <?php else: ?>
                    <svg width="42" height="42" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="stock-card__placeholder" aria-hidden="true"><rect width="18" height="12" x="3" y="6" rx="2"/><path d="M7 18h10"/></svg>
                    <?php endif; ?>
                </div>
                <div class="model-card__body">
                    <div class="model-card__top">
                        <span class="model-card__cat"><?= View::e($model['category_name'] ?? '') ?></span>
                        <?php if ($series !== ''): ?>
                        <span class="badge badge--neutral"><?= View::e($series) ?></span>
                        <?php endif; ?>
                    </div>
                    <div class="model-card__title"><?= View::e($model['name'] ?? '') ?></div>
                    <?php if ($serial !== ''): ?>
                    <div class="model-card__serial">S/N: <?= View::e($serial) ?></div>
                    <?php endif; ?>
                </div>
            </a>
            <?php endforeach; ?>
        </div>
    </div>
</section>
<?php endif; ?>

<section class="page-section page-section--compact">
    <div class="container">
        <div class="grid grid-4">
            <div class="feature-card">
                <div class="feature-card__icon" aria-hidden="true">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/></svg>
                </div>
                <div class="feature-card__title">Собственный склад</div>
                <p class="feature-card__text">Ходовые фильтры, уплотнения, гидравлика и ремкомплекты в наличии — без ожидания поставок.</p>
            </div>

            <div class="feature-card">
                <div class="feature-card__icon" aria-hidden="true">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/><path d="M11 8v6"/><path d="M8 11h6"/></svg>
                </div>
                <div class="feature-card__title">Точный подбор по схемам</div>
                <p class="feature-card__text">Интерактивные деталировки по узлам и серийным номерам исключают ошибки при заказе.</p>
            </div>

            <div class="feature-card">
                <div class="feature-card__icon" aria-hidden="true">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2"/><path d="M15 18H9"/><path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.624l-3.48-4.35A1 1 0 0 0 17.52 8H14"/><circle cx="17" cy="18" r="2"/><circle cx="7" cy="18" r="2"/></svg>
                </div>
                <div class="feature-card__title">Доставка по России</div>
                <p class="feature-card__text">Оперативная передача в транспортные компании для быстрой доставки в регионы лесозаготовки.</p>
            </div>

            <div class="feature-card">
                <div class="feature-card__icon" aria-hidden="true">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" x2="8" y1="13" y2="13"/><line x1="16" x2="8" y1="17" y2="17"/></svg>
                </div>
                <div class="feature-card__title">Документы и гарантия</div>
                <p class="feature-card__text">Безналичный расчёт с НДС, полный пакет закрывающих документов и помощь в подборе аналогов.</p>
            </div>
        </div>
    </div>
</section>

<section class="page-section page-section--compact">
    <div class="container">
        <div class="home-cta">
            <div class="home-cta__content">
                <h2 class="home-cta__title">Нужна помощь с подбором детали?</h2>
                <p class="home-cta__text">Назовите серийный номер машины или отправьте список артикулов — проверим наличие на складе и подготовим предложение.</p>
            </div>
            <div class="home-cta__actions">
                <?php if ($phone !== ''): ?>
                <a class="btn btn--primary btn--lg" href="<?= View::e($phoneHref) ?>"><?= View::e($phone) ?></a>
                <?php endif; ?>
                <a class="btn btn--secondary btn--lg" href="/contacts">Связаться с нами</a>
            </div>
        </div>
    </div>
</section>