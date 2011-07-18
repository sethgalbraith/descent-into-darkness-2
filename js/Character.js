Game.Character = function (xmlElement) {

  // Set default variable values.
  this.element = Game.createElement("div", {"class": "character"});
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
  this.abilities = [];

  // Get settings from the XML element.
  this.name = xmlElement.getAttribute("name");
  var abilityElements = xmlElement.getElementsByTagName('ability');
  for (var j = 0; j < abilityElements.length; j++) {
    this.abilities.push({
      'level': abilityElements[j].getAttribute('level'),
      'name': abilityElements[j].getAttribute('name'),
      'description': abilityElements[j].getAttribute('description'),
    });
  }
  this.portrait = this._loadPortrait(xmlElement);
  this.setX(parseInt(xmlElement.getAttribute("x")));
  this.setY(parseInt(xmlElement.getAttribute("y")));
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
  for (var i = 0; i < xmlElement.childNodes.length; i++) {
    var node = xmlElement.childNodes[i];
    if (node.nodeType == node.ELEMENT_NODE) {
      if (node.tagName == 'sequence') {
        var actionName = node.getAttribute("action");
        this.sequences[actionName] = {
          action: actionName,
          name: node.hasAttribute("name") ? node.getAttribute("name") : actionName,
          loop: node.hasAttribute("loop") ? node.getAttribute("loop") : "none",
          next: node.hasAttribute("next") ? node.getAttribute("next") : "stand",
          frames: [],
        };
        var frameElements = node.getElementsByTagName("frame");
        for (var j = 0; j < node.childNodes.length; j++) {
          if (node.childNodes[j].nodeType == node.ELEMENT_NODE) {
            if (node.childNodes[j].tagName == 'frame') {
              this._loadFrame(node.childNodes[j], offset, actionName);
            }
            else if (node.childNodes[j].tagName == 'effect') {
              // TODO: implement effects
            }
          }
        }
      }
    }    
  }

  this.scheduleIdleAnimation();
};

Game.Character.prototype = {

  // PRIVATE METHODS

  _loadPortrait: function (xmlElement) {
    var portraits = xmlElement.getElementsByTagName("portrait");
    if (portraits.length == 0) return Game.createElement("div");
    var opacity = portraits[0].getAttribute("opacity");
    var scale = portraits[0].getAttribute("scale");
    var url = portraits[0].textContent;
    var image = Game.loader.load(url, function () {
      if (opacity) image.style.opacity = opacity;
      if (scale)  image.width *= parseFloat(scale);
      image.style.display = 'inline';
    });
    image.style.display = 'none';
    return image;
  },

  _loadFrame: function (xmlElement, offset, action) {
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
        image = this._makeFrame(url, frameOffset, rotate, scale, opacity);
      }
      else { // Create an empty div which can be hidden or shown like an image.
        image = Game.createElement("div");
      }
      this.images[key] = image;
    }
    var durationString = xmlElement.getAttribute("duration");
    var duration = durationString ? parseInt(durationString) : 1;
    for (var i = 0; i < duration; i++) {
      this.sequences[action].frames.push(image);
    }
    this.container.appendChild(image);
  },

  _makeFrame: function (url, offset, rotate, scale, opacity) {
    var sprite = new Game.TeamSprite(url, Game.loader, function () {
      var left = offset.x + parseInt(sprite.canvas.style.marginLeft);
      var top = offset.y + parseInt(sprite.canvas.style.marginTop);
      sprite.canvas.style.marginLeft = left + "px";
      sprite.canvas.style.marginTop = top + "px";
      sprite.canvas.style.marginRight = (sprite.canvas.width - left) + "px";
      sprite.canvas.style.marginBottom = (sprite.canvas.height - top) + "px";
      sprite.setColor(255, 128, 0);
    });
    sprite.canvas.style.visibility = "hidden";
    if (opacity) {
      sprite.canvas.style.opacity = opacity;
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
      sprite.canvas.style.transform = transform;
      sprite.canvas.style.WebkitTransform = transform;
      sprite.canvas.style.MozTransform = transform;
      sprite.canvas.style.OTransform = transform;
    }
    return sprite.canvas;
  },

  _hideCurrentFrame: function () {
    if (this.sequences[this._action]) {
      this.sequences[this._action].frames[this._frame].style.visibility = "hidden";
    }
  },

  _showCurrentFrame: function () {
    if (this.sequences[this._action]) {
      this.sequences[this._action].frames[this._frame].style.visibility = "visible";
    }
  },

  // ACCESSORS

  getX: function() {return this._x;},
  setX: function(value) {
    this.element.style.left = value + "px";
    this._x = value;
  },

  getY: function() {return this._y;},
  setY: function(value) {
    this.element.style.top = value + "px";
    this._y = value;
  },

  getFacing: function() {return this._facing;},
  setFacing: function(value) {
    this.container.className = value;
    this._facing = value;
  },

  getFrame: function() {return this._frame;},
  setFrame: function(value) {
    this._hideCurrentFrame();
    // Set the frame to value only when the sequence exists
    // and the sequence contains enough frames.
    var sequence = this.sequences[this._action];
    if (sequence) {
      if (value < sequence.frames.length) {
        this._frame = value;
      }
      else if (sequence.loop == "stay") {
        this._frame = sequence.frames.length - 1;
      }
      else if (sequence.loop == "none") {
        this._frame = 0;
        this._action = sequence.next;
        this.scheduleIdleAnimation();
      }
      else if (sequence.loop == "loop") {
        this._frame = 0;
      }
    }
    this._showCurrentFrame();
  },

  getAction: function() {return this._action;},
  setAction: function(value) {
    this._hideCurrentFrame();
    this._action = value;
    // Set the frame to 0 if the sequence does not exist
    // or does not contain enough frames.
    var sequence = this.sequences[this._action];
    if (!sequence || this._frame >= sequence.frames.length) {
      this._frame = 0;
    }
    this._showCurrentFrame();
  },

  // PUBLIC METHODS

  scheduleIdleAnimation: function () {
    var range = this.idleMax - this.idleMin;
    // add 1 because this.animate() will subtract 1 as soon as we start
    this.nextIdleFrame = this.idleMin + Math.floor(range * Math.random()) + 1;
  },

  animate: function () {
    this.setFrame(this.getFrame() + 1);
    if (this.type == "shooter") {
      this.animateShooter();
    }
  /*
    else if (this.path) {
      this.setAction("move");
    }
    else if (this.getAction() == "move") {
      this.setAction("stand");
    }
  */
    else if (this.getAction() == "stand" && this.sequences["idle"]) {
      this.nextIdleFrame--;
      if (this.nextIdleFrame == 0) {
        this.setAction("idle");
        this.setFrame(0);
      }
    }
  },

  animateShooter: function () {
    switch(this.getAction()) {
    case "shoot":
      if (this.getFrame() == 0) {
        this.setAction("projectile");
        this.home = {x: this.getX(), y: this.getY()};
        this.path = {to: "target", steps: [
          {x: this.getX(), y: this.getY()},
          {x: this.getX() + this.range * 0.25, y: this.getY() - this.height * 0.75},
          {x: this.getX() + this.range * 0.50, y: this.getY() - this.height},
          {x: this.getX() + this.range * 0.75, y: this.getY() - this.height * 0.75},
          {x: this.getX() + this.range, y: this.getY()}]};
        if (this.sequences["projectile-grow"]) {
          this.setAction("projectile-grow");
        }
        else if (this.sequences["projectile"]) {
          this.setAction("projectile");
        }
        else {
          this.setAction("projectile-impact");
          this.path = null;
          this.setX(this.getX() + this.range);
        }
      }
      break;
    case "projectile-grow":
      if (this.getFrame() == 0) {
        this.setAction("projectile");
      }
      break;
    case "projectile":
      if (this.location == "target") {
        this.setAction("projectile-impact");
        this.setFrame(0);
      }
      break;
    case "projectile-impact":
      if (this.getFrame() == 0) {
        this.location = "home";
        this.setX(this.home.x);
        this.setY(this.home.y);
        this.setAction("shoot");
      }
      break;
    default:
      this.setAction("shoot");
      this.setFrame(0);
      break;
    }
  },

  moveRecursive: function (distance) {
    if (this.path) {
      var goal = this.path.steps[this.pathStep];
      var x = goal.x - this.getX();
      var y = goal.y - this.getY();
      var r = Math.sqrt(x * x + y * y);
      if (r <= distance) {
        // If you can reach the destination this frame, move to the destination,
        // and start moving toward the next step on the path.
        this.setX(goal.x);
        this.setY(goal.y);
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
        this.setX(this.getX() + distance * x / r);
        this.setY(this.getY() + distance * y / r);
        this.element.className = "character moving";
      }
      // Face right if moving right, face left if moving left, but keep facing
      // whatever direction you faced previously if moving straight up or down.
      this.setFacing((x > 0) ? "right" : (x < 0) ? "left" : this.getFacing());
    }
  },

  move: function () {this.moveRecursive(this.speed);},

}

