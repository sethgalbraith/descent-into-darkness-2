<?php

if (file_exists('db_config.php')) 
  die("Ancient & Deadly is already installed.");

include('include/users.php');


// Interpret the Request

$location = $_REQUEST['location'];
$username = $_REQUEST['username'];
$password = $_REQUEST['password'];
$database = $_REQUEST['database'];

$AD_SQL = new mysqli($location , $username , $password, $database);
if ($AD_SQL->connect_errno != 0) die('Could not connect.');


// Create the Database Schema (tables and stored procedures)

$AD_SQL->autocommit(FALSE);
if ($AD_SQL->multi_query(file_get_contents('../schema.sql'))) {
  do {
    $result = $AD_SQL->store_result();
    if ($AD_SQL->errno != 0) {
      $AD_SQL->rollback();
      die("Query failed: " . $AD_SQL->error);
    }
  } while ($AD_SQL->next_result());
  $AD_SQL->commit();
}
else {
  $AD_SQL->rollback();
  die("Query failed: " . $AD_SQL->error);
}


// Create db_config.php

file_put_contents('db_config.php',
  "<?php\n"
  . "  \$AD_SQL = new mysqli('$location', '$username', '$password', '$database');\n"
  . "?>\n");


?>

