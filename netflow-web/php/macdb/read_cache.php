<?php
  $cache_time = 300; // Время жизни кэша в секундах
  $file = strrchr($_SERVER["SCRIPT_NAME"], "/");// Получаем название файла
  $file = substr($file, 1); // Удаляем слеш
  $cache_file = "cache/$file.html"; // Файл будет находиться, например, в /cache/a.php.html
  if (file_exists($cache_file)) {
    // Если файл с кэшем существует
    if ((time() - $cache_time) < filemtime($cache_file)) {
      // Если его время жизни ещё не прошло
      echo file_get_contents($cache_file); // Выводим содержимое файла
      exit; // Завершаем скрипт, чтобы сэкономить время на дальнейшей обработке
    }
  }
  ob_start(); // Открываем буфер для вывода, если кэша нет, или он устарел
?>
