<?php
declare(strict_types=1);

require __DIR__ . '/fitness-db.php';

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

if (!isset($_FILES['video']) || $_FILES['video']['error'] !== UPLOAD_ERR_OK) {
    http_response_code(400);
    echo json_encode(['error' => 'No video uploaded']);
    exit;
}

$allowed = [
    'video/mp4' => 'mp4',
    'video/webm' => 'webm',
    'video/quicktime' => 'mov',
    'video/x-msvideo' => 'avi',
];

$tmp = $_FILES['video']['tmp_name'];
$mime = mime_content_type($tmp);

if (!isset($allowed[$mime])) {
    http_response_code(415);
    echo json_encode(['error' => 'Unsupported video type']);
    exit;
}

$uploadDir = __DIR__ . DIRECTORY_SEPARATOR . 'uploads';
if (!is_dir($uploadDir)) {
    mkdir($uploadDir, 0775, true);
}

$fileName = 'workout-' . date('Ymd-His') . '-' . bin2hex(random_bytes(4)) . '.' . $allowed[$mime];
$target = $uploadDir . DIRECTORY_SEPARATOR . $fileName;

if (!move_uploaded_file($tmp, $target)) {
    http_response_code(500);
    echo json_encode(['error' => 'Could not save video']);
    exit;
}

$url = 'uploads/' . $fileName;
$pdo = fitness_db();
$statement = $pdo->prepare('
    INSERT INTO uploaded_videos (file_name, original_name, mime_type, url, created_at)
    VALUES (:file_name, :original_name, :mime_type, :url, :created_at)
');
$statement->execute([
    ':file_name' => $fileName,
    ':original_name' => $_FILES['video']['name'],
    ':mime_type' => $mime,
    ':url' => $url,
    ':created_at' => gmdate('c'),
]);

echo json_encode([
    'ok' => true,
    'url' => $url,
    'videoId' => $pdo->lastInsertId(),
]);
