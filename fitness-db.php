<?php
declare(strict_types=1);

function fitness_db(): PDO
{
    $dataDir = __DIR__ . DIRECTORY_SEPARATOR . 'fitness-data';
    if (!is_dir($dataDir)) {
        mkdir($dataDir, 0775, true);
    }

    $pdo = new PDO('sqlite:' . $dataDir . DIRECTORY_SEPARATOR . 'fitness.sqlite');
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $pdo->exec('
        CREATE TABLE IF NOT EXISTS app_state (
            id INTEGER PRIMARY KEY CHECK (id = 1),
            state_json TEXT NOT NULL,
            updated_at TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS uploaded_videos (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            file_name TEXT NOT NULL,
            original_name TEXT NOT NULL,
            mime_type TEXT NOT NULL,
            url TEXT NOT NULL,
            created_at TEXT NOT NULL
        );
    ');

    return $pdo;
}
