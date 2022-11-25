<?php
  $handle = fopen($cache_file, 'w'); // Открываем файл для записи и стираем его содержимое
  fwrite($handle, ob_get_contents()); // Сохраняем всё содержимое буфера в файл
  fclose($handle); // Закрываем файл
  ob_end_flush(); // Выводим страницу в браузере
?>
