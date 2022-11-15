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

$data_interval = 300; #seconds
$sampling = 1;
if (isset($_GET['sampling']) && $_GET['sampling'] != 0) {
    $sampling = $_GET['sampling'];
}

if (isset($_GET['ipv4sessions']) && isset($_GET['tbl']) && isset($_GET['start']) && isset($_GET['end'])) {
    $tablename = "\"$analyzer_schema\".\"raw_" . $_GET['tbl'] . "\"";
    $field_sum = array("sum(\"octetDeltaCount\") as \"octetDeltaCount\"", "sum(\"packetDeltaCount\") as \"packetDeltaCount\"");
    $fieldlist = array("sourceIPv4Address", "destinationIPv4Address", "sourceTransportPort", "destinationTransportPort", "protocolIdentifier");
#Forming up required conditions
    $condition = "(\"egressInterface\" > 0 AND \"ingressInterface\" > 0) AND (\"unixseconds\">=" . $_GET['start'] . " AND \"unixseconds\"<=" . $_GET['end'] . ")";
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
#Forming up top hosts count
    $limit = 10;
    if (isset ($_GET['limit'])) {
        $limit = $_GET['limit'];
    }
#Calculate total traffic
    $query  = "SELECT " . implode(", ", $field_sum) . " FROM $tablename";
    $query .= " WHERE $condition;";
    $res = pg_query($dbi, $query) or die('Error: ' . pg_last_error());
    $r = pg_fetch_row($res);
    $r[0] *= $sampling;
    $r[1] *= $sampling;
    $result['data']['total'][] = $r;
#Calculating total traffic for top hosts
    $query  = "SELECT \"" . implode("\", \"", $fieldlist) . "\", " . implode(", ", $field_sum) . " FROM $tablename";
    $query .= " WHERE $condition";
    $query .= " GROUP BY (\"" . implode("\",\"", $fieldlist) . "\") ORDER BY \"octetDeltaCount\" DESC LIMIT $limit;";
#    echo $query;
    $res = pg_query($dbi, $query) or die('Error: ' . pg_last_error());
    while($r = pg_fetch_row($res)) {
        $r[5] *= $sampling;
        $r[6] *= $sampling;
        $result['data']['totalhosts'][] = $r;
    }
    $field_sum = array("sum(\"octetDeltaCount\") as \"octetDeltaCount\"");
#Calculating chart data for all hosts
    $query  = "SELECT \"unixseconds\", " . implode(", ", $field_sum) . " FROM $tablename";
    $query .= " WHERE $condition";
    $query .= " GROUP BY (\"unixseconds\") ORDER BY \"unixseconds\" ASC;";
    $res = pg_query($dbi, $query) or die('Error: ' . pg_last_error());
    $trace = array();
    $trace['name'] = "0(0) -> 0(0) Proto(all)";
    $trace['stackgroup'] = "one";
    while($r = pg_fetch_row($res)) {
        $r[1] *= $sampling;
        $trace['x'][] = date("Y-m-d H:i:s", $r[0]);
        $trace['y'][] = $r[1]*8/$data_interval;
    }
    $result['data']['traces'][] = $trace;
#Calculating charts data for top hosts
    foreach($result['data']['totalhosts'] as $host) {
        $query  = "SELECT \"unixseconds\", " . implode(", ", $field_sum) . " FROM $tablename";
        $query .= " WHERE $condition";
        $query .= " AND \"sourceIPv4Address\"='$host[0]' AND \"destinationIPv4Address\"='$host[1]' AND \"sourceTransportPort\"='$host[2]' AND \"destinationTransportPort\"='$host[3]' AND \"protocolIdentifier\"='$host[4]'";
        $query .= " GROUP BY (\"unixseconds\") ORDER BY \"unixseconds\" ASC;";
        $res = pg_query($dbi, $query) or die('Error: ' . pg_last_error());
        $trace = array();
        $trace['name'] = "$host[0]($host[2]) -> $host[1]($host[3]) Proto($host[4])";
        $trace['stackgroup'] = "two";
        while($r = pg_fetch_row($res)) {
            $r[1] *= $sampling;
            $trace['x'][] = date("Y-m-d H:i:s", $r[0]);
            $trace['y'][] = $r[1]*8/$data_interval;
        }
        $result['data']['traces'][] = $trace;
    }
}

if (isset($_GET['ipv4sources']) && isset($_GET['tbl']) && isset($_GET['start']) && isset($_GET['end'])) {
    $tablename = "\"$analyzer_schema\".\"raw_" . $_GET['tbl'] . "\"";
    $field_sum = array("sum(\"octetDeltaCount\") as \"octetDeltaCount\"", "sum(\"packetDeltaCount\") as \"packetDeltaCount\"");
    $fieldlist = array("sourceIPv4Address", "sourceTransportPort", "protocolIdentifier");
#Forming up required conditions
    $condition = "(\"unixseconds\">=" . $_GET['start'] . " AND \"unixseconds\"<=" . $_GET['end'] . ")";
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
#Forming up top hosts count
    $limit = 10;
    if (isset ($_GET['limit'])) {
        $limit = $_GET['limit'];
    }
#Calculate total traffic
    $query  = "SELECT " . implode(", ", $field_sum) . " FROM $tablename";
    $query .= " WHERE $condition;";
    $res = pg_query($dbi, $query) or die('Error: ' . pg_last_error());
#    $result['data']['total'][] = pg_fetch_row($res);
    $r = pg_fetch_row($res);
    $r[0] *= $sampling;
    $r[1] *= $sampling;
    $result['data']['total'][] = $r;

#Calculating total traffic for top hosts
    $query  = "SELECT \"" . implode("\", \"", $fieldlist) . "\", " . implode(", ", $field_sum) . " FROM $tablename";
    $query .= " WHERE $condition";
    $query .= " GROUP BY (\"" . implode("\",\"", $fieldlist) . "\") ORDER BY \"octetDeltaCount\" DESC LIMIT $limit;";
    $res = pg_query($dbi, $query) or die('Error: ' . pg_last_error());
    while($r = pg_fetch_row($res)) {
        $r[3]*= $sampling;
        $r[4]*= $sampling;
        $result['data']['totalsources'][] = $r;
    }
    $field_sum = array("sum(\"octetDeltaCount\") as \"octetDeltaCount\"");
#Calculating chart data for all hosts
    $query  = "SELECT \"unixseconds\", " . implode(", ", $field_sum) . " FROM $tablename";
    $query .= " WHERE $condition";
    $query .= " GROUP BY (\"unixseconds\") ORDER BY \"unixseconds\" ASC;";
    $res = pg_query($dbi, $query) or die('Error: ' . pg_last_error());
    $trace = array();
    $trace['name'] = "0(0) -> 0(0) Proto(all)";
    $trace['stackgroup'] = "one";
    while($r = pg_fetch_row($res)) {
        $r[1] *= $sampling;
        $trace['x'][] = date("Y-m-d H:i:s", $r[0]);
        $trace['y'][] = $r[1]*8/$data_interval;
    }
    $result['data']['traces'][] = $trace;
#Calculating charts data for top hosts
    foreach($result['data']['totalsources'] as $host) {
        $query  = "SELECT \"unixseconds\", " . implode(", ", $field_sum) . " FROM $tablename";
        $query .= " WHERE $condition";
        $query .= " AND \"sourceIPv4Address\"='$host[0]' AND \"sourceTransportPort\"='$host[1]' AND \"protocolIdentifier\"='$host[2]'";
        $query .= " GROUP BY (\"unixseconds\") ORDER BY \"unixseconds\" ASC;";
        $res = pg_query($dbi, $query) or die('Error: ' . pg_last_error());
        $trace = array();
        $trace['name'] = "$host[0]($host[1]) Proto($host[2])";
        $trace['stackgroup'] = "two";
        while($r = pg_fetch_row($res)) {
            $r[1] *= $sampling;
            $trace['x'][] = date("Y-m-d H:i:s", $r[0]);
            $trace['y'][] = $r[1]*8/$data_interval;
        }
        $result['data']['traces'][] = $trace;
    }
}

if (isset($_GET['ipv4destinations']) && isset($_GET['tbl']) && isset($_GET['start']) && isset($_GET['end'])) {
    $tablename = "\"$analyzer_schema\".\"raw_" . $_GET['tbl'] . "\"";
    $field_sum = array("sum(\"octetDeltaCount\") as \"octetDeltaCount\"", "sum(\"packetDeltaCount\") as \"packetDeltaCount\"");
    $fieldlist = array("destinationIPv4Address", "destinationTransportPort", "protocolIdentifier");
#Forming up required conditions
    $condition = "(\"unixseconds\">=" . $_GET['start'] . " AND \"unixseconds\"<=" . $_GET['end'] . ")";
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
#Forming up top hosts count
    $limit = 10;
    if (isset ($_GET['limit'])) {
        $limit = $_GET['limit'];
    }
#Calculate total traffic
    $query  = "SELECT " . implode(", ", $field_sum) . " FROM $tablename";
    $query .= " WHERE $condition;";
    $res = pg_query($dbi, $query) or die('Error: ' . pg_last_error());
#    $result['data']['total'][] = pg_fetch_row($res);
    $r = pg_fetch_row($res);
    $r[0] *= $sampling;
    $r[1] *= $sampling;
    $result['data']['total'][] = $r;

#Calculating total traffic for top hosts
    $query  = "SELECT \"" . implode("\", \"", $fieldlist) . "\", " . implode(", ", $field_sum) . " FROM $tablename";
    $query .= " WHERE $condition";
    $query .= " GROUP BY (\"" . implode("\",\"", $fieldlist) . "\") ORDER BY \"octetDeltaCount\" DESC LIMIT $limit;";
    $res = pg_query($dbi, $query) or die('Error: ' . pg_last_error());
    while($r = pg_fetch_row($res)) {
        $r[3]*= $sampling;
        $r[4]*= $sampling;
        $result['data']['totaldestinations'][] = $r;
    }
    $field_sum = array("sum(\"octetDeltaCount\") as \"octetDeltaCount\"");
#Calculating chart data for all hosts
    $query  = "SELECT \"unixseconds\", " . implode(", ", $field_sum) . " FROM $tablename";
    $query .= " WHERE $condition";
    $query .= " GROUP BY (\"unixseconds\") ORDER BY \"unixseconds\" ASC;";
    $res = pg_query($dbi, $query) or die('Error: ' . pg_last_error());
    $trace = array();
    $trace['name'] = "0(0) -> 0(0) Proto(all)";
    $trace['stackgroup'] = "one";
    while($r = pg_fetch_row($res)) {
        $r[1] *= $sampling;
        $trace['x'][] = date("Y-m-d H:i:s", $r[0]);
        $trace['y'][] = $r[1]*8/$data_interval;
    }
    $result['data']['traces'][] = $trace;
#Calculating charts data for top hosts
    foreach($result['data']['totaldestinations'] as $host) {
        $query  = "SELECT \"unixseconds\", " . implode(", ", $field_sum) . " FROM $tablename";
        $query .= " WHERE $condition";
        $query .= " AND \"destinationIPv4Address\"='$host[0]' AND \"destinationTransportPort\"='$host[1]' AND \"protocolIdentifier\"='$host[2]'";
        $query .= " GROUP BY (\"unixseconds\") ORDER BY \"unixseconds\" ASC;";
        $res = pg_query($dbi, $query) or die('Error: ' . pg_last_error());
        $trace = array();
        $trace['name'] = "$host[0]($host[1]) Proto($host[2])";
        $trace['stackgroup'] = "two";
        while($r = pg_fetch_row($res)) {
            $r[1] *= $sampling;
            $trace['x'][] = date("Y-m-d H:i:s", $r[0]);
            $trace['y'][] = $r[1]*8/$data_interval;
        }
        $result['data']['traces'][] = $trace;
    }
}


print json_encode($result);

pg_close($dbi);
?>
