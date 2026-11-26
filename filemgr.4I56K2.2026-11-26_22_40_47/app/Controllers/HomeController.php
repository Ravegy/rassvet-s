<?php
declare(strict_types=1);

namespace App\Controllers;

use App\Core\Config;
use App\Core\Controller;
use App\Core\Logger;
use App\Core\Request;
use App\Core\Response;
use App\Core\View;
use App\Repositories\CatalogRepository;
use App\Repositories\StockRepository;
use Throwable;

final class HomeController extends Controller
{
    public function index(Request $request): Response
    {
        $categories = [];
        $topModels = [];
        $stockItems = [];
        $stats = [
            'categories' => 0,
            'models' => 0,
            'schemes' => 0,
            'in_stock' => 0,
        ];

        try {
            $catalogRepo = new CatalogRepository();
            $stockRepo = new StockRepository();

            $categories = $catalogRepo->getCategories();
            $topModels = $catalogRepo->getTopModels(8);
            $stats = $catalogRepo->getCatalogStats();

            $stockPage = $stockRepo->paginatePublic(['in_stock_only' => true], 1, 8);
            $stockItems = $stockPage['items'];
        } catch (Throwable $e) {
            Logger::exception($e, ['controller' => self::class, 'action' => 'index']);
        }

        $siteName = trim((string)Config::get('app.name', 'Рассвет-С'));
        $baseUrl = View::url('/');
        $contacts = Config::get('app.contacts', []);
        $phone = is_array($contacts) ? trim((string)($contacts['phone'] ?? '')) : '';
        $email = is_array($contacts) ? trim((string)($contacts['email'] ?? '')) : '';
        $logoUrl = View::url((string)Config::get('app.assets.logo', '/images/logo.webp'));

        $orgSchema = [
            '@context' => 'https://schema.org',
            '@type' => 'Organization',
            'name' => $siteName,
            'url' => $baseUrl,
            'logo' => $logoUrl,
        ];
        if ($phone !== '') {
            $orgSchema['telephone'] = $phone;
        }
        if ($email !== '') {
            $orgSchema['email'] = $email;
        }

        $webSiteSchema = [
            '@context' => 'https://schema.org',
            '@type' => 'WebSite',
            'name' => $siteName,
            'url' => $baseUrl,
            'potentialAction' => [
                '@type' => 'SearchAction',
                'target' => View::url('/stock') . '?q={search_term_string}',
                'query-input' => 'required name=search_term_string',
            ],
        ];

        $seo = $this->seo(
            'Запчасти для лесной техники Komatsu Forest',
            'Оригинальные запчасти и проверенные аналоги для харвестеров, форвардеров и харвестерных головок Komatsu Forest. Склад в наличии, интерактивные каталоги схем, доставка по РФ.',
            [
                'canonical' => $baseUrl,
                'jsonLd' => [$orgSchema, $webSiteSchema],
            ]
        );

        return $this->view('home/index', array_merge($seo, [
            'extraStyles' => ['/assets/css/pages/home.css'],
            'categories' => $categories,
            'topModels' => $topModels,
            'stockItems' => $stockItems,
            'stats' => $stats,
        ]));
    }
}