<?php
include_once './auth.php';
include_once './config.php';

$result['user'] = $user;

if ($user['group_writer'] != 't') {
    $result['result'] = false;
    $result['message'] = "User has no access rights";
    print json_encode($result);
    exit(0);
}

$conn_str = "host=$database_hostname port=5432 dbname=$database_name user=$database_username password=$database_password";
$dbi = pg_connect($conn_str) OR DIE("Can't connect to database");

if (isset($_GET['device_id']) && isset($_GET['device_disable'])) {

    $condition = explode(",", $_GET['device_id']);
    $tablename = "\"$analyzer_schema\".\"devices\"";
    $query = "UPDATE $tablename SET device_enabled=false WHERE (device_id=" . implode(" OR device_id=", $condition) . ");";
//    $result['query'] = $query;
    if ( pg_query($dbi, $query) ) {
        $result['result'] = true;
    } else {
        $result['result'] = false;
    }
}

if (isset($_GET['device_id']) && isset($_GET['device_enable'])) {

    $condition = explode(",", $_GET['device_id']);
    $tablename = "\"$analyzer_schema\".\"devices\"";
    $query = "UPDATE $tablename SET device_enabled=true WHERE (device_id=" . implode(" OR device_id=", $condition) . ");";
//    $result['query'] = $query;
    if ( pg_query($dbi, $query) ) {
        $result['result'] = true;
    } else {
        $result['result'] = false;
    }
}

if (isset($_GET['device_id']) && isset($_GET['device_description'])) {
    $condition = explode(",", $_GET['device_id']);
    $tablename = "\"$analyzer_schema\".\"devices\"";
    $query = "UPDATE $tablename SET device_description='".$_GET['device_description']."' WHERE (device_id=" . implode(" OR device_id=", $condition) . ");";
//    $result['query'] = $query;
    if ( pg_query($dbi, $query) ) {
        $result['result'] = true;
    } else {
        $result['result'] = false;
    }
}

if (isset($_GET['device_id']) && isset($_GET['device_snmpstr'])) {
    $condition = explode(",", $_GET['device_id']);
    $tablename = "\"$analyzer_schema\".\"devices\"";
    $query = "UPDATE $tablename SET device_snmpstr='".$_GET['device_snmpstr']."' WHERE (device_id=" . implode(" OR device_id=", $condition) . ");";
//    $result['query'] = $query;
    if ( pg_query($dbi, $query) ) {
        $result['result'] = true;
    } else {
        $result['result'] = false;
    }
}

if (isset($_GET['device_id']) && isset($_GET['interface_discover'])) {
    $result['interfaces'] = false;
    $result['result'] = false;
    $fieldlist = array("device_id","device_header","device_description","device_data","device_snmpstr","device_enabled");
    $tablename = "\"$analyzer_schema\".\"devices\"";
    $query = "SELECT " . implode(",", $fieldlist) . " FROM $tablename WHERE device_header='". $_GET['device_id'] ."' ORDER BY device_id;";
    $res = pg_query($dbi, $query);
    $r = pg_fetch_array($res);
    set_error_handler(function() { /* ignore errors */ });
    $a[] = snmp2_walk(long2ip($r['device_header']), $r['device_snmpstr'], "IF-MIB::ifIndex", 1000000, 3);
    restore_error_handler();
    if ($a[0] != false) {
        $a[] = snmp2_walk(long2ip($r['device_header']), $r['device_snmpstr'], "IF-MIB::ifName");
        $a[] = snmp2_walk(long2ip($r['device_header']), $r['device_snmpstr'], "IF-MIB::ifAlias");
        $a[] = snmp2_walk(long2ip($r['device_header']), $r['device_snmpstr'], "IF-MIB::ifSpeed");
        foreach (array_keys($a[0]) as $b) {
            $if = explode (": ", (implode (": ", array_column($a, $b))));
            $if = [$_GET['device_id'],$if[1],$if[3],$if[5],$if[7],"false","false"];
            $list[] = implode("','", $if);
        }
        $tablename = "\"$analyzer_schema\".\"interfaces\"";
        $query = "DELETE FROM $tablename WHERE device_id='".$_GET['device_id']."';";
//        $result['result'] = $query;
        $res = pg_query($dbi, $query) or die('Error: ' . pg_last_error());

        $fieldlist = array("device_id","interface_id","interface_name","interface_alias","interface_bandwidth","interface_enabled","interface_primary");
        $query = "INSERT INTO $tablename (\"".implode("\",\"", $fieldlist)."\") VALUES ('".implode("'),('", $list)."');";
        $res = pg_query($dbi, $query) or die('Error: ' . pg_last_error());
        $result['result'] = true;
    } else {
        $result['result'] = false;
    }
    $query = "SELECT " . implode(",", $fieldlist) . " FROM $tablename ORDER BY device_id, interface_id;";
//    $result['query'] = $query;
    $res = pg_query($dbi, $query) or die('Error: ' . pg_last_error());
    while($r = pg_fetch_array($res)) {
        $rows[] = $r;
    }
    $result['interfaces'] = $rows;
}

if (isset($_GET['interface_enable'])) {

    $condition = explode(",", $_GET['interface_enable']);
    $tablename = "\"$analyzer_schema\".\"interfaces\"";
    foreach ($condition as $key => $value) {
        $condition[$key] = "(device_id=" . implode(" AND interface_id=", explode("_", $condition[$key])) . ")";
    }
    $query = "UPDATE $tablename SET interface_enabled=true WHERE (" . implode(" OR ", $condition) . ");";
//    $result['query'] = $query;
    if ( pg_query($dbi, $query) ) {
        $result['result'] = true;
    } else {
        $result['result'] = false;
    }
}

if (isset($_GET['interface_disable'])) {

    $condition = explode(",", $_GET['interface_disable']);
    $tablename = "\"$analyzer_schema\".\"interfaces\"";
    foreach ($condition as $key => $value) {
        $condition[$key] = "(device_id=" . implode(" AND interface_id=", explode("_", $condition[$key])) . ")";
    }
    $query = "UPDATE $tablename SET interface_enabled=false WHERE (" . implode(" OR ", $condition) . ");";
//    $result['query'] = $query;
    if ( pg_query($dbi, $query) ) {
        $result['result'] = true;
    } else {
        $result['result'] = false;
    }
}

if (isset($_GET['interface_primary'])) {

    $condition = explode(",", $_GET['interface_primary']);
    $tablename = "\"$analyzer_schema\".\"interfaces\"";
    foreach ($condition as $key => $value) {
        $condition[$key] = "(device_id=" . implode(" AND interface_id=", explode("_", $condition[$key])) . ")";
    }
    $query = "UPDATE $tablename SET interface_primary=true WHERE (" . implode(" OR ", $condition) . ");";
//    $result['query'] = $query;
    if ( pg_query($dbi, $query) ) {
        $result['result'] = true;
    } else {
        $result['result'] = false;
    }
}

if (isset($_GET['interface_nonprimary'])) {

    $condition = explode(",", $_GET['interface_nonprimary']);
    $tablename = "\"$analyzer_schema\".\"interfaces\"";
    foreach ($condition as $key => $value) {
        $condition[$key] = "(device_id=" . implode(" AND interface_id=", explode("_", $condition[$key])) . ")";
    }
    $query = "UPDATE $tablename SET interface_primary=false WHERE (" . implode(" OR ", $condition) . ");";
//    $result['query'] = $query;
    if ( pg_query($dbi, $query) ) {
        $result['result'] = true;
    } else {
        $result['result'] = false;
    }
}

if (isset($_GET['v9template_sampling']) && isset($_GET['v9template_id'])) {

    $condition = explode(",", $_GET['v9template_id']);
    $tablename = "\"$analyzer_schema\".\"v9templates\"";
    foreach ($condition as $key => $value) {
        $condition[$key] = "(device_id=" . implode(" AND template_id=", explode("_", $condition[$key])) . ")";
    }
    $query = "UPDATE $tablename SET template_sampling=".$_GET['v9template_sampling']." WHERE (" . implode(" OR ", $condition) . ");";
//    $result['query'] = $query;
    if ( pg_query($dbi, $query) ) {
        $result['result'] = true;
    } else {
        $result['result'] = false;
    }
}

if (isset($_GET['v9template_enable'])) {

    $condition = explode(",", $_GET['v9template_enable']);
    $tablename = "\"$analyzer_schema\".\"v9templates\"";
    foreach ($condition as $key => $value) {
        $condition[$key] = "(device_id=" . implode(" AND template_id=", explode("_", $condition[$key])) . ")";
    }
    $query = "UPDATE $tablename SET template_enabled=true WHERE (" . implode(" OR ", $condition) . ");";
//    $result['query'] = $query;
    if ( pg_query($dbi, $query) ) {
        $result['result'] = true;
    } else {
        $result['result'] = false;
    }
}

if (isset($_GET['v9template_disable'])) {

    $condition = explode(",", $_GET['v9template_disable']);
    $tablename = "\"$analyzer_schema\".\"v9templates\"";
    foreach ($condition as $key => $value) {
        $condition[$key] = "(device_id=" . implode(" AND template_id=", explode("_", $condition[$key])) . ")";
    }
    $query = "UPDATE $tablename SET template_enabled=false WHERE (" . implode(" OR ", $condition) . ");";
//    $result['query'] = $query;
    if ( pg_query($dbi, $query) ) {
        $result['result'] = true;
    } else {
        $result['result'] = false;
    }
}

if (isset($_GET['add_dashboard_link']) && isset($_GET['link_header']) && isset($_GET['link_href']) && isset($_GET['link_description'])) {

    $tablename = "\"$dashboard_schema\".\"links\"";
    $query = "INSERT INTO $tablename (\"link_header\",\"link_href\",\"link_description\") VALUES ('".$_GET['link_header']."', '".$_GET['link_href']."', '".$_GET['link_description']."');";
//    $result['query'] = $query;
    if ( pg_query($dbi, $query) ) {
        $result['result'] = true;
    } else {
        $result['result'] = false;
    }
}

if (isset($_GET['del_dashboard_link']) && isset($_GET['link_id'])) {

    $condition = explode(",", $_GET['link_id']);
    $tablename = "\"$dashboard_schema\".\"links\"";
    $query = "DELETE FROM links WHERE \"link_id\"=".implode(" OR \"link_id\"=", $condition).";";
//    $result['query'] = $query;
    if ( pg_query($dbi, $query) ) {
        $result['result'] = true;
    } else {
        $result['result'] = false;
    }
}

print json_encode($result);

pg_close($dbi);
?>
