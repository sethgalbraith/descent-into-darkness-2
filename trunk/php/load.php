<?php

session_start();
if (!isset($_SESSION['username'])) die('You are not logged in.');

include('db_config.php');
include('include/query.php');

// Interpret the Request

$save_id = $AD_SQL->real_escape_string($_REQUEST['save_id']);

// Query the Database

$rows = AD_call('read_save', $save_id);

// Generate Output

include('include/xml_headers.php');
echo $rows[0]['state'];

?>
