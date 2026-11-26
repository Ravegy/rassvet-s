<?php
declare(strict_types=1);

use App\Core\View;

$config = isset($appConfig) && is_array($appConfig) ? $appConfig : [];
$contacts = isset($config['contacts']) && is_array($config['contacts']) ? $config['contacts'] : [];
$company = isset($config['company']) && is_array($config['company']) ? $config['company'] : [];

$siteName = trim((string)($appName ?? $config['name'] ?? ''));
$description = trim((string)($config['description'] ?? $config['tagline'] ?? ''));
$logoPath = trim((string)($config['assets']['logo'] ?? '/images/logo.webp'));

$phone = trim((string)($contacts['phone'] ?? ''));
$phoneHref = $phone !== '' ? 'tel:' . preg_replace('/[^+\d]/', '', $phone) : '';
$email = trim((string)($contacts['email'] ?? ''));
$address = trim((string)($contacts['address'] ?? ''));
$workHours = trim((string)($contacts['work_hours'] ?? ''));

$legalName = trim((string)($company['legal_name'] ?? $siteName));
$inn = trim((string)($company['inn'] ?? ''));
$ogrn = trim((string)($company['ogrn'] ?? ''));

$auth = (bool)($isAuth ?? false);
$currentYear = date('Y');
?>
<footer class="site-footer">
    <div class="footer-main">
        <div class="container">
            <div class="footer-grid">
                <div class="footer-brand">
                    <a class="footer-brand__head" href="/">
                        <?php if ($logoPath !== ''): ?>
                        <img class="brand__logo" src="<?= View::e(View::asset($logoPath)) ?>" alt="<?= View::e($siteName) ?>" width="38" height="38" loading="lazy">
                        <?php endif; ?>
                        <?php if ($siteName !== ''): ?>
                        <span class="footer-brand__name"><?= View::e($siteName) ?></span>
                        <?php endif; ?>
                    </a>
                    <?php if ($description !== ''): ?>
                    <p class="footer-brand__desc"><?= View::e($description) ?></p>
                    <?php endif; ?>
                    <?php if ($inn !== '' || $ogrn !== ''): ?>
                    <div class="footer-contacts__label">
                        <?php if ($inn !== ''): ?>ИНН <?= View::e($inn) ?><?php endif; ?>
                        <?php if ($inn !== '' && $ogrn !== ''): ?> · <?php endif; ?>
                        <?php if ($ogrn !== ''): ?>ОГРН <?= View::e($ogrn) ?><?php endif; ?>
                    </div>
                    <?php endif; ?>
                </div>

                <div class="footer-col">
                    <div class="footer-col__title">Покупателям</div>
                    <ul class="footer-links">
                        <li><a class="footer-links__item" href="/stock">В наличии на складе</a></li>
                        <li><a class="footer-links__item" href="/catalog">Каталог схем</a></li>
                        <li><a class="footer-links__item" href="/cart">Корзина</a></li>
                        <li><a class="footer-links__item" href="/favorites">Избранное</a></li>
                        <li><a class="footer-links__item" href="<?= $auth ? '/cabinet' : '/cabinet/authorization' ?>"><?= $auth ? 'Личный кабинет' : 'Вход и регистрация' ?></a></li>
                    </ul>
                </div>

                <div class="footer-col">
                    <div class="footer-col__title">Компания</div>
                    <ul class="footer-links">
                        <li><a class="footer-links__item" href="/about">О компании</a></li>
                        <li><a class="footer-links__item" href="/delivery">Доставка и оплата</a></li>
                        <li><a class="footer-links__item" href="/service">Сервис и подбор</a></li>
                        <li><a class="footer-links__item" href="/contacts">Контакты</a></li>
                    </ul>
                </div>

                <div class="footer-col">
                    <div class="footer-col__title">Контакты</div>
                    <div class="footer-contacts">
                        <?php if ($phone !== ''): ?>
                        <a class="footer-contacts__phone" href="<?= View::e($phoneHref) ?>"><?= View::e($phone) ?></a>
                        <?php endif; ?>
                        <?php if ($email !== ''): ?>
                        <div class="footer-contacts__row">
                            <span class="footer-contacts__label">Электронная почта</span>
                            <a class="footer-contacts__value" href="mailto:<?= View::e($email) ?>"><?= View::e($email) ?></a>
                        </div>
                        <?php endif; ?>
                        <?php if ($address !== ''): ?>
                        <div class="footer-contacts__row">
                            <span class="footer-contacts__label">Адрес</span>
                            <span class="footer-contacts__value"><?= View::e($address) ?></span>
                        </div>
                        <?php endif; ?>
                        <?php if ($workHours !== ''): ?>
                        <div class="footer-contacts__row">
                            <span class="footer-contacts__label">Режим работы</span>
                            <span class="footer-contacts__value"><?= View::e($workHours) ?></span>
                        </div>
                        <?php endif; ?>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <div class="footer-bottom">
        <div class="container footer-bottom__inner">
            <div>&copy; <?= View::e($currentYear) ?><?= $legalName !== '' ? ' ' . View::e($legalName) : '' ?>. Все права защищены.</div>
            <div class="footer-legal">
                <a class="footer-legal__link" href="/privacy">Политика конфиденциальности</a>
                <a class="footer-legal__link" href="/terms">Пользовательское соглашение</a>
            </div>
        </div>
    </div>
</footer>