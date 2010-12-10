<?php

session_start();

include('db_config.php');
include('include/query.php');
include('include/ownership.php');

// Interpret the Request

$save_id     = $AD_SQL->real_escape_string($_REQUEST['save_id']);
$description = $AD_SQL->real_escape_string($_REQUEST['description']);
$state       = $AD_SQL->real_escape_string($_REQUEST['state']);

// Query the Database

if (AD_can_modify_save($save_id)) {
  AD_call('update_piece', $save_id, $description, $state);
}

?>
