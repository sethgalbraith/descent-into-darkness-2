<?php

session_start();
if (!isset($_SESSION['username'])) die('You are not logged in.');

include('db_config.php');
include('include/query.php');

// Interpret the Request

$username = $AD_SQL->real_escape_string($_SESSION['username']);

// Query the Database

$rows = AD_call('read_save_list', $username);

// Generate Output

include('include/xml_headers.php');
echo "<saves>\n";
for ($i = 0; $i < count($rows); $i++) {
  echo "  <save"
    . " id=\"{$rows[$i]['id']}\""
    . " username=\"" . rawurlencode($rows[$i]['username']) . "\""
    . " description=\"" . rawurlencode($rows[$i]['description']) . "\""
    . " time_stamp=\"{$rows[$i]['time_stamp']}\""
    . "/>\n";
}
echo "</saves>\n";

?>
