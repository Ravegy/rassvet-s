<?php
declare(strict_types=1);

namespace App\Repositories;

use App\Core\Database;
use PDO;

final class CatalogRepository
{
    public function getCategories(?int $parentId = null): array
    {
        if ($parentId === null) {
            $stmt = $this->pdo()->query(
                'SELECT c.id, c.parent_id, c.name, c.slug, c.image, c.seo_title, c.seo_description,
                        (SELECT COUNT(*) FROM models m WHERE m.category_id = c.id AND m.is_visible = 1) AS models_count,
                        (SELECT COUNT(*) FROM categories ch WHERE ch.parent_id = c.id) AS children_count
                 FROM categories c
                 WHERE c.parent_id IS NULL
                 ORDER BY c.id ASC'
            );
            return $stmt ? $stmt->fetchAll(PDO::FETCH_ASSOC) : [];
        }

        $stmt = $this->pdo()->prepare(
            'SELECT c.id, c.parent_id, c.name, c.slug, c.image, c.seo_title, c.seo_description,
                    (SELECT COUNT(*) FROM models m WHERE m.category_id = c.id AND m.is_visible = 1) AS models_count,
                    (SELECT COUNT(*) FROM categories ch WHERE ch.parent_id = c.id) AS children_count
             FROM categories c
             WHERE c.parent_id = :parent_id
             ORDER BY c.id ASC'
        );
        $stmt->execute([':parent_id' => $parentId]);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function getAllCategories(): array
    {
        $stmt = $this->pdo()->query(
            'SELECT id, parent_id, name, slug, image, seo_title, seo_description
             FROM categories
             ORDER BY parent_id IS NOT NULL, parent_id ASC, id ASC'
        );
        return $stmt ? $stmt->fetchAll(PDO::FETCH_ASSOC) : [];
    }

    public function findCategoryBySlug(string $slug): ?array
    {
        $stmt = $this->pdo()->prepare(
            'SELECT id, parent_id, name, slug, image, seo_title, seo_description
             FROM categories
             WHERE slug = :slug
             LIMIT 1'
        );
        $stmt->execute([':slug' => trim($slug)]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        return is_array($row) ? $row : null;
    }

    public function findCategoryById(int $id): ?array
    {
        $stmt = $this->pdo()->prepare(
            'SELECT id, parent_id, name, slug, image, seo_title, seo_description
             FROM categories
             WHERE id = :id
             LIMIT 1'
        );
        $stmt->execute([':id' => $id]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        return is_array($row) ? $row : null;
    }

    public function getModelsByCategory(int $categoryId): array
    {
        $stmt = $this->pdo()->prepare(
            'SELECT id, category_id, series, name, serial_number, image, is_top, is_visible
             FROM models
             WHERE category_id = :category_id AND is_visible = 1
             ORDER BY is_top DESC, series ASC, name ASC, id ASC'
        );
        $stmt->execute([':category_id' => $categoryId]);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function getTopModels(int $limit = 12): array
    {
        $stmt = $this->pdo()->prepare(
            'SELECT m.id, m.category_id, m.series, m.name, m.serial_number, m.image, m.is_top,
                    c.slug AS category_slug, c.name AS category_name
             FROM models m
             INNER JOIN categories c ON c.id = m.category_id
             WHERE m.is_visible = 1
             ORDER BY m.is_top DESC, m.id ASC
             LIMIT :lim'
        );
        $stmt->bindValue(':lim', max(1, min(50, $limit)), PDO::PARAM_INT);
        $stmt->execute();
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function getAllVisibleModels(): array
    {
        $stmt = $this->pdo()->query(
            'SELECT m.id, m.category_id, m.series, m.name, m.serial_number, m.image, m.is_top,
                    c.slug AS category_slug, c.name AS category_name
             FROM models m
             INNER JOIN categories c ON c.id = m.category_id
             WHERE m.is_visible = 1
             ORDER BY m.category_id ASC, m.is_top DESC, m.series ASC, m.name ASC'
        );
        return $stmt ? $stmt->fetchAll(PDO::FETCH_ASSOC) : [];
    }

    public function findModelById(int $id): ?array
    {
        $stmt = $this->pdo()->prepare(
            'SELECT m.id, m.category_id, m.series, m.name, m.serial_number, m.image, m.is_top, m.is_visible,
                    c.slug AS category_slug, c.name AS category_name
             FROM models m
             INNER JOIN categories c ON c.id = m.category_id
             WHERE m.id = :id AND m.is_visible = 1
             LIMIT 1'
        );
        $stmt->execute([':id' => $id]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        return is_array($row) ? $row : null;
    }

    public function findModelByIdentifier(string $identifier): ?array
    {
        $clean = trim($identifier);
        if ($clean === '') {
            return null;
        }

        if (ctype_digit($clean)) {
            $byId = $this->findModelById((int)$clean);
            if ($byId !== null) {
                return $byId;
            }
        }

        $stmt = $this->pdo()->prepare(
            'SELECT m.id, m.category_id, m.series, m.name, m.serial_number, m.image, m.is_top, m.is_visible,
                    c.slug AS category_slug, c.name AS category_name
             FROM models m
             INNER JOIN categories c ON c.id = m.category_id
             WHERE m.is_visible = 1
               AND (m.name = :exact_name OR m.serial_number = :exact_serial)
             LIMIT 1'
        );
        $stmt->execute([
            ':exact_name' => $clean,
            ':exact_serial' => $clean,
        ]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        return is_array($row) ? $row : null;
    }

    public function getStructureNodes(string $modelKey, ?string $parentCatId = null): array
    {
        $modelKey = trim($modelKey);
        if ($modelKey === '') {
            return [];
        }

        if ($parentCatId === null || trim($parentCatId) === '' || trim($parentCatId) === '0') {
            $stmt = $this->pdo()->prepare(
                'SELECT s.record_id, s.model, s.cat_id, s.parent_id, s.name, s.image, s.is_scheme,
                        (SELECT COUNT(*) FROM structure ch WHERE ch.model = s.model AND ch.parent_id = s.cat_id) AS children_count,
                        (SELECT COUNT(*) FROM parts p WHERE p.model = s.model AND p.cat_id = s.cat_id) AS parts_count
                 FROM structure s
                 WHERE s.model = :model
                   AND (s.parent_id IS NULL OR s.parent_id = "" OR s.parent_id = "0")
                 ORDER BY s.record_id ASC'
            );
            $stmt->execute([':model' => $modelKey]);
        } else {
            $stmt = $this->pdo()->prepare(
                'SELECT s.record_id, s.model, s.cat_id, s.parent_id, s.name, s.image, s.is_scheme,
                        (SELECT COUNT(*) FROM structure ch WHERE ch.model = s.model AND ch.parent_id = s.cat_id) AS children_count,
                        (SELECT COUNT(*) FROM parts p WHERE p.model = s.model AND p.cat_id = s.cat_id) AS parts_count
                 FROM structure s
                 WHERE s.model = :model AND s.parent_id = :parent_id
                 ORDER BY s.record_id ASC'
            );
            $stmt->execute([
                ':model' => $modelKey,
                ':parent_id' => trim($parentCatId),
            ]);
        }

        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
        foreach ($rows as &$row) {
            $row['is_scheme'] = (int)$row['is_scheme'] === 1;
            $row['children_count'] = (int)$row['children_count'];
            $row['parts_count'] = (int)$row['parts_count'];
        }
        unset($row);

        return $rows;
    }

    public function findStructureNode(string $modelKey, string $catId): ?array
    {
        $stmt = $this->pdo()->prepare(
            'SELECT record_id, model, cat_id, parent_id, name, image, is_scheme
             FROM structure
             WHERE model = :model AND cat_id = :cat_id
             LIMIT 1'
        );
        $stmt->execute([
            ':model' => trim($modelKey),
            ':cat_id' => trim($catId),
        ]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        if (!is_array($row)) {
            return null;
        }
        $row['is_scheme'] = (int)$row['is_scheme'] === 1;
        return $row;
    }

    public function getStructurePath(string $modelKey, string $catId): array
    {
        $chain = [];
        $visited = [];
        $currentId = trim($catId);

        for ($i = 0; $i < 12; $i++) {
            if ($currentId === '' || $currentId === '0' || isset($visited[$currentId])) {
                break;
            }
            $visited[$currentId] = true;
            $node = $this->findStructureNode($modelKey, $currentId);
            if ($node === null) {
                break;
            }
            $chain[] = $node;
            $currentId = trim((string)($node['parent_id'] ?? ''));
        }

        return array_reverse($chain);
    }

    public function getSchemeParts(string $modelKey, string $catId): array
    {
        $stmt = $this->pdo()->prepare(
            'SELECT p.id, p.model, p.cat_id, p.pos_code, p.pos_code_num, p.part_number,
                    p.qty, p.name, p.specs, p.pos_x, p.pos_y,
                    s.id AS stock_id, s.image AS stock_image, s.name AS stock_name,
                    s.manufacturer, s.locations, s.weight
             FROM parts p
             LEFT JOIN stock s ON s.part_number = p.part_number AND s.is_visible = 1
             WHERE p.model = :model AND p.cat_id = :cat_id
             ORDER BY p.pos_code_num ASC, p.pos_code ASC, p.id ASC'
        );
        $stmt->execute([
            ':model' => trim($modelKey),
            ':cat_id' => trim($catId),
        ]);
        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

        $grouped = [];
        foreach ($rows as $row) {
            $id = (int)$row['id'];
            if (isset($grouped[$id])) {
                continue;
            }
            $stockInfo = $this->extractStockInfo($row['stock_id'] ?? null, $row['locations'] ?? null);

            $grouped[$id] = [
                'id' => $id,
                'model' => (string)$row['model'],
                'cat_id' => (string)$row['cat_id'],
                'pos_code' => (string)$row['pos_code'],
                'pos_code_num' => (int)$row['pos_code_num'],
                'part_number' => trim((string)($row['part_number'] ?? '')),
                'qty' => trim((string)($row['qty'] ?? '1')),
                'name' => trim((string)($row['stock_name'] ?: ($row['name'] ?? ''))),
                'catalog_name' => trim((string)($row['name'] ?? '')),
                'specs' => trim((string)($row['specs'] ?? '')),
                'image' => $this->normalizeImage($row['stock_image'] ?? null),
                'manufacturer' => trim((string)($row['manufacturer'] ?? '')),
                'weight' => trim((string)($row['weight'] ?? '')),
                'in_stock' => $stockInfo['in_stock'],
                'stock_qty' => $stockInfo['total_qty'],
                'locations' => $stockInfo['locations'],
                'hotspots' => $this->parseHotspots($row['pos_x'] ?? null, $row['pos_y'] ?? null),
            ];
        }

        return array_values($grouped);
    }

    public function findPartByNumber(string $partNumber): ?array
    {
        $pn = trim($partNumber);
        if ($pn === '') {
            return null;
        }

        $stockStmt = $this->pdo()->prepare(
            'SELECT id, image, name, part_number, manufacturer, locations, weight
             FROM stock
             WHERE part_number = :pn AND is_visible = 1
             LIMIT 1'
        );
        $stockStmt->execute([':pn' => $pn]);
        $stockRow = $stockStmt->fetch(PDO::FETCH_ASSOC);

        $partStmt = $this->pdo()->prepare(
            'SELECT id, model, cat_id, pos_code, part_number, qty, name, specs
             FROM parts
             WHERE part_number = :pn
             ORDER BY id ASC
             LIMIT 1'
        );
        $partStmt->execute([':pn' => $pn]);
        $partRow = $partStmt->fetch(PDO::FETCH_ASSOC);

        if (!is_array($stockRow) && !is_array($partRow)) {
            return null;
        }

        $stockInfo = $this->extractStockInfo(
            is_array($stockRow) ? ($stockRow['id'] ?? null) : null,
            is_array($stockRow) ? ($stockRow['locations'] ?? null) : null
        );

        return [
            'part_number' => is_array($stockRow) ? trim((string)$stockRow['part_number']) : trim((string)$partRow['part_number']),
            'name' => trim((string)((is_array($stockRow) && $stockRow['name'] !== '') ? $stockRow['name'] : ($partRow['name'] ?? ''))),
            'catalog_name' => is_array($partRow) ? trim((string)($partRow['name'] ?? '')) : '',
            'specs' => is_array($partRow) ? trim((string)($partRow['specs'] ?? '')) : '',
            'manufacturer' => is_array($stockRow) ? trim((string)($stockRow['manufacturer'] ?? '')) : '',
            'weight' => is_array($stockRow) ? trim((string)($stockRow['weight'] ?? '')) : '',
            'image' => is_array($stockRow) ? $this->normalizeImage($stockRow['image'] ?? null) : null,
            'stock_id' => is_array($stockRow) ? (int)$stockRow['id'] : null,
            'in_stock' => $stockInfo['in_stock'],
            'stock_qty' => $stockInfo['total_qty'],
            'locations' => $stockInfo['locations'],
        ];
    }

    public function findPartsByNumbers(array $partNumbers): array
    {
        $clean = [];
        foreach ($partNumbers as $num) {
            $val = trim((string)$num);
            if ($val !== '') {
                $clean[$val] = $val;
            }
        }
        if ($clean === []) {
            return [];
        }

        $values = array_values($clean);
        $placeholders = implode(',', array_fill(0, count($values), '?'));
        $result = [];

        $stockStmt = $this->pdo()->prepare(
            'SELECT id, image, name, part_number, manufacturer, locations, weight
             FROM stock
             WHERE is_visible = 1 AND part_number IN (' . $placeholders . ')'
        );
        $stockStmt->execute($values);
        foreach ($stockStmt->fetchAll(PDO::FETCH_ASSOC) as $row) {
            $pn = trim((string)$row['part_number']);
            $stockInfo = $this->extractStockInfo($row['id'], $row['locations'] ?? null);
            $result[$pn] = [
                'part_number' => $pn,
                'name' => trim((string)$row['name']),
                'manufacturer' => trim((string)($row['manufacturer'] ?? '')),
                'weight' => trim((string)($row['weight'] ?? '')),
                'image' => $this->normalizeImage($row['image'] ?? null),
                'stock_id' => (int)$row['id'],
                'in_stock' => $stockInfo['in_stock'],
                'stock_qty' => $stockInfo['total_qty'],
                'locations' => $stockInfo['locations'],
            ];
        }

        $missing = array_values(array_diff($values, array_keys($result)));
        if ($missing !== []) {
            $missingPlaceholders = implode(',', array_fill(0, count($missing), '?'));
            $partStmt = $this->pdo()->prepare(
                'SELECT part_number, MAX(name) AS name, MAX(specs) AS specs
                 FROM parts
                 WHERE part_number IN (' . $missingPlaceholders . ')
                 GROUP BY part_number'
            );
            $partStmt->execute($missing);
            foreach ($partStmt->fetchAll(PDO::FETCH_ASSOC) as $row) {
                $pn = trim((string)$row['part_number']);
                $result[$pn] = [
                    'part_number' => $pn,
                    'name' => trim((string)($row['name'] ?? '')),
                    'manufacturer' => '',
                    'weight' => '',
                    'image' => null,
                    'stock_id' => null,
                    'in_stock' => false,
                    'stock_qty' => 0,
                    'locations' => [],
                ];
            }
        }

        return $result;
    }

    public function getPartApplicability(string $partNumber, int $limit = 40): array
    {
        $stmt = $this->pdo()->prepare(
            'SELECT p.model, p.cat_id, p.pos_code, p.qty,
                    s.name AS node_name, s.is_scheme
             FROM parts p
             LEFT JOIN structure s ON s.model = p.model AND s.cat_id = p.cat_id
             WHERE p.part_number = :pn
             GROUP BY p.model, p.cat_id, p.pos_code, p.qty, s.name, s.is_scheme
             ORDER BY p.model ASC, s.name ASC
             LIMIT :lim'
        );
        $stmt->bindValue(':pn', trim($partNumber), PDO::PARAM_STR);
        $stmt->bindValue(':lim', max(1, min(100, $limit)), PDO::PARAM_INT);
        $stmt->execute();

        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function quickSearch(string $query, int $limit = 10): array
    {
        $q = trim($query);
        if (mb_strlen($q, 'UTF-8') < 2) {
            return [];
        }

        $limit = max(1, min(25, $limit));
        $like = '%' . $this->escapeLike($q) . '%';
        $prefix = $this->escapeLike($q) . '%';

        $items = [];
        $seen = [];

        $stockStmt = $this->pdo()->prepare(
            'SELECT id, part_number, name, image, locations
             FROM stock
             WHERE is_visible = 1
               AND (part_number LIKE :like_pn OR name LIKE :like_name OR cross_numbers LIKE :like_cross)
             ORDER BY (part_number = :exact_pn) DESC,
                      (part_number LIKE :prefix_pn) DESC,
                      part_number ASC
             LIMIT :lim'
        );
        $stockStmt->bindValue(':like_pn', $like, PDO::PARAM_STR);
        $stockStmt->bindValue(':like_name', $like, PDO::PARAM_STR);
        $stockStmt->bindValue(':like_cross', $like, PDO::PARAM_STR);
        $stockStmt->bindValue(':exact_pn', $q, PDO::PARAM_STR);
        $stockStmt->bindValue(':prefix_pn', $prefix, PDO::PARAM_STR);
        $stockStmt->bindValue(':lim', $limit, PDO::PARAM_INT);
        $stockStmt->execute();

        foreach ($stockStmt->fetchAll(PDO::FETCH_ASSOC) as $row) {
            $pn = trim((string)$row['part_number']);
            if ($pn === '' || isset($seen[$pn])) {
                continue;
            }
            $seen[$pn] = true;
            $stockInfo = $this->extractStockInfo($row['id'], $row['locations'] ?? null);
            $items[] = [
                'part_number' => $pn,
                'name' => trim((string)$row['name']),
                'image' => $this->normalizeImage($row['image'] ?? null),
                'in_stock' => $stockInfo['in_stock'],
                'stock_qty' => $stockInfo['total_qty'],
                'url' => '/part/' . rawurlencode($pn),
            ];
        }

        $remaining = $limit - count($items);
        if ($remaining > 0) {
            $partStmt = $this->pdo()->prepare(
                'SELECT part_number, MAX(name) AS name
                 FROM parts
                 WHERE part_number IS NOT NULL AND part_number <> ""
                   AND (part_number LIKE :like_pn OR name LIKE :like_name)
                 GROUP BY part_number
                 ORDER BY (part_number = :exact_pn) DESC,
                          (part_number LIKE :prefix_pn) DESC,
                          part_number ASC
                 LIMIT :lim'
            );
            $partStmt->bindValue(':like_pn', $like, PDO::PARAM_STR);
            $partStmt->bindValue(':like_name', $like, PDO::PARAM_STR);
            $partStmt->bindValue(':exact_pn', $q, PDO::PARAM_STR);
            $partStmt->bindValue(':prefix_pn', $prefix, PDO::PARAM_STR);
            $partStmt->bindValue(':lim', $remaining + count($seen), PDO::PARAM_INT);
            $partStmt->execute();

            foreach ($partStmt->fetchAll(PDO::FETCH_ASSOC) as $row) {
                if (count($items) >= $limit) {
                    break;
                }
                $pn = trim((string)$row['part_number']);
                if ($pn === '' || isset($seen[$pn])) {
                    continue;
                }
                $seen[$pn] = true;
                $items[] = [
                    'part_number' => $pn,
                    'name' => trim((string)($row['name'] ?? '')),
                    'image' => null,
                    'in_stock' => false,
                    'stock_qty' => 0,
                    'url' => '/part/' . rawurlencode($pn),
                ];
            }
        }

        return $items;
    }

    public function getCatalogStats(): array
    {
        $pdo = $this->pdo();

        return [
            'categories' => (int)$pdo->query('SELECT COUNT(*) FROM categories')->fetchColumn(),
            'models' => (int)$pdo->query('SELECT COUNT(*) FROM models WHERE is_visible = 1')->fetchColumn(),
            'schemes' => (int)$pdo->query('SELECT COUNT(*) FROM structure WHERE is_scheme = 1')->fetchColumn(),
            'in_stock' => (int)$pdo->query('SELECT COUNT(*) FROM stock WHERE is_visible = 1')->fetchColumn(),
        ];
    }

    public function getSitemapCategories(): array
    {
        $stmt = $this->pdo()->query('SELECT slug FROM categories ORDER BY id ASC');
        return $stmt ? $stmt->fetchAll(PDO::FETCH_ASSOC) : [];
    }

    public function getSitemapModels(): array
    {
        $stmt = $this->pdo()->query(
            'SELECT id, name, serial_number FROM models WHERE is_visible = 1 ORDER BY id ASC'
        );
        return $stmt ? $stmt->fetchAll(PDO::FETCH_ASSOC) : [];
    }

    public function getSitemapSchemes(int $limit = 5000, int $offset = 0): array
    {
        $stmt = $this->pdo()->prepare(
            'SELECT model, cat_id, name, image
             FROM structure
             WHERE is_scheme = 1 AND cat_id IS NOT NULL AND cat_id <> ""
             ORDER BY record_id ASC
             LIMIT :lim OFFSET :off'
        );
        $stmt->bindValue(':lim', max(1, $limit), PDO::PARAM_INT);
        $stmt->bindValue(':off', max(0, $offset), PDO::PARAM_INT);
        $stmt->execute();
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function getSitemapStockParts(int $limit = 5000, int $offset = 0): array
    {
        $stmt = $this->pdo()->prepare(
            'SELECT part_number, name, image
             FROM stock
             WHERE is_visible = 1 AND part_number <> ""
             ORDER BY id ASC
             LIMIT :lim OFFSET :off'
        );
        $stmt->bindValue(':lim', max(1, $limit), PDO::PARAM_INT);
        $stmt->bindValue(':off', max(0, $offset), PDO::PARAM_INT);
        $stmt->execute();
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function extractStockInfo(mixed $stockId, ?string $locationsRaw): array
    {
        if ($stockId === null) {
            return ['in_stock' => false, 'total_qty' => 0, 'locations' => []];
        }

        $parsed = $this->parseLocations($locationsRaw);
        $totalQty = 0;
        foreach ($parsed as $loc) {
            $totalQty += $loc['qty'];
        }

        return [
            'in_stock' => $totalQty > 0 || ($parsed === [] && trim((string)$locationsRaw) !== ''),
            'total_qty' => $totalQty,
            'locations' => $parsed,
        ];
    }

    public function parseLocations(?string $raw): array
    {
        if ($raw === null) {
            return [];
        }
        $trimmed = trim($raw);
        if ($trimmed === '') {
            return [];
        }

        if ($trimmed[0] === '{' || $trimmed[0] === '[') {
            $decoded = json_decode($trimmed, true);
            if (is_array($decoded)) {
                $result = [];
                foreach ($decoded as $key => $val) {
                    if (is_array($val)) {
                        $city = trim((string)($val['city'] ?? $val['name'] ?? $val['location'] ?? $key));
                        $qty = (int)($val['qty'] ?? $val['count'] ?? $val['quantity'] ?? 0);
                        if ($city !== '' && $qty > 0) {
                            $result[] = ['city' => $city, 'qty' => $qty];
                        }
                    } elseif (is_string($key) && is_numeric($val)) {
                        $qty = (int)$val;
                        if ($qty > 0) {
                            $result[] = ['city' => trim($key), 'qty' => $qty];
                        }
                    }
                }
                return $result;
            }
        }

        if (is_numeric($trimmed)) {
            $qty = (int)$trimmed;
            return $qty > 0 ? [['city' => 'Склад', 'qty' => $qty]] : [];
        }

        $result = [];
        $chunks = preg_split('/[;,\n]+/u', $trimmed) ?: [];
        foreach ($chunks as $chunk) {
            $chunk = trim($chunk);
            if ($chunk === '') {
                continue;
            }
            if (preg_match('/^(.+?)[\s:—–-]+(\d+)\s*(?:шт\.?)?$/u', $chunk, $m) === 1) {
                $qty = (int)$m[2];
                if ($qty > 0) {
                    $result[] = ['city' => trim($m[1]), 'qty' => $qty];
                }
            } else {
                $result[] = ['city' => $chunk, 'qty' => 1];
            }
        }

        return $result;
    }

    private function parseHotspots(?string $posX, ?string $posY): array
    {
        $xs = $this->splitCoordList($posX);
        $ys = $this->splitCoordList($posY);
        $count = min(count($xs), count($ys));

        $points = [];
        for ($i = 0; $i < $count; $i++) {
            $points[] = ['x' => $xs[$i], 'y' => $ys[$i]];
        }

        return $points;
    }

    private function splitCoordList(?string $raw): array
    {
        if ($raw === null) {
            return [];
        }
        $trimmed = trim($raw);
        if ($trimmed === '') {
            return [];
        }

        if ($trimmed[0] === '[') {
            $decoded = json_decode($trimmed, true);
            if (is_array($decoded)) {
                $out = [];
                foreach ($decoded as $val) {
                    if (is_numeric($val)) {
                        $out[] = (float)$val;
                    }
                }
                return $out;
            }
        }

        $parts = preg_split('/[\s,;|]+/', $trimmed) ?: [];
        $out = [];
        foreach ($parts as $item) {
            $normalized = str_replace(',', '.', trim($item));
            if ($normalized !== '' && is_numeric($normalized)) {
                $out[] = (float)$normalized;
            }
        }

        return $out;
    }

    private function normalizeImage(?string $path): ?string
    {
        if ($path === null) {
            return null;
        }
        $clean = trim($path);
        return $clean !== '' ? $clean : null;
    }

    private function escapeLike(string $value): string
    {
        return str_replace(['\\', '%', '_'], ['\\\\', '\\%', '\\_'], $value);
    }

    private function pdo(): PDO
    {
        return Database::pdo();
    }
}