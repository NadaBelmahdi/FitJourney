<?php
declare(strict_types=1);

$index = __DIR__ . DIRECTORY_SEPARATOR . 'dist' . DIRECTORY_SEPARATOR . 'index.html';

if (!file_exists($index)) {
    http_response_code(500);
    echo 'Run npm run build before opening app.php.';
    exit;
}

$html = file_get_contents($index);
$html = str_replace('"/assets/', '"/dist/assets/', $html);
$html = str_replace("'/assets/", "'/dist/assets/", $html);

echo $html;
