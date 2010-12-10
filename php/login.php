<?php

session_start();

include('db_config.php');
include('include/query.php');
include('include/users.php');

// Failure for any reason results in the message "incorrect username or password"
// We return same failure result regardless of the reason for failure
// so that we don't help password crackers figure out if they got the 
// wrong password, the wrong username or the wrong argument names.

// Interpret the Request

$username = $AD_SQL->real_escape_string($_REQUEST['username']);
$password = $AD_SQL->real_escape_string($_REQUEST['password']);

// Query the Database and Generate Output

if ($rows = AD_call_silent('read_user', $username)) {
  $hash = AD_hash_password($password, $rows[0]['password_salt']);
  if (strcmp($hash, $rows[0]['password_hash']) == 0) {
    // Save session variables that only the server can modify.
    $_SESSION['username'] = $rows[0]['name'];
  }
  else {
    echo("incorrect username or password P");
  }
}
else {
  echo("incorrect username or password U");
}

?>

