<?php
declare(strict_types=1);

use App\Core\View;

$title = (string)($pageTitle ?? $appName ?? 'Рассвет-С');
$description = (string)($metaDescription ?? '');
$robotsMeta = (string)($robots ?? 'index, follow');
$canonicalUrl = (string)($canonical ?? '');
$ogTitleVal = (string)($ogTitle ?? $title);
$ogDescVal = (string)($ogDescription ?? $description);
$ogImageVal = (string)($ogImage ?? '');
$ogTypeVal = (string)($ogType ?? 'website');
$nonce = (string)($cspNonce ?? '');
$csrf = (string)($csrfToken ?? '');
$bodyClasses = trim((string)($bodyClass ?? ''));
$styles = isset($extraStyles) && is_array($extraStyles) ? $extraStyles : [];
$scripts = isset($extraScripts) && is_array($extraScripts) ? $extraScripts : [];
$ldItems = isset($jsonLd) && is_array($jsonLd) ? $jsonLd : [];
if ($ldItems !== [] && !array_is_list($ldItems)) {
    $ldItems = [$ldItems];
}
?><!DOCTYPE html>
<html lang="ru">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title><?= View::e($title) ?></title>
    <?php if ($description !== ''): ?>
    <meta name="description" content="<?= View::e($description) ?>">
    <?php endif; ?>
    <meta name="robots" content="<?= View::e($robotsMeta) ?>">
    <?php if ($canonicalUrl !== ''): ?>
    <link rel="canonical" href="<?= View::e($canonicalUrl) ?>">
    <?php endif; ?>
    <meta name="csrf-token" content="<?= View::e($csrf) ?>">
    <meta name="theme-color" content="#181c23">
    <meta property="og:site_name" content="<?= View::e($appName ?? 'Рассвет-С') ?>">
    <meta property="og:type" content="<?= View::e($ogTypeVal) ?>">
    <meta property="og:title" content="<?= View::e($ogTitleVal) ?>">
    <?php if ($ogDescVal !== ''): ?>
    <meta property="og:description" content="<?= View::e($ogDescVal) ?>">
    <?php endif; ?>
    <?php if ($ogImageVal !== ''): ?>
    <meta property="og:image" content="<?= View::e($ogImageVal) ?>">
    <?php endif; ?>
    <?php if ($canonicalUrl !== ''): ?>
    <meta property="og:url" content="<?= View::e($canonicalUrl) ?>">
    <?php endif; ?>
    <link rel="icon" href="<?= View::e(View::asset('/images/favicon.ico')) ?>" sizes="any">
    <link rel="icon" type="image/webp" href="<?= View::e(View::asset('/images/logo.webp')) ?>">
    <link rel="stylesheet" href="<?= View::e(View::asset('/assets/css/tokens.css')) ?>">
    <link rel="stylesheet" href="<?= View::e(View::asset('/assets/css/base.css')) ?>">
    <link rel="stylesheet" href="<?= View::e(View::asset('/assets/css/components.css')) ?>">
    <link rel="stylesheet" href="<?= View::e(View::asset('/assets/css/layout.css')) ?>">
    <?php foreach ($styles as $style): ?>
    <link rel="stylesheet" href="<?= View::e(View::asset((string)$style)) ?>">
    <?php endforeach; ?>
    <script nonce="<?= View::e($nonce) ?>">
        (function () {
            try {
                var saved = localStorage.getItem('theme');
                if (saved === 'dark' || (!saved && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
                    document.documentElement.setAttribute('data-theme', 'dark');
                }
            } catch (e) {}
        })();
    </script>
    <?php foreach ($ldItems as $ld): ?>
    <script type="application/ld+json" nonce="<?= View::e($nonce) ?>"><?= View::json($ld) ?></script>
    <?php endforeach; ?>
</head>
<body<?= $bodyClasses !== '' ? ' class="' . View::e($bodyClasses) . '"' : '' ?>>
    <a class="skip-link" href="#main-content">Перейти к содержимому</a>

    <?= View::partial('partials/header', get_defined_vars()) ?>

    <main id="main-content" tabindex="-1">
        <?= $content ?? '' ?>
    </main>

    <?= View::partial('partials/footer', get_defined_vars()) ?>

    <div class="toast-container" id="toast-container" aria-live="polite" aria-atomic="true"></div>

    <script src="<?= View::e(View::asset('/assets/js/app.js')) ?>" defer></script>
    <?php foreach ($scripts as $script): ?>
    <script src="<?= View::e(View::asset((string)$script)) ?>" defer></script>
    <?php endforeach; ?>
</body>
</html>