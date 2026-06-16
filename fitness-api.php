<?php
declare(strict_types=1);

require __DIR__ . '/fitness-db.php';

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Headers: Content-Type');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

$pdo = fitness_db();

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $statement = $pdo->query('SELECT state_json FROM app_state WHERE id = 1');
    $row = $statement->fetch(PDO::FETCH_ASSOC);

    if (!$row) {
        echo json_encode([
            'profile' => null,
            'progress' => [],
            'meals' => (object) [],
            'workouts' => (object) [],
            'weekPlan' => (object) [],
            'videos' => [],
            'activeTab' => 'dashboard',
        ]);
        exit;
    }

    echo $row['state_json'];
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

$raw = file_get_contents('php://input');
$state = json_decode($raw, true);

if (!is_array($state)) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid JSON']);
    exit;
}

$allowed = ['profile', 'progress', 'meals', 'workouts', 'weekPlan', 'videos', 'activeTab'];
$clean = [];
foreach ($allowed as $key) {
    if (array_key_exists($key, $state)) {
        $clean[$key] = $state[$key];
    }
}

$json = json_encode($clean, JSON_PRETTY_PRINT);
$statement = $pdo->prepare('
    INSERT INTO app_state (id, state_json, updated_at)
    VALUES (1, :state_json, :updated_at)
    ON CONFLICT(id) DO UPDATE SET
        state_json = excluded.state_json,
        updated_at = excluded.updated_at
');
$statement->execute([
    ':state_json' => $json,
    ':updated_at' => gmdate('c'),
]);

echo json_encode(['ok' => true, 'database' => 'fitness-data/fitness.sqlite']);
