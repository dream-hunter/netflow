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

#    $query = "SELECT EXISTS (
#        SELECT FROM information_schema.tables 
#        WHERE  table_schema = 'public'
#        AND    table_name   = 'links'
#    );";
#    $res = pg_query($dbi, $query) or die('Error: ' . pg_last_error());
#    $r = pg_fetch_array($res);
#    if ($r['exists'] != 't') {
#        $query = "CREATE TABLE IF NOT EXISTS links (
#            \"link_id\" serial PRIMARY KEY  NOT NULL,
#            \"link_header\" character varying (1024),
#            \"link_href\" character varying (4096),
#            \"link_description\" character varying (1024)
#        );";
#        $res = pg_query($dbi, $query) or die('Error: ' . pg_last_error());
#    } else {
        $fieldlist = array("link_id","link_header","link_href","link_description");
        $tablename = "\"$dashboard_schema\".\"links\"";

        $query = "SELECT " . implode(",", $fieldlist) . " FROM $tablename ORDER BY link_id;";
        $res = pg_query($dbi, $query) or die('Error: ' . pg_last_error());
        while($r = pg_fetch_array($res)) {
            $result['links'][] = $r;
        }
#    }
}



print json_encode($result);
pg_close($dbi);
?>
