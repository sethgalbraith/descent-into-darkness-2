<?php

session_start();

include('db_config.php');
include('include/query.php');
include('include/users.php');

// Interpret the Request

$username = $AD_SQL->real_escape_string($_REQUEST['username']);
$password = $AD_SQL->real_escape_string($_REQUEST['password']);

$salt = AD_random_salt();
$hash = AD_hash_password($password, $salt);

// Query the Database and Log In

AD_call('create_user', $username, $hash, $salt);

$_SESSION['username'] = $username;

?>
