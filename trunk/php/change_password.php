<?php

session_start();
if (!isset($_SESSION['username'])) die('You are not logged in.');

include('db_config.php');
include('include/query.php');
include('include/users.php');

// Interpret the Request

$username = $AD_SQL->real_escape_string($_SESSION['username']);
$password = $AD_SQL->real_escape_string($_REQUEST['password']);

$salt = AD_random_salt();
$hash = AD_hash_password($password, $salt);

// Query the Database

AD_call('update_user', $username, $hash, $salt);

?>
