<?php
declare(strict_types=1);

use App\Controllers\AdminImportController;
use App\Controllers\AdminStockController;
use App\Controllers\Api\CartApiController;
use App\Controllers\Api\ContactApiController;
use App\Controllers\Api\SearchApiController;
use App\Controllers\AuthController;
use App\Controllers\CabinetController;
use App\Controllers\CartController;
use App\Controllers\CatalogController;
use App\Controllers\PageController;
use App\Controllers\SeoController;
use App\Controllers\StockController;

return [
    ['GET', '/', [PageController::class, 'home'], []],
    ['GET', '/about', [PageController::class, 'about'], []],
    ['GET', '/contacts', [PageController::class, 'contacts'], []],
    ['GET', '/delivery', [PageController::class, 'delivery'], []],
    ['GET', '/service', [PageController::class, 'service'], []],
    ['GET', '/privacy', [PageController::class, 'privacy'], []],
    ['GET', '/terms', [PageController::class, 'terms'], []],

    ['GET', '/catalog', [CatalogController::class, 'index'], []],
    ['GET', '/catalog/{slug}', [CatalogController::class, 'category'], []],
    ['GET', '/model/{slug}', [CatalogController::class, 'model'], []],
    ['GET', '/scheme/{slug}', [CatalogController::class, 'scheme'], []],
    ['GET', '/part/{partNumber}', [CatalogController::class, 'part'], []],

    ['GET', '/stock', [StockController::class, 'index'], []],
    ['GET', '/api/stock_export', [StockController::class, 'export'], ['rate:stock_export']],
    ['GET', '/api/stock_export.php', [StockController::class, 'export'], ['rate:stock_export']],

    ['GET', '/cart', [CartController::class, 'cart'], []],
    ['GET', '/favorites', [CartController::class, 'favorites'], []],
    ['GET', '/checkout', [CartController::class, 'checkout'], []],
    ['POST', '/api/submit_order', [CartController::class, 'submitOrder'], ['csrf', 'rate:order']],

    ['GET', '/api/search', [SearchApiController::class, 'search'], ['rate:search']],
    ['GET', '/api/state', [CartApiController::class, 'state'], ['rate:api_default']],
    ['GET', '/api/get_state.php', [CartApiController::class, 'state'], ['rate:api_default']],
    ['POST', '/api/cart_fav', [CartApiController::class, 'handle'], ['csrf', 'rate:cart_fav']],
    ['POST', '/api/contact', [ContactApiController::class, 'send'], ['csrf', 'rate:contact']],
    ['POST', '/api/send-contact.php', [ContactApiController::class, 'send'], ['csrf', 'rate:contact']],

    ['GET', '/cabinet', [CabinetController::class, 'index'], ['auth']],
    ['GET', '/cabinet/profile', [CabinetController::class, 'profile'], ['auth']],
    ['POST', '/cabinet/profile', [CabinetController::class, 'updateProfile'], ['auth', 'csrf']],
    ['GET', '/cabinet/orders', [CabinetController::class, 'orders'], ['auth']],
    ['POST', '/cabinet/logout', [AuthController::class, 'logout'], ['auth', 'csrf']],

    ['GET', '/cabinet/authorization', [AuthController::class, 'showAuth'], []],
    ['POST', '/cabinet/authorization', [AuthController::class, 'handleAuth'], ['csrf']],
    ['POST', '/cabinet/authorization/index.php', [AuthController::class, 'handleAuth'], ['csrf']],
    ['GET', '/cabinet/authorization/verify', [AuthController::class, 'verify'], []],
    ['GET', '/cabinet/authorization/verify.php', [AuthController::class, 'verify'], []],
    ['GET', '/cabinet/authorization/reset', [AuthController::class, 'showReset'], []],
    ['GET', '/cabinet/authorization/reset.php', [AuthController::class, 'showReset'], []],
    ['POST', '/cabinet/authorization/reset', [AuthController::class, 'handleReset'], ['csrf', 'rate:forgot']],
    ['POST', '/cabinet/authorization/reset.php', [AuthController::class, 'handleReset'], ['csrf', 'rate:forgot']],

    ['GET', '/cabinet/stock', [AdminStockController::class, 'index'], ['auth', 'admin']],
    ['POST', '/cabinet/stock', [AdminStockController::class, 'handleAction'], ['auth', 'admin', 'csrf']],

    ['GET', '/cabinet/import', [AdminImportController::class, 'show'], ['auth', 'admin']],
    ['POST', '/cabinet/import', [AdminImportController::class, 'import'], ['auth', 'admin', 'csrf']],

    ['GET', '/sitemap.xml', [SeoController::class, 'sitemap'], []],
    ['GET', '/image-sitemap.xml', [SeoController::class, 'imageSitemap'], []],
    ['GET', '/api/indexnow_push', [SeoController::class, 'indexNowPush'], []],
    ['POST', '/api/indexnow_push', [SeoController::class, 'indexNowPush'], []],
];