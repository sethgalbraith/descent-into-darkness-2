<?php

session_start();
if (!isset($_SESSION['username'])) die ('You are not logged in.');

include('db_config.php');
include('include/query.php');

// Interpret the Request

$username = $AD_SQL->real_escape_string($_SESSION['username']);

// Query the Database

AD_call('delete_user', $username);

?>

