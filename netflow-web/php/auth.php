<?php
include_once './config.php';

$conn_str = "host=$database_hostname port=5432 dbname=$database_dbname user=$database_username password=$database_password";
$dbi = pg_connect($conn_str) OR DIE("Can't connect to database");
$result = array();
$user = array();
$options = [
    'cost' => 5,
];

if (isset($_GET['logout'])) {
    unset($_COOKIE['login']);
    unset($_COOKIE['token']);
    setcookie('login', '', -1, '/');
    setcookie('token', '', -1, '/');
    $result['result'] = true;
    $result['message'] = "logout succesful";
    print json_encode($result);
    pg_close($dbi);
    exit(0);
}
if (isset($_POST['login']) && isset($_POST['usr']) && isset($_POST['pass'])) {
    $_username = $_POST['usr'];
    $_password = $_POST['pass'];
    $password = hash_hmac('sha512', $_password, $auth_pepper);
    $fieldlist = array("user_id","user_name","user_pass","user_group","user_enabled");
    $tablename = "users";
    $query = "SELECT " . implode(",", $fieldlist) . " FROM $tablename WHERE user_name='". $_username ."' ORDER BY user_id;";
    $res = pg_query($dbi, $query) or die('Error: ' . pg_last_error());
    $row = pg_fetch_array($res);
    if ($row && $row['user_enabled'] == "t" && ($_password == $row['user_pass'] || $password == $row['user_pass'])) {
        $user = [
            'user_id' => $row['user_id'],
            'user_name' => $row['user_name'],
            'user_enabled' => $row['user_enabled'],
            'group_id' => $row['user_group']
        ];
        $password_hash = password_hash($password,PASSWORD_DEFAULT, $options);
        setcookie('login', $_username, 0, '/');
        setcookie('token', $password_hash, 0, '/');
    } else {
        unset($_COOKIE['login']);
        unset($_COOKIE['token']);
        setcookie('login', '', -1, '/'); 
        setcookie('token', '', -1, '/'); 
        $result['result'] = false;
        $result['message'] = "login unsuccesful";
        print json_encode($result);
        pg_close($dbi);
        exit(0);
    }
}
if (isset($_COOKIE['login']) && isset($_COOKIE['token'])) {
    $_username = $_COOKIE['login'];
    $password = $_COOKIE['token'];
    $fieldlist = array("users.user_id", "users.user_name", "users.user_pass", "users.user_group", "users.user_name_full", "users.user_email", "users.user_enabled",
                       "groups.group_name", "groups.group_enabled", "groups.group_reader", "groups.group_writer", "groups.group_admin");
    $tablename = "users";
    $query = "SELECT " . implode(",", $fieldlist) . " FROM $tablename JOIN groups ON groups.group_id = users.user_group WHERE users.user_name='". $_username ."' ORDER BY users.user_id;";
    $res = pg_query($dbi, $query) or die('Error: ' . pg_last_error());
    $row = pg_fetch_array($res);
    if ($row && $row['user_enabled'] == "t" && (password_verify($row['user_pass'],$password) || password_verify(hash_hmac('sha512', $row['user_pass'], $auth_pepper), $password))) {
        $user = [
            'user_id' => $row['user_id'],
            'user_name' => $row['user_name'],
            'user_enabled' => $row['user_enabled'],
            'group_id' => $row['user_group'],
            'group_name' => $row['group_name'],
            'group_reader' => $row['group_reader'],
            'group_writer' => $row['group_writer'],
            'group_admin' => $row['group_admin'],
            'group_enabled' => $row['group_enabled']
        ];
        if (isset($_GET['login'])) {
            $result['result'] = true;
            $result['message'] = "auth succesful";
            $result['user'] = $user;
            print json_encode($result);
        }
    } else {
        unset($_COOKIE['login']);
        unset($_COOKIE['token']);
        setcookie('login', '', -1, '/'); 
        setcookie('token', '', -1, '/'); 
        $result['result'] = false;
        $result['message'] = "auth unsuccesful";
        print json_encode($result);
        pg_close($dbi);
        exit(0);
    }
} else {
    $result['result'] = false;
    print json_encode($result);
    pg_close($dbi);
    exit(0);
}

pg_close($dbi);
?>
