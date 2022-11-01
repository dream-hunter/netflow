<?php
include_once './auth.php';
include_once './config.php';

$result['user'] = $user;

if ($user['group_admin'] != 't') {
    $result['result'] = false;
    $result['message'] = "User has no access rights";
    print json_encode($result);
    exit(0);
}

$conn_str = "host=$database_hostname port=5432 dbname=$database_name user=$database_username password=$database_password";
$dbi = pg_connect($conn_str) OR DIE("Can't connect to database");

if (isset($_GET['userlist'])) {

    $fieldlist = array("users.user_id", "users.user_name", "users.user_group", "users.user_name_full", "users.user_email", "users.user_enabled",
                       "groups.group_id", "groups.group_name", "groups.group_enabled", "groups.group_reader", "groups.group_writer", "groups.group_admin");
    $tablename = "\"$dashboard_schema\".\"users\"";
    $query = "SELECT " . implode(",", $fieldlist) . " FROM $tablename JOIN $dashboard_schema.groups ON groups.group_id = users.user_group ORDER BY user_name;";
#    $result['query'] = $query;
    $res = pg_query($dbi, $query) or die('Error: ' . pg_last_error());
    while($r = pg_fetch_array($res)) {
        $result['users'][] = $r;
    }
}

if (isset($_GET['grouplist'])) {

    $fieldlist = array("group_id", "group_name", "group_enabled", "group_reader", "group_writer", "group_admin");
    $tablename = "\"$dashboard_schema\".\"groups\"";

    $query = "SELECT " . implode(",", $fieldlist) . " FROM $tablename ORDER BY group_id;";
    $res = pg_query($dbi, $query) or die('Error: ' . pg_last_error());
    while($r = pg_fetch_array($res)) {
        $result['groups'][] = $r;
    }
}

if (isset($_POST['useradd']) && isset($_POST['user']) && isset($_POST['pass']) && isset($_POST['groupid'])) {
    $_username = $_POST['user'];
    $_password = $_POST['pass'];
    $password = hash_hmac('sha512', $_password, $auth_pepper);
    $groupid = $_POST['groupid'];
    $fieldlist = array("user_name","user_pass","user_group","user_enabled");
    $tablename = "\"$dashboard_schema\".\"users\"";
    $query = "INSERT INTO $tablename (\"".implode("\",\"", $fieldlist)."\") VALUES ('$_username', '$password', '$groupid', true);";
    $res = pg_query($dbi, $query) or die('Error: ' . pg_last_error());
    $row = pg_fetch_array($res);
}

if (isset($_POST['useredit']) && isset($_POST['userid'])) {
    $userid = $_POST['userid'];
    $fieldlist = array();
    if (isset($_POST['pass'])) {
        $_password = $_POST['pass'];
        $password = hash_hmac('sha512', $_password, $auth_pepper);
        $fieldlist[] = "\"user_pass\"='$password'";
    }
    if (isset($_POST['groupid'])) {
        $groupid = $_POST['groupid'];
        $fieldlist[] = "\"user_group\"='$groupid'";
    }
    if (isset($_POST['description'])) {
        $userdescription = $_POST['description'];
        $fieldlist[] = "\"user_name_full\"='$userdescription'";
    }
    $tablename = "\"$dashboard_schema\".\"users\"";
    $query = "UPDATE $tablename SET " . implode(",", $fieldlist) . "WHERE \"user_id\"=$userid";
    $res = pg_query($dbi, $query) or die('Error: ' . pg_last_error());
    $row = pg_fetch_array($res);
}

if (isset($_POST['userdel']) && isset($_POST['userid'])) {
    $userid = $_POST['userid'];
    $tablename = "\"$dashboard_schema\".\"users\"";
    $query = "DELETE FROM $tablename WHERE \"user_id\"='$userid';";
    $res = pg_query($dbi, $query) or die('Error: ' . pg_last_error());
    $row = pg_fetch_array($res);
}

print json_encode($result);
pg_close($dbi);
?>
