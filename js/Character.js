Game.Character = function (xml) {

  // Set default variable values.
  this.element = Game.createElement("div", {"class": "character"});
  this.container = Game.createElement("div", {}, this.element);
  this._x = 0;
  this._y = 0;
  this._facing = "right";
  this._action = "stand";
  this._frame = 0;
  this._visible = true;
  this.location = "start";
  this.path = null;
  this.pathStep = 0;
  this.sequences = {};
  this.nextIdleFrame = -1;
  this.abilities = [];
  this.portraits = [];

  // Get settings from the XML element.
  this.name = xml.getAttribute("name");
  this.setX(parseInt(xml.getAttribute("x")));
  this.setY(parseInt(xml.getAttribute("y")));
  this.location = xml.getAttribute("location");
  this.type = xml.getAttribute("type");
  this.speed = xml.hasAttribute("speed") ? parseInt(xml.getAttribute("speed")) : 20;
  this.range = xml.hasAttribute("range") ? parseInt(xml.getAttribute("range")) : 440;
  this.height = xml.hasAttribute("height") ? parseInt(xml.getAttribute("height")) : 0;
  this.idleMin = xml.hasAttribute("idleMin") ? parseInt(xml.getAttribute("idleMin")) : 10;
  this.idleMax = xml.hasAttribute("idleMax") ? parseInt(xml.getAttribute("idleMax")) : 50;
  var offset = {
    x: (xml.hasAttribute("xOffset") ? parseInt(xml.getAttribute("xOffset")) : 0),
    y: (xml.hasAttribute("yOffset") ? parseInt(xml.getAttribute("yOffset")) : 0)
  }

  var portraitElements = xml.getElementsByTagName("portrait");
  for (var i = 0; i < portraitElements.length; i++) {
    this._loadPortrait(portraitElements[i]);
  }

  var abilityElements = xml.getElementsByTagName('ability');
  for (var j = 0; j < abilityElements.length; j++) {
    this.abilities.push({
      'level': abilityElements[j].getAttribute('level'),
      'name': abilityElements[j].getAttribute('name'),
      'description': abilityElements[j].getAttribute('description'),
    });
  }

  // Load images.
  this.images = {};
  var sequences = xml.getElementsByTagName("sequence");
  for (var i = 0; i < sequences.length; i++) {
    var actionName = sequences[i].getAttribute("action");
//if (this.sequences[actionName]) {alert(this.name); return;}
    this.sequences[actionName] = {
      action: actionName,
      name: sequences[i].hasAttribute("name") ? sequences[i].getAttribute("name") : actionName,
      loop: sequences[i].hasAttribute("loop") ? sequences[i].getAttribute("loop") : "none",
      next: sequences[i].hasAttribute("next") ? sequences[i].getAttribute("next") : "stand",
      layers: [],
      effects: [],
    };
    var layers = sequences[i].getElementsByTagName("layer");
    if (layers.length == 0) layers = [sequences[i]];
    for (var j = 0; j < layers.length; j++) {
      this.sequences[actionName].layers.push([]);
      var layerOffset = {
        x: offset.x + (layers[j].hasAttribute("xOffset") ? parseInt(layers[j].getAttribute("xOffset")) : 0),
        y: offset.y + (layers[j].hasAttribute("yOffset") ? parseInt(layers[j].getAttribute("yOffset")) : 0),
      };
      var frames = layers[j].getElementsByTagName("frame");
      for (var k = 0; k < frames.length; k++) {
        this._loadFrame(frames[k], layerOffset, actionName, j);
      }
    }    
  }

  this.scheduleIdleAnimation();
};

Game.Character.prototype = {

  // PRIVATE METHODS

  _loadPortrait: function (portraitElement) {
    var opacity = portraitElement.getAttribute("opacity");
    var scale = portraitElement.getAttribute("scale");
    var url = portraitElement.textContent;
    var image = Game.loader.load(url, function () {
      if (opacity) image.style.opacity = opacity;
      if (scale)  image.width *= parseFloat(scale);
      image.style.display = 'inline';
    });
    image.style.display = 'none';
    this.portraits.push(image);
  },

  _loadFrame: function (xml, offset, action, layer) {
    var opacity = xml.getAttribute("opacity");
    var rotate = xml.getAttribute("rotate");
    var scale = xml.getAttribute("scale");
    var url = xml.textContent;
    var frameX = xml.getAttribute("x");
    var frameY = xml.getAttribute("y");
    var frameOffset = {
      x: offset.x + (frameX ? parseInt(frameX) : 0),
      y: offset.y + (frameY ? parseInt(frameY) : 0)
    }
    var key = [opacity, rotate, scale, url, frameX, frameY, layer].join("\n");
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
    var durationString = xml.getAttribute("duration");
    var duration = durationString ? parseInt(durationString) : 1;
    for (var i = 0; i < duration; i++) {
      this.sequences[action].layers[layer].push(image);
    }
    image.style.zIndex = layer;
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
//    sprite.canvas.style.visibility = "hidden";
    sprite.canvas.className = "hid";
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
    var sequence = this.sequences[this._action];
    if (sequence) {
      for (var i = 0; i < sequence.layers.length; i++) {
//        sequence.layers[i][this._frame].style.visibility = "hidden";
        sequence.layers[i][this._frame].className = "hid";
      }
    }
  },

  _showCurrentFrame: function () {
    var sequence = this.sequences[this._action];
    if (sequence) {
      for (var i = 0; i < sequence.layers.length; i++) {
//        sequence.layers[i][this._frame].style.visibility = "visible";
        sequence.layers[i][this._frame].className = "";
      }
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
      if (value < sequence.layers[0].length) {
        this._frame = value;
      }
      else if (sequence.loop == "stay") {
        this._frame = sequence.layers[0].length - 1;
      }
      else if (sequence.loop == "none") {
        this._frame = 0;
        this.setAction(sequence.next);
        this.scheduleIdleAnimation();
      }
      else if (sequence.loop == "loop") {
        this._frame = 0;
      }
      else if (sequence.loop == "hide") {
        this.hide();
        return;
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
    if (!sequence || this._frame >= sequence.layers[0].length) {
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
    if (!this._visible) return;

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

  hide: function () {
    this._visible = false;
    this._hideCurrentFrame();
  },

  show: function () {
    this._visible = false;
    this._showCurrentFrame();
  },

}

