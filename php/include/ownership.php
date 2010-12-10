<?

// this should do nothing if these scripts have already been included.
include_once('db_config.php');
include_once('include/query.php');

// Returns TRUE if this user has permission to modify the save.
// Returns FALSE if this user does not have permission to modify the save.
// A FALSE result could also mean an SQL error or bad save id.
function AD_can_modify_save($image_id) {
  global $AD_SQL;  

  // you must be logged in to modify saves
  if (!isset($_SESSION['username'])) return FALSE;

  // users can only update saves they own
  $username = $AD_SQL->real_escape_string($_SESSION['username']);
  if ($rows = AD_call_silent('read_save', $save_id)) {
    return strcmp($username, $rows[0]['username']) == 0;
  }
  // a FALSE result could also mean an SQL error or bad save id
  return FALSE;
}

?>
