<?php
declare(strict_types=1);

define('APP_ROOT', __DIR__);
define('ENV_PATH', dirname(APP_ROOT) . '/env.php');

ini_set('display_errors', '0');
ini_set('display_startup_errors', '0');
ini_set('log_errors', '1');
error_reporting(E_ALL);
date_default_timezone_set('Europe/Moscow');

$logDir = APP_ROOT . '/storage/logs';
if (!is_dir($logDir)) {
    @mkdir($logDir, 0755, true);
}
if (is_dir($logDir) && is_writable($logDir)) {
    ini_set('error_log', $logDir . '/php.log');
}

require_once APP_ROOT . '/app/Core/Autoloader.php';

App\Core\Autoloader::register(APP_ROOT . '/app');

$app = new App\Core\App();
$app->run();