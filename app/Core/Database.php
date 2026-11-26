<?php
declare(strict_types=1);

namespace App\Core;

use PDO;
use PDOStatement;
use RuntimeException;
use Throwable;

final class Database
{
    private static ?PDO $pdo = null;

    public static function pdo(): PDO
    {
        if (self::$pdo instanceof PDO) {
            return self::$pdo;
        }

        $host = (string)Config::env('DB_HOST', 'localhost');
        $port = (string)Config::env('DB_PORT', '3306');
        $name = (string)(Config::env('DB_NAME') ?? Config::env('DB_DATABASE', ''));
        $user = (string)(Config::env('DB_USER') ?? Config::env('DB_USERNAME', ''));
        $pass = (string)(Config::env('DB_PASS') ?? Config::env('DB_PASSWORD', ''));
        $charset = (string)Config::env('DB_CHARSET', 'utf8mb4');

        if ($name === '' || $user === '') {
            throw new RuntimeException('Database configuration is incomplete.');
        }

        $dsn = sprintf('mysql:host=%s;port=%s;dbname=%s;charset=%s', $host, $port, $name, $charset);

        self::$pdo = new PDO($dsn, $user, $pass, [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false,
            PDO::ATTR_STRINGIFY_FETCHES => false,
        ]);

        return self::$pdo;
    }

    public static function query(string $sql, array $params = []): PDOStatement
    {
        $stmt = self::pdo()->prepare($sql);
        $stmt->execute($params);
        return $stmt;
    }

    public static function fetchOne(string $sql, array $params = []): ?array
    {
        $row = self::query($sql, $params)->fetch();
        return $row === false ? null : $row;
    }

    public static function fetchAll(string $sql, array $params = []): array
    {
        return self::query($sql, $params)->fetchAll();
    }

    public static function fetchColumn(string $sql, array $params = []): mixed
    {
        return self::query($sql, $params)->fetchColumn();
    }

    public static function execute(string $sql, array $params = []): int
    {
        return self::query($sql, $params)->rowCount();
    }

    public static function lastInsertId(): string
    {
        return self::pdo()->lastInsertId();
    }

    public static function transaction(callable $callback): mixed
    {
        $pdo = self::pdo();
        $isRoot = !$pdo->inTransaction();

        if ($isRoot) {
            $pdo->beginTransaction();
        }

        try {
            $result = $callback($pdo);
            if ($isRoot) {
                $pdo->commit();
            }
            return $result;
        } catch (Throwable $e) {
            if ($isRoot && $pdo->inTransaction()) {
                $pdo->rollBack();
            }
            throw $e;
        }
    }

    public static function escapeLike(string $value): string
    {
        return str_replace(['\\', '%', '_'], ['\\\\', '\\%', '\\_'], $value);
    }

    public static function placeholders(int $count): string
    {
        if ($count <= 0) {
            return '';
        }
        return implode(',', array_fill(0, $count, '?'));
    }

    public static function disconnect(): void
    {
        self::$pdo = null;
    }
}