<?php

session_start();
if (!isset($_SESSION['username'])) die('You are not logged in.');

include('db_config.php');
include('include/query.php');

// Interpret the Request

$username    = $AD_SQL->real_escape_string($_SESSION['username']);
$description = $AD_SQL->real_escape_string($_REQUEST['description']);
$state       = $AD_SQL->real_escape_string($_REQUEST['state']);

// Query the Database

AD_call('create_save', $username, $description, $state);

?>

