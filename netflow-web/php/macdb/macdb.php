<?php
    require_once "read_cache.php"; // Пытаемся вывести содержимое кэша
    // Здесь идёт обычная генерация страницы
    $array = array();
    $row = 1;
    if (($handle = fopen("oui.csv", "r")) !== FALSE) {
        $data = fgetcsv($handle, 1000, ",");
        while (($data = fgetcsv($handle, 1000, ",")) !== FALSE) {
            $num = count($data);
            $array["MAL"][$data[1]]["vendor_name"] = $data[2];
            $array["MAL"][$data[1]]["vendor_address"] = $data[3];
        }
        fclose($handle);
        echo json_encode($array);
    }
    require_once "write_cache.php"; // Здесь идёт сохранение сгенерированной страницы в кэш
?>