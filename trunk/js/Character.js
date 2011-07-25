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
  this.setX(parseInt(this._getAttribute(xml, "x", 0)));
  this.setY(parseInt(this._getAttribute(xml, "y", 0)));
  this.location = xml.getAttribute("location");
  this.type = xml.getAttribute("type");
  this.speed = parseInt(this._getAttribute(xml, "speed", 20));
  this.range = parseInt(this._getAttribute(xml, "range", 440));
  this.height = parseInt(this._getAttribute(xml, "height", 0));
  this.idleMin = parseInt(this._getAttribute(xml, "idleMin", 10));
  this.idleMax = parseInt(this._getAttribute(xml, "idleMax", 50));
  var colorString = this._getAttribute(xml, "color", "520");
  this._color = parseInt(colorString[0]) * 36
              + parseInt(colorString[1]) * 6
              + parseInt(colorString[2]);
  this._angle = parseFloat(this._getAttribute(xml, "angle", 0));
  this._scale = parseFloat(this._getAttribute(xml, "scale", 1));
  this._transformElement(this.element, this._angle, this._scale);
  this.setOpacity(parseFloat(this._getAttribute(xml, "opacity", 1)));
  var offset = {
    x: parseInt(this._getAttribute(xml, "xOffset", 0)),
    y: parseInt(this._getAttribute(xml, "yOffset", 0)),
  };
  var rgb = {
    red: parseFloat(this._getAttribute(xml, "red", 1)),
    green: parseFloat(this._getAttribute(xml, "green", 1)),
    blue: parseFloat(this._getAttribute(xml, "blue", 1)),
  };

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
  this.sprites = {};
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
        this._loadFrame(frames[k], layerOffset, actionName, j, rgb);
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

  _loadFrame: function (xml, offset, action, layer, color) {
    var opacity = parseFloat(this._getAttribute(xml, "opacity", 1));
    var rotate = parseFloat(this._getAttribute(xml, "rotate", 0));
    var scale = parseFloat(this._getAttribute(xml, "scale", 1));
    var rgb = {
      red: color.red * parseFloat(this._getAttribute(xml, "red", 1)),
      green: color.green * parseFloat(this._getAttribute(xml, "green", 1)),
      blue: color.blue * parseFloat(this._getAttribute(xml, "blue", 1)),
    }
    var url = xml.textContent;
    var frameX = xml.getAttribute("x");
    var frameY = xml.getAttribute("y");
    var frameOffset = {
      x: offset.x + (frameX ? parseInt(frameX) : 0),
      y: offset.y + (frameY ? parseInt(frameY) : 0)
    }
    var key = [opacity, rotate, scale, url, frameX, frameY, layer].join("\n");
    var sprite = this.sprites[key];
    if (!sprite) {
      if (url) { // Create a new image.
        sprite = this._makeFrame(url, frameOffset, rotate, scale, opacity, rgb);
      }
      else { // Create an empty div which can be hidden or shown like an image.
        sprite = {
          canvas: Game.createElement("div"),
          setColor: function () {return;},
        }
      }
      this.sprites[key] = sprite;
    }
    var durationString = xml.getAttribute("duration");
    var duration = durationString ? parseInt(durationString) : 1;
    for (var i = 0; i < duration; i++) {
      this.sequences[action].layers[layer].push(sprite.canvas);
    }
    sprite.canvas.style.zIndex = layer;
    this.container.appendChild(sprite.canvas);
  },

  _makeFrame: function (url, offset, rotate, scale, opacity, rgb) {
    var color = this.getColor();
    var sprite = new Game.TeamSprite(url, Game.loader, function () {
      var left = offset.x + parseInt(sprite.canvas.style.marginLeft);
      var top = offset.y + parseInt(sprite.canvas.style.marginTop);
      sprite.canvas.style.marginLeft = left + "px";
      sprite.canvas.style.marginTop = top + "px";
      sprite.canvas.style.marginRight = (sprite.canvas.width - left) + "px";
      sprite.canvas.style.marginBottom = (sprite.canvas.height - top) + "px";
      sprite.colorize(rgb.red, rgb.green, rgb.blue);
      sprite.setColor(color.red, color.green, color.blue);
    });
//    sprite.canvas.style.visibility = "hidden";
    sprite.canvas.className = "hid";
    if (opacity < 1) {
      sprite.canvas.style.opacity = opacity;
    }
    this._transformElement(sprite.canvas, rotate, scale);
    return sprite;
  },

  _transformElement: function (element, angle, scale) {
    var transforms = [];
    if (angle % 360 != 0) {
      transforms.push("rotate(" + angle + "deg)");
    }
    if (scale != 1) {
      transforms.push("scale(" + scale + ")");
    }
    if (transforms.length > 0) {
      var transform = transforms.join(" ");
      element.style.transform = transform;
      element.style.WebkitTransform = transform;
      element.style.MozTransform = transform;
      element.style.OTransform = transform;
    }
  },

  _getAttribute: function (element, attribute, defaultValue) {
    if (element.hasAttribute(attribute)) {
      return element.getAttribute(attribute);
    } else {
      return defaultValue;
    }
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

  getColor: function() {
    return {
      red: 51 * Math.floor(this._color / 36),
      green: 51 * (Math.floor(this._color / 6) % 6),
      blue: 51 * (this._color % 6),
    };
  },
  setColor: function(r, g, b) {
    this._color = 36 * Math.floor(r / 51)
      + 6 * Math.floor(g / 51)
      + Math.floor(b / 51);
    var rgb = this.getColor();
    for (key in this.sprites) {
      this.sprites[key].setColor(rgb.red, rgb.green, rgb.blue);
    }
  },

  getScale: function() {return this._scale;},
  setScale: function(value) {
    this._scale = value;
    this._transformElement(this.element, this._angle, this._scale);
  },

  getAngle: function() {return this._angle;},
  setAngle: function(value) {
    this._angle = value;
    this._transformElement(this.element, this._angle, this._scale);
  },

  getOpacity: function() {return this._opacity;},
  setOpacity: function(value) {
    this._opacity = value;
    this.element.style.opacity = value;
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

