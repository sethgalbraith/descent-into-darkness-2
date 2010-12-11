Game.Character = function (xmlElement) {

  // Set default variable values.
  this.element = Game.createElement("div", {className:"character"});
  this.container = Game.createElement("div", {}, this.element);
  this._x = 0;
  this._y = 0;
  this._facing = "right";
  this._action = "stand";
  this._frame = 0;
  this.location = "start";
  this.path = null;
  this.pathStep = 0;
  this.sequences = {};
  this.nextIdleFrame = -1;

  // Get settings from the XML element.
  this.x = parseInt(xmlElement.getAttribute("x"));
  this.y = parseInt(xmlElement.getAttribute("y"));
  this.location = xmlElement.getAttribute("location");
  this.type = xmlElement.getAttribute("type");
  var speed = xmlElement.getAttribute("speed");
  var range = xmlElement.getAttribute("range");
  var height = xmlElement.getAttribute("height");
  var idleMin = xmlElement.getAttribute("idleMin");
  var idleMax = xmlElement.getAttribute("idleMax");
  this.speed = speed ? parseInt(speed) : 20;
  this.range = range ? parseInt(range) : 440;
  this.height = height ? parseInt(height) : 0;
  this.idleMin = idleMin ? parseInt(idleMin) : 10;
  this.idleMax = idleMax ? parseInt(idleMax) : 50;
  var xOffsetAttribute = xmlElement.getAttribute("xOffset");
  var yOffsetAttribute = xmlElement.getAttribute("yOffset");
  var offset = {
    x: (xOffsetAttribute ? parseInt(xOffsetAttribute) : 0),
    y: (yOffsetAttribute ? parseInt(yOffsetAttribute) : 0)
  }

  // Load images.
  this.images = {};
  var sequenceElements = xmlElement.getElementsByTagName("sequence");
  for (var i = 0; i < sequenceElements.length; i++) {
    var frameElements = sequenceElements[i].getElementsByTagName("frame");
    var actionName = sequenceElements[i].getAttribute("action");
    this.sequences[actionName] = [];
    for (var j = 0; j < frameElements.length; j++) {
      this._loadImage(frameElements[j], offset, actionName);
    }
  }

  this.scheduleIdleAnimation();
};

Game.Character.prototype._loadImage = function (xmlElement, offset, action) {
  var opacity = xmlElement.getAttribute("opacity");
  var rotate = xmlElement.getAttribute("rotate");
  var scale = xmlElement.getAttribute("scale");
  var url = xmlElement.textContent;
  var frameX = xmlElement.getAttribute("x");
  var frameY = xmlElement.getAttribute("y");
  var frameOffset = {
    x: offset.x + (frameX ? parseInt(frameX) : 0),
    y: offset.y + (frameY ? parseInt(frameY) : 0)
  }
  var key = [opacity, rotate, scale, url, frameX, frameY].join("\n");
  var image = this.images[key];
  if (!image) {
    if (url) { // Create a new image.
      image = this._makeImage(url, frameOffset, rotate, scale, opacity);
    }
    else { // Create an empty div which can be hidden or shown like an image.
      image = Game.createElement("div");
    }
    this.images[key] = image;
  }
  var durationString = xmlElement.getAttribute("duration");
  var duration = durationString ? parseInt(durationString) : 1;
  for (var i = 0; i < duration; i++) {
    this.sequences[action].push(image);
  }
  this.container.appendChild(image);
};

Game.Character.prototype._makeImage = function (url, offset, rotate, scale, opacity) {
  var image = Game.loader.load(url, function () {
    image.style.marginLeft = (offset.x - image.width / 2) + "px";
    image.style.marginTop = (offset.y - image.height / 2) + "px";
  });
  image.style.visibility = "hidden";
  if (opacity) {
    image.style.opacity = opacity;
  }
  var transforms = [];
  if (rotate) {
    transforms.push("rotate(" + rotate + "deg)");
  }
  if (scale) {
    transforms.push("scale(" + scale + ")");
  }
  if (transforms.length > 0) {
    var transform = transforms.join(" ");
    image.style.transform = transform;
    image.style.WebkitTransform = transform;
    image.style.MozTransform = transform;
    image.style.OTransform = transform;
  }
  return image
}

Game.Character.prototype.scheduleIdleAnimation = function () {
  var range = this.idleMax - this.idleMin;
  this.nextIdleFrame = this.idleMin + Math.floor(range * Math.random());
};

Game.Character.prototype.__defineGetter__("x", function() {return this._x;});
Game.Character.prototype.__defineSetter__("x", function(value) {
  this.element.style.left = value + "px";
  this._x = value;
});

Game.Character.prototype.__defineGetter__("y", function() {return this._y;});
Game.Character.prototype.__defineSetter__("y", function(value) {
  this.element.style.top = value + "px";
  this._y = value;
});

Game.Character.prototype.__defineGetter__("facing", function() {return this._facing;});
Game.Character.prototype.__defineSetter__("facing", function(value) {
  this.container.className = value;
  this._facing = value;
});

Game.Character.prototype.__defineGetter__("frame", function() {return this._frame;});
Game.Character.prototype.__defineSetter__("frame", function(value) {
  this._hideCurrentFrame();
  // Set the frame to 0 in case the sequence does not exist
  // or does not contain enough frames.
  this._frame = 0;
  // Set the frame to value only when the sequence exists
  // and the sequence contains enough frames.
  if (this.sequences[this._action]) {
    if (value < this.sequences[this._action].length) {
      this._frame = value;
    }
  }
  this._showCurrentFrame();
});

Game.Character.prototype.__defineGetter__("action", function() {return this._action;});
Game.Character.prototype.__defineSetter__("action", function(value) {
  this._hideCurrentFrame();
  this._action = value;
  // Set the frame to 0 if the sequence does not exist
  // or does not contain enough frames.
  if (!this.sequences[this._action]) {
    this._frame = 0;
  }
  else if (this._frame >= this.sequences[this._action].length) {
    this._frame = 0;
  }
  this._showCurrentFrame();
});

Game.Character.prototype._hideCurrentFrame = function () {
  if (this.sequences[this._action]) {
    this.sequences[this._action][this._frame].style.visibility = "hidden";
  }
};

Game.Character.prototype._showCurrentFrame = function () {
  if (this.sequences[this._action]) {
    this.sequences[this._action][this._frame].style.visibility = "visible";
  }
};

Game.Character.prototype.animate = function () {
  this.frame++;
  if (this.type == "shooter") {
    this.animateShooter();
  }
  else if (this.path) {
    this.action = "move";
  }
  else if (this.action == "move") {
    this.action = "stand";
  }
  else if (this.action == "idle" && this.frame == 0) {
    this.action = "stand";
    this.scheduleIdleAnimation();
  }
  else if (this.action == "stand" && this.sequences["idle"]) {
    this.nextIdleFrame--;
    if (this.nextIdleFrame == 0) {
      this.action = "idle";
      this.frame = 0;
    }
  }
};

Game.Character.prototype.animateShooter = function () {
  switch(this.action) {
  case "shoot":
    if (this.frame == 0) {
      this.action = "projectile";
      this.home = {x: this.x, y: this.y};
      this.path = {to: "target", steps: [
        {x: this.x, y: this.y},
        {x: this.x + this.range * 0.25, y: this.y - this.height * 0.75},
        {x: this.x + this.range * 0.50, y: this.y - this.height},
        {x: this.x + this.range * 0.75, y: this.y - this.height * 0.75},
        {x: this.x + this.range, y: this.y}]};
      if (this.sequences["projectile-grow"]) {
        this.action = "projectile-grow";
      }
      else if (this.sequences["projectile"]) {
        this.action = "projectile";
      }
      else {
        this.action = "projectile-impact";
        this.path = null;
        this.x += this.range;
      }
    }
    break;
  case "projectile-grow":
    if (this.frame == 0) {
      this.action = "projectile";
    }
    break;
  case "projectile":
    if (this.location == "target") {
      this.action = "projectile-impact";
      this.frame = 0;
    }
    break;
  case "projectile-impact":
    if (this.frame == 0) {
      this.location = "home";
      this.x = this.home.x;
      this.y = this.home.y;
      this.action = "shoot";
    }
    break;
  default:
    this.action = "shoot";
    this.frame = 0;
    break;
  }
};

Game.Character.prototype.moveRecursive = function (distance) {
  if (this.path) {
    var goal = this.path.steps[this.pathStep];
    var x = goal.x - this.x;
    var y = goal.y - this.y;
    var r = Math.sqrt(x * x + y * y);
    if (r <= distance) {
      // If you can reach the destination this frame, move to the destination,
      // and start moving toward the next step on the path.
      this.x = goal.x;
      this.y = goal.y;
      this.pathStep++;
      if (this.pathStep == this.path.steps.length) {
        // If this is the last step on the path, update my location
        // and set my path to null.
        this.location = this.path.to;
        this.path = null;
        this.pathStep = 0;
        this.element.className = "character";
      }
      else {
        // If this is not the last step on the path, keep moving.
        this.moveRecursive(distance - r)
      }
    }
    else {
      // If you cannot reach the destination this frame, move as far as you can.
      this.x += distance * x / r;
      this.y += distance * y / r;
      this.element.className = "character moving";
    }
    // Face right if moving right, face left if moving left, but keep facing
    // whatever direction you faced previously if moving straight up or down.
    this.facing = (x > 0) ? "right" : (x < 0) ? "left" : this.facing;
  }
};

Game.Character.prototype.move = function () {
  this.moveRecursive(this.speed);
};

