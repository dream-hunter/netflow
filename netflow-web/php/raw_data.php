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

$conn_str = "host=$database_hostname port=5432 dbname=$database_dbname user=$database_username password=$database_password";
$dbi = pg_connect($conn_str) OR DIE("Can't connect to database");

if (isset($_GET['tbl']) && isset($_GET['ipv4']) && isset($_GET['start']) && isset($_GET['end']) && isset($_GET['interval'])) {
    $field_sum = array("sum(\"octetDeltaCount\") as \"octetDeltaCount\"", "sum(\"packetDeltaCount\") as \"packetDeltaCount\"");
    $fieldlist = array("sourceIPv4Address", "destinationIPv4Address", "ingressInterface", "egressInterface", "sourceTransportPort", "destinationTransportPort", "protocolIdentifier", "ipClassOfService");
    $tablename_raw = "raw_" . $_GET['tbl'];
    $tablename_tmp = "tmp_" . $_GET['tbl'];
    if (isset ($_GET['groupbysrcip'])) {
        $fieldlist = array("sourceIPv4Address", "sourceTransportPort", "protocolIdentifier");
    } else if (isset ($_GET['groupbydstip'])) {
        $fieldlist = array("destinationIPv4Address", "destinationTransportPort", "protocolIdentifier");
    }
    $condition = " WHERE (";
    $condition .= "(\"unixseconds\">=" . $_GET['start'] . " AND \"unixseconds\"<=" . $_GET['end'] . ")";
    $condition .= ")";
    $query  = "SELECT '0' as \"" . implode("\", '0' as \"", $fieldlist) . "\"," . implode(",", $field_sum) . " FROM ((";
    $query .= "SELECT '0' as \"" . implode("\", '0' as \"", $fieldlist) . "\"," . implode(",", $field_sum) . " FROM $tablename_raw";
    $query .= $condition;
    $query .= ") UNION (";
    $query .= "SELECT '0' as \"" . implode("\", '0' as \"", $fieldlist) . "\"," . implode(",", $field_sum) . " FROM $tablename_tmp";
    $query .= $condition;
    $query .= ")) AS TBL;";
    $result['query'][] = $query;
    $res = pg_query($dbi, $query) or die('Error: ' . pg_last_error());
    $result['result'] = "true";
    while($r = pg_fetch_row($res)) {
        if (isset ($_GET['groupbysrcip'])) {
            $result['detail'][1][] = $r;
        } else if (isset ($_GET['groupbydstip'])) {
            $result['detail'][2][] = $r;
        } else {
            $result['detail'][0][] = $r;
        }
    }
    $condition = " WHERE (";
    $condition .= "(\"unixseconds\">=" . $_GET['start'] . " AND \"unixseconds\"<=" . $_GET['end'] . ")";
    if (isset ($_GET['srcip']) || isset ($_GET['dstip'])) {
        $condition .= " AND (";
        if (isset ($_GET['srcip'])) {
            if(strpos($_GET['srcip'], "!") !== false) {
                $condition .= "NOT \"sourceIPv4Address\" <<= inet '" . substr($_GET['srcip'], 1) . "'";
            } else {
                $condition .= "\"sourceIPv4Address\" <<= inet '" . $_GET['srcip'] . "'";
            }
        }
        if (isset ($_GET['srcip']) && isset ($_GET['dstip'])) {
            $condition .= " AND ";
        }
        if (isset ($_GET['dstip'])) {
            if(strpos($_GET['dstip'], "!") !== false) {
                $condition .= "NOT \"destinationIPv4Address\" <<= inet '" . substr($_GET['dstip'], 1) . "'";
            } else {
                $condition .= "\"destinationIPv4Address\" <<= inet '" . $_GET['dstip'] . "'";
            }
        }
        $condition .= ")";
    }
    if (isset ($_GET['iif']) || isset ($_GET['eif'])) {
        $condition .= " AND (";
        if (isset ($_GET['iif'])) {
            if(strpos($_GET['iif'], "!") !== false) {
                $condition .= "NOT \"ingressInterface\"='" . substr($_GET['iif'], 1) . "'";
            } else {
                $condition .= "\"ingressInterface\"='" . $_GET['iif'] . "'";
            }
        }
        if (isset ($_GET['iif']) && isset ($_GET['eif'])) {
            $condition .= " AND ";
        }
        if (isset ($_GET['eif'])) {
            if(strpos($_GET['eif'], "!") !== false) {
                $condition .= "NOT \"egressInterface\"='" . substr($_GET['eif'], 1) . "'";
            } else {
            $condition .= " \"egressInterface\"='" . $_GET['eif'] . "'";
            }
        }
        $condition .= ")";
    }
    $condition .= ")";

    $query  = "SELECT \"" . implode("\",\"", $fieldlist) . "\"," . implode(",", $field_sum) . " FROM ((";
    $query .= "SELECT \"" . implode("\",\"", $fieldlist) . "\"," . implode(",", $field_sum) . " FROM $tablename_raw";
    $query .= $condition;
    $query .= " GROUP BY (\"" . implode("\",\"", $fieldlist) . "\")";
    $query .= ") UNION (";
    $query .= "SELECT \"" . implode("\",\"", $fieldlist) . "\"," . implode(",", $field_sum) . " FROM $tablename_tmp";
    $query .= $condition;
    $query .= " GROUP BY (\"" . implode("\",\"", $fieldlist) . "\")";
    $query .= ")) AS TBL";
    $query .= " GROUP BY (\"" . implode("\",\"", $fieldlist) . "\")";
    $query .= " ORDER BY \"octetDeltaCount\" DESC";
    if (isset ($_GET['limit'])) {
        $query .= " LIMIT ".$_GET['limit'];
    } else {
        $query .= " LIMIT 10";
    }
    $query .= ";";
    $result['query'][] = $query;
    $res = pg_query($dbi, $query) or die('Error: ' . pg_last_error());
    $result['result'] = "true";
    while($r = pg_fetch_row($res)) {
        if (isset ($_GET['groupbysrcip'])) {
            $result['detail'][1][] = $r;
        } else if (isset ($_GET['groupbydstip'])) {
            $result['detail'][2][] = $r;
        } else {
            $result['detail'][0][] = $r;
        }
    }
}

print json_encode($result);

pg_close($dbi);
?>
