<?php
include_once './auth.php';
include_once './config.php';

//$result = array();
$result['user'] = $user;

if ($user['group_reader'] != 't') {
    $result['result'] = false;
    $result['message'] = "User has no access rights";
    print json_encode($result);
    exit(0);
}

$conn_str = "host=$database_hostname port=5432 dbname=$database_name user=$database_username password=$database_password";
$dbi = pg_connect($conn_str) OR DIE("Can't connect to database");

if (isset($_GET['devices'])) {

    $fieldlist = array("device_id","device_header","device_description","device_data","device_snmpstr","device_enabled");
    $tablename = "\"$analyzer_schema\".\"devices\"";
    $query = "SELECT " . implode(",", $fieldlist) . " FROM $tablename ORDER BY device_header;";
    $res = pg_query($dbi, $query) or die('Error: ' . pg_last_error());
    while($r = pg_fetch_array($res)) {
        $result['devices'][] = $r;
    }
}

if (isset($_GET['interfaces'])) {

    $fieldlist = array("device_id","interface_id","interface_name","interface_alias","interface_bandwidth","interface_enabled","interface_primary");
    $tablename = "\"$analyzer_schema\".\"interfaces\"";
    $query = "SELECT " . implode(",", $fieldlist) . " FROM $tablename";
    if (isset($_GET['device_id'])) {
        $query .= " WHERE device_id=" . $_GET['device_id'];
    }
    $query .= " ORDER BY device_id, interface_id;";
    $res = pg_query($dbi, $query) or die('Error: ' . pg_last_error());
    while($r = pg_fetch_array($res)) {
        $result['interfaces'][] = $r;
    }
}

if (isset($_GET['v9templates'])) {

    $fieldlist = array("device_id","template_id","template_length","template_header","template_format","template_sampling","template_enabled");
    $tablename = "\"$analyzer_schema\".\"v9templates\"";

    $query = "SELECT " . implode(",", $fieldlist) . " FROM $tablename ORDER BY device_id, template_id;";
    $res = pg_query($dbi, $query) or die('Error: ' . pg_last_error());
    while($r = pg_fetch_array($res)) {
        $result['v9templates'][] = $r;
    }
}

if (isset($_GET['ipfix'])) {

    $fieldlist = array("id","name","data_type","data_type_semantics","data_description");
    $tablename = "\"$analyzer_schema\".\"ipfix\"";

    $query = "SELECT " . implode(",", $fieldlist) . " FROM $tablename ORDER BY id;";
    $res = pg_query($dbi, $query) or die('Error: ' . pg_last_error());
    while($r = pg_fetch_array($res)) {
        $result['ipfix'][] = $r;
    }
}

if (isset($_GET['links'])) {
    $fieldlist = array("link_id","link_header","link_href","link_description");
    $tablename = "\"$dashboard_schema\".\"links\"";

    $query = "SELECT " . implode(",", $fieldlist) . " FROM $tablename ORDER BY link_id;";
    $res = pg_query($dbi, $query) or die('Error: ' . pg_last_error());
    while($r = pg_fetch_array($res)) {
        $result['links'][] = $r;
    }
}

if (isset($_GET['tables'])) {
    $query = "SELECT
                table_name,
                pg_size_pretty(table_size) AS table_size,
                pg_size_pretty(indexes_size) AS indexes_size,
                pg_size_pretty(total_size) AS total_size
              FROM (
                SELECT
                    table_name,
                    pg_table_size(table_name) AS table_size,
                    pg_indexes_size(table_name) AS indexes_size,
                    pg_total_relation_size(table_name) AS total_size
                FROM (
                    SELECT (table_schema || '.' || table_name) AS table_name
                    FROM information_schema.tables
                ) AS all_tables
                WHERE \"table_name\" LIKE '%collector.bin_%' OR \"table_name\" LIKE '%collector.v5_%'
                ORDER BY total_size DESC
              ) AS pretty_sizes;";
    $res = pg_query($dbi, $query) or die('Error: ' . pg_last_error());
    while($r = pg_fetch_array($res)) {
        $result['collector'][] = $r;
    }
    $query = "SELECT
                table_name,
                pg_size_pretty(table_size) AS table_size,
                pg_size_pretty(indexes_size) AS indexes_size,
                pg_size_pretty(total_size) AS total_size
              FROM (
                SELECT
                    table_name,
                    pg_table_size(table_name) AS table_size,
                    pg_indexes_size(table_name) AS indexes_size,
                    pg_total_relation_size(table_name) AS total_size
                FROM (
                    SELECT (table_schema || '.' || table_name) AS table_name
                    FROM information_schema.tables
                ) AS all_tables
                WHERE \"table_name\" LIKE '%analyzer.tmp_%' OR \"table_name\" LIKE '%analyzer.raw_%'
                ORDER BY total_size DESC
              ) AS pretty_sizes;";
    $res = pg_query($dbi, $query) or die('Error: ' . pg_last_error());
    while($r = pg_fetch_array($res)) {
        $result['analyzer'][] = $r;
    }
}

if (isset($_GET['schemas'])) {
    $query = "SELECT schema_name, 
           sum(table_size)
        FROM (
          SELECT pg_catalog.pg_namespace.nspname as schema_name,
                 pg_relation_size(pg_catalog.pg_class.oid) as table_size,
                 sum(pg_relation_size(pg_catalog.pg_class.oid)) over () as database_size
          FROM   pg_catalog.pg_class
             JOIN pg_catalog.pg_namespace ON relnamespace = pg_catalog.pg_namespace.oid
        ) t
        WHERE schema_name='collector' OR schema_name='analyzer' OR schema_name='dashboard'
        GROUP BY schema_name, database_size";

    $res = pg_query($dbi, $query) or die('Error: ' . pg_last_error());
    while($r = pg_fetch_array($res)) {
        $result['schemas'][] = $r;
    }
}



print json_encode($result);
pg_close($dbi);
?>
