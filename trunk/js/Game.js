// Game is a singleton object - meaning there is only one Game object.
// We create Game using literal object notation. For example we can create
// an object named point with x and y properties using the literal notation:
// var point = {x: 3, y: 10};

var Game = {

  // GAME STATE

  mode: "map",
  currentSlide: [],
  encounters: [],
  currentEncounter: null,
  turn: 0,
  selectedAction: null,
  selectedTargets: [],
  maps: [],
  currentMap: null,
  animationInterval: null,
  movementInterval: null,

  // Game.paths is an array containing Game.Path objects
  // which are created in Game.extractXMLPaths().
  // TODO: replace Game.paths with Game.currentMap.paths.
  paths: [],

  // Game.characters is an array containing Game.Character objects
  // which are created in Game.extractXMLCharacters().
  characters: [],

  // Game.party contains all of the Game.Character objects from
  // Game.characters whose <character> element had the attribute type="PC"
  // TODO: add the ability to recruit PCs into the party.
  party: [],

  // Game.loader is a Game.ImageLoader object created in an anonymous function
  // within Game.loadMap() after the map XML file is done loading.
  // Game.loader is used to load the map background and character images.
  loader: null, 

  // FUNCTIONS

  /**
   * Create a new HTML element.
   *
   * @param tagName the type of element to create, like "div" or "li".
   * @param attributes (optional) an object whose variables will become
   *                              attributes of the element.
   * @param parent (optional) the new element will be inserted as a child
   *                          element of this parent element.
   * 
   * @return the new element.
   */
  createElement: function (tagName, attributes, parentElement) {
    var newElement = document.createElement(tagName);
    for (attributeName in attributes) {
       newElement.setAttribute(attributeName, attributes[attributeName]);
    }
    if (parentElement) {
      parentElement.appendChild(newElement);
    }
    return newElement;
  },

  /**
   * Make an asynchronous HTTP request using the POST method.
   * 
   * @param url the address to request from the server.
   * @param arguments (optional) an object whose variables will be sent as
   *                             arguments to the HTTP request, as if they were
   *                             data submitted through an HTML form,
   *                             or a string to be sent as the request body.
   * @param callback (optional) call this function when the complete response
   *                            has been returned from the server.
   * 
   * @return an XMLHttpRequest object containing the response.
   * 
   * If you want to provide a callback but no arguments, use an empty object
   * (empty curly brackets: {}) as the second parameter to this function.
   */ 
  ajaxRequest: function (url, arguments, callback) {
    var body = "";
    // if arguments is a string, send it as the request body
    if (typeof (arguments) == "string") {
      body = arguments;
    }
    // if arguments is an object, combine its variables into a string
    else if (typeof (arguments) == "object") {
      var argumentList = [];
      for (var argumentName in arguments) {
        var argumentValue = encodeURIComponent(arguments[argumentName]);
        argumentList.push(argumentName + "=" + argumentValue);
      }
      body = argumentList.join("&");
    }
    // create and send the ajax request
    var ajax = new XMLHttpRequest();
    ajax.onreadystatechange = function () {
      if (ajax.readyState == 4) callback(ajax);
    };
    ajax.open("POST", url, true);
    ajax.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
    ajax.setRequestHeader("Content-length", body.length);
    ajax.setRequestHeader("Connection", "close");
    ajax.send(body);
  },

  /**
   * Simulate a twenty-sided die roll.
   * @return a random whole number from 1 to 20.
   */ 
  dieRoll: function () {
    return Math.floor(20 * Math.random());
  },

  /**
   * Add a stylesheet to a document.
   * @param doc the document.
   * @param href the address of the stylesheet.
   */ 
  addStylesheet: function(doc, href) {
    var link = doc.createElement("link");
    link.rel = "stylesheet"
    link.type = "text/css"
    link.href = href;
    doc.getElementsByTagName("head")[0].appendChild(link);
  },

  /**
   * Load the campaign XML file.
   * @param campaignFile the address of the campaign XML file.
   */ 
  loadCampaign: function (campaignFile) {
    Game.ajaxRequest(campaignFile, {}, function (ajax) {
      // Load any campaign-specific stylesheets.
      var stylesheets = ajax.responseXML.getElementsByTagName("stylesheet");
      for (var i = 0; i < stylesheets.length; i++) {
        Game.addStylesheet(document, stylesheets[i].textContent);
      }
      // Load one of the maps.
      var maps = ajax.responseXML.getElementsByTagName("map");
      var map = maps[0]; // Load the first map by default
      if (Game.arguments.map) {
        for (var i = 0; i < maps.length; i++) {
          // If the page has a "map" argument, load that map.
          if (maps[i].getAttribute("name") == Game.arguments.map) {
            map = maps[i];
          }
        }
      }
      Game.loadMap(map.getAttribute("src"));
    });
  },


  /**
   * Load the map file, then load the character and background images,
   * and then start the game after all of the images have been loaded.
   * @param mapFile the address of the XML map file.
   */ 
  loadMap: function (mapFile) {
    Game.ajaxRequest(mapFile, {}, function (ajax) {
      Game.loader = new Game.ImageLoader(function () {
        // Change the document to match the background.
        document.body.style.backgroundImage = "url(" + background.src + ")";
        document.body.style.width = background.width + "px";
        document.body.style.height = background.height + "px";
        document.body.style.margin = "0";
        // Attach character elements to document.
        for (var i = 0; i < Game.characters.length; i++) {
          document.body.appendChild(Game.characters[i].element);
        }
        // Start character animation and movement.
        Game.resume();

      });
      var mapElement = ajax.responseXML.documentElement;
      var backgroundImage = mapElement.getAttribute("background");
      var background = Game.loader.load(backgroundImage);
      Game.extractXMLPaths(mapElement);
      Game.extractXMLCharacters(mapElement);
      Game.extractXMLText(mapElement);
      Game.createMovementButtons(Game.party[0]);
    });
  },

  /**
   * Create a Game.Character object for each <character> element in the map.
   * @param mapElement the top level element of an XML map.
   */ 
  extractXMLCharacters: function (mapElement) {
    Game.characters = [];
    var characterElements = mapElement.getElementsByTagName("character");
    for (var i = 0; i < characterElements.length; i++) {
      var character = new Game.Character(characterElements[i]);
      Game.characters.push(character);
      if (character.type == "PC") {
        Game.party.push(character);
      }
    }
  },

  /**
   * Create a Game.Path object for each <path> element in the map.
   * @param mapElement the top level element of an XML map.
   */ 
  extractXMLPaths: function (mapElement) {
    Game.paths = {};
    var pathElements = mapElement.getElementsByTagName("path");
    for (var i = 0; i < pathElements.length; i++) {
      var path = new Game.Path(pathElements[i]);
      // Make sure that Game.paths has a variable named for the path origin,
      // and that the value of the variable is an object. This object can have
      // up to four variables: one named after each direction.
      if (!Game.paths[path.from]) {
        Game.paths[path.from] = {};
      }
      // Make the path the official path in this direction from that origin.
      Game.paths[path.from][path.direction] = path;
    }
  },

  /**
   * Create a div for each <text> element in the map.
   * @param mapElement the top level element of an XML map.
   */ 
  extractXMLText: function (mapElement) {
    var textElements = mapElement.getElementsByTagName("text");
    for (var i = 0; i < textElements.length; i++) {
      var dialog = Game.createElement("div", {className: "dialog"}, document.body);
      var x = textElements[i].getAttribute("x");
      var y = textElements[i].getAttribute("y");
      var width = textElements[i].getAttribute("width");
      var height = textElements[i].getAttribute("height");
      if (x) dialog.style.left = x + "px";
      if (y) dialog.style.top = y + "px";
      if (width) dialog.style.width = width + "px";
      if (height) dialog.style.height = height + "px";
      var text = Game.createElement("div", {className: "text"}, dialog);
      text.innerText = textElements[i].textContent;
    }
  },

  /**
   * Pause the game.
   */ 
  pause: function () {
    Game.stopMovement();
    Game.stopAnimation();
  },

  /**
   * Start the game after loading a map,
   * or resume the game when it has been paused.
   */ 
  resume: function () {
    Game.startMovement();
    Game.startAnimation();
  },

  /**
   * Animate characters.
   * This function is called for each animation frame (100ms/10fps.)
   */ 
  animateCharacters: function () {
    for (var i = 0; i < Game.characters.length; i++) {
      Game.characters[i].animate();
    }
  },

  /**
   * Start character animation after loading a map,
   * or resume the animation after pausing the game.		
   */ 
  startAnimation: function () {
    if (Game.animationInterval == null) {
      Game.animationInterval = setInterval(Game.animateCharacters, 100);
    }
  },

  /**
   * Stop character animation when you pause the game.
   */ 
  stopAnimation: function () {
    if (Game.animationInterval != null) {
      clearInterval(Game.animationInterval);
      Game.animationInterval = null;
    }
  },

  /**
   * Move characters who are moving, and scroll the map
   * so that it remains centered around the PC.
   * This function is called for each movement frame (50ms/20fps.)
   */ 
  moveCharacters: function () {
    for (var i = 0; i < Game.characters.length; i++) {
      Game.characters[i].move();
    }
    document.body.scrollLeft = Game.party[0].getX() - innerWidth / 2;
    document.body.scrollTop = Game.party[0].getY() - innerHeight / 2;
    Game.showHideMovementButtons(Game.party[0]);
    Game.measurePerformance();
  },

  measurePerformance: function () {
    Game.fpsQueue.shift();
    Game.fpsQueue.push((new Date()).getTime());
    var total = Game.fpsQueue[Game.fpsQueue.length - 1] - Game.fpsQueue[0];
    var hertz = 1000 * Game.fpsQueue.length / total;
    Game.fpsMeter.innerText = Math.round(hertz) + " FPS";
  },

  /**
   * Start character movement after loading a map,
   * or resume the movement after pausing the game.
   */ 
  startMovement: function () {
    if (Game.movementInterval == null) {
      Game.movementInterval = setInterval(Game.moveCharacters, 50);
    }
  },

  /**
   * Stop character movement when you pause the game.
   */ 
  stopMovement: function () {
    if (Game.movementInterval != null) {
      clearInterval(Game.movementInterval);
      Game.movementInterval = null;
    }
  },

  /**
   * 
   */ 
  createPlayerCharacters: function () {
  },
  
  /**
   * 
   */ 
  beginCampaign: function () {
  },
  
  /**
   * 
   */ 
  saveGame: function () {
  },
  
  /**
   * 
   */ 
  listSavedGames: function () {
  },
  
  /**
   * 
   */ 
  loadGame: function () {
  },
  
  /**
   * 
   */ 
  deleteSavedGame: function () {
  },
  
  /**
   * 
   */ 
  createUser: function (username, password) {
  },
  
  /**
   * 
   */ 
  login: function (username, password) {
    Game.setUserForm("loggedInUserForm");
  },
  
  /**
   * 
   */ 
  logout: function () {
    Game.setUserForm("defaultUserForm");
  },

  /**
   * 
   */ 
  changePassword: function (oldPassword, newPassword) {
  },
  
  /**
   * 
   */ 
  deleteUser: function () {
  },

  /**
   * Change which user account form is visible.
   * @param formId the id attribute of the form that should be visible.
   */ 
  setUserForm: function (formId) {
    var node = Game.userForm.firstChild;
    while (node) {
      if (node.nodeType == document.ELEMENT_NODE) {
        node.style.display = "none";
      }
      node = node.nextSibling;
    }
    document.getElementById(formId).style.display = "inline";
  },

  /**
   * Attach event listeners to the user account forms.
   */ 
  initializeUserForm: function () {
    // hide everything but the default account management menu features
    Game.setUserForm("defaultUserForm");

    // attach event handlers to the account management menu buttons

    // default mode (not logged in) buttons: log in, register
    document.getElementById("showLogin").onclick = function () {
      Game.setUserForm("loginUserForm");};
    document.getElementById("showRegister").onclick = function () {
      Game.setUserForm("registerUserForm");};

    // login mode buttons: log in, cancel
    document.getElementById("login").onclick = function () {
      var username = document.getElementById("loginUserName").value;
      var password = document.getElementById("loginPassword").value;
      Game.login(username, password);
    };
    document.getElementById("cancelLogin").onclick = function () {
      Game.setUserForm("defaultUserForm");};

    // register mode buttons: register, cancel
    document.getElementById("register").onclick = function () {
      var username = document.getElementById("registerUserName").value;
      var password = document.getElementById("registerPassword").value;
      var retype = document.getElementById("registerRetype").value;
      if (password != retype) alert("The passwords you typed do not match.");
      else Game.createUser(username, password);
    };
    document.getElementById("cancelRegister").onclick = function () {
      Game.setUserForm("defaultUserForm");};

    // logged in mode buttons: log out, account options
    document.getElementById("logout").onclick = function () {
      Game.logout();};
    document.getElementById("showAccountOptions").onclick = function () {
      Game.setUserForm("optionsUserForm");};

    // account options mode buttons: change password, delete user, cancel
    document.getElementById("showChangePassword").onclick = function () {
      Game.setUserForm("passwordUserForm");};
    document.getElementById("showDeleteUser").onclick = function () {
      Game.setUserForm("deleteUserForm");};
    document.getElementById("cancelAccountOptions").onclick = function () {
      Game.setUserForm("loggedInUserForm");};

    // change password mode buttons: change password, cancel
    document.getElementById("changePassword").onclick = function () {
      var oldPassword = document.getElementById("passwordOld").value;
      var newPassword = document.getElementById("passwordNew").value;
      var retype = document.getElementById("passwordRetype").value;
      if (newPassword != retype) alert("The new passwords you typed do not match.");
      else Game.createUser(oldPassword, newPassword);
    };
    document.getElementById("cancelChangePassword").onclick = function () {
      Game.setUserForm("optionsUserForm");};

    // delete user mode buttons: delete user, cancel
    document.getElementById("deleteUser").onclick = function () {
      Game.deleteUser();};
    document.getElementById("cancelDeleteUser").onclick = function () {
      Game.setUserForm("optionsUserForm");};
  },

  /**
   * Start the PC moving in the selected direction.
   * @param direction "north", "east", "south" or "west".
   */ 
  choosePath: function (direction) {
    var pc = Game.party[0];
    if (!pc.path) {
      var path = Game.paths[pc.location][direction]
      if (path) {
        pc.path = path;
        pc.pathStep = 0;
      }
    }
  },

  /**
   * Create direction buttons to control character movement.
   * @param character the PC who moves around on the map.
   */ 
  createMovementButtons: function (character) {
    var up = Game.createElement("div", {id:"up"}, character.container);
    var down = Game.createElement("div", {id:"down"}, character.container);
    var left = Game.createElement("div", {id:"left"}, character.container);
    var right = Game.createElement("div", {id:"right"}, character.container);
    up.onmousedown = function () {Game.choosePath("north");};
    down.onmousedown = function () {Game.choosePath("south");};
    left.onmousedown = function () {Game.choosePath("west");};
    right.onmousedown = function () {Game.choosePath("east");};
  },

  /**
   * Decide which movement buttons to show.
   * @param character the PC who moves around on the map.
   */ 
  showHideMovementButtons: function (character) {
    // Get the buttons for each direction.
    var up = document.getElementById("up");
    var down = document.getElementById("down");
    var left = document.getElementById("left");
    var right = document.getElementById("right");
    // Hide all of the buttons if the character is already moving along a path.
    if (character.path) {
      up.style.display = "none";
      down.style.display = "none";
      left.style.display = "none";
      right.style.display = "none";
    }
    // Show some of the buttons if the location has direction options.
    else {
      var paths = Game.paths[character.location];
      up.style.display = paths["north"] ? "" : "none";
      down.style.display = paths["south"] ? "" : "none";
      left.style.display = paths["west"] ? "" : "none";
      right.style.display = paths["east"] ? "" : "none";
    }
  },

  /**
   * Respond to key presses.
   * @param e the keydown event.
   */ 
  keyDown: function (e) {
    // In some browsers an event is not provided automatically,
    // so we fall back to window.event.
    if (!e) e = window.event;
    // 37 through 40 are the codes for the arrow keys.
    var keyMap = {37: "west", 38: "north", 39: "east", 40: "south"};
    var direction = keyMap[e.keyCode];
    if (direction) {
      Game.choosePath(direction);
      e.preventDefault(); // Don't scroll when you press a direction key.
    }
  },
};

// Attach a function to the window's "load" event, so that it will be called
// when the page is done loading. This is similar to onload = function () {...};
// except that addEventListener allows us to attach as many handlers as we want
// to the same event.

addEventListener('load', function () {

  // Variables that point to elements of the user interface.
  Game.userForm = document.getElementById("userForm");
  Game.menu = Game.createElement("div", {'class': "menu"}, Game.frame);

  // Initialize account management menu.
  Game.initializeUserForm();

  // Parse URL arguments.
  Game.arguments = {};
  var args = parent.location.search.slice(1).split("&");
  for (var i = 0; i < args.length; i++) {
    var components = args[0].split("=");
    var key = decodeURIComponent(components[0]);
    var value = decodeURIComponent(components[1]);
    Game.arguments[key] = value;
  }

  // Load the first campaign in the campaign list.
  Game.ajaxRequest("game.xml", {}, function (ajax) {
    var campaigns = ajax.responseXML.getElementsByTagName("campaign");
    var campaign = campaigns[0];
    document.title = campaign.getAttribute("name");
    Game.loadCampaign(campaign.getAttribute("src"));
  });

  // Listen for keyboard events in the main window and game frame.
  addEventListener("keydown", Game.keyDown, false);
  if (window != parent) {
    parent.addEventListener("keydown", Game.keyDown, false);
  }

  // Disable dragging and selecting images.
  onmousedown = function (e) {
    // Firefox provides the event as a parameter,
    // but other browsers use the global event variable.
    if (!e) {
      e = event;
    }
    // Ignore the mouse down event if this is not an input element.
    if (e.target.tagName != "INPUT") {
      // Returning false prevents the default behavior.
      return false;
    }
  };
//  onselectstart = function () {return false;};

/*
  // pause the game when the window loses focus
  addEventListener("blur", Game.pause, false);
  addEventListener("focus", Game.resume, false);
//  Game.frame.contentWindow.addEventListener("blur", Game.pause, false);
//  Game.frame.contentWindow.addEventListener("focus", Game.resume, false);
*/

  // create frames-per-second meter
  Game.fpsMeter = Game.createElement("div", {'class': "fps"}, document.body);
  Game.fpsQueue = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0];

}, true);

  

