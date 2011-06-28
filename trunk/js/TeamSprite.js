Game.TeamSprite = function (imageURL, loader, callback) {
  this.canvas = document.createElement("canvas");
  this.loaded = false;
  this.palette = []; // colorized palette that replaces team colors
  this.indices = []; // index of each pixel for each team color
  var map = {}; // maps packed rgb values to team color numbers

  // initialize the map and arrays
  for (var i = 0; i < Game.TeamSprite.TEAM_COLORS.length; i++) {
    var r = Game.TeamSprite.TEAM_COLORS[i][0];
    var g = Game.TeamSprite.TEAM_COLORS[i][1];
    var b = Game.TeamSprite.TEAM_COLORS[i][2];
    var packed = 65536 * r + 256 * g + b;
    map[packed] = i;
    this.indices.push([]);
    this.palette.push([r, g, b]);
  }

  // Get information that is only available after the image loads.
  var self = this;
  var image = null; // image object is created after handler;
  var handler = function () {
    self.loaded = true;
    // crop empty space out of image
    var left = image.width;
    var right = 0;
    var top = image.height;
    var bottom = 0;    
    var tempCanvas = document.createElement("canvas");
    tempCanvas.width = image.width;
    tempCanvas.height = image.height;
    var context = tempCanvas.getContext("2d");
    context.drawImage(image, 0, 0);
    var data = context.getImageData(0, 0, image.width, image.height);
    for (var y = 0; y < data.height; y++) {
      for (var x = 0; x < data.width; x++) {
        if (data.data[(y * data.width + x) * 4 + 3] != 0) {
          if (x < left) left = x;
          if (x > right) right = x;
          if (y < top) top = y;
          if (y > bottom) bottom = y;
        }
      }
    }

    // draw the visible part of the sprite on the canvas
    var width = right - left;
    var height = bottom - top;
    self.canvas.width = right - left;
    self.canvas.height = bottom - top;
    context = self.canvas.getContext("2d");
    context.drawImage(image, left, top, width, height, 0, 0, width, height);

    // Set negative CSS margins so that canvas is effectively 0 pixels wide
    // and tall, and positioned from the center of the original image.
    // This helps position the image using the left or right and bottom or top
    // CSS properties.
    self.canvas.style.marginLeft   = -(image.width  / 2 - left) + "px";
    self.canvas.style.marginTop    = -(image.height / 2 - top) + "px";
    self.canvas.style.marginRight  = -(image.width  / 2 - right) + "px";
    self.canvas.style.marginBottom = -(image.height / 2 - bottom) + "px";

    // get the indices of the pixels that are team colors
    var data = context.getImageData(0, 0, width, height);
    for (var i = 0; i < width * height; i++) {
      var r = data.data[i * 4];
      var g = data.data[i * 4 + 1];
      var b = data.data[i * 4 + 2];
      var packed = 65536 * r + 256 * g + b;
      var color = map[packed];
      if (typeof(color) != "undefined") {
        self.indices[color].push(i);
      }
    }

    // colorize it!
    self.colorize();

    // execute any other code that should run after loading the image
    if (callback) callback();
  };

  // load the image
  if (loader) {
    image = loader.load(imageURL, handler);
  }
  else {
    image = new Image();
    image.src = imageURL;
    image.onload = handler;
  }
};

// magenta team color palette
Game.TeamSprite.TEAM_COLORS = [
  [ 63,   0,  22],  [ 85,   0,  42],  [105,   0,  57],  [123,   0,  69],
  [140,   0,  81],  [158,   0,  93],  [177,   0, 105],  [195,   0, 116],
  [214,   0, 127],  [236,   0, 140],  [238,  61, 150],  [239,  91, 161],
  [241, 114, 172],  [242, 135, 182],  [244, 154, 193],  [246, 173, 205],
  [248, 193, 217],  [250, 213, 229],  [253, 233, 241],
];

Game.TeamSprite.prototype = {

  colorize: function () {
    if (!this.loaded) return;
    var context = this.canvas.getContext("2d");
    var data = context.getImageData(0, 0, this.canvas.width, this.canvas.height);
    for (var color = 0; color < this.indices.length; color++) {
      var pixels = this.indices[color];
      var r = this.palette[color][0];
      var g = this.palette[color][1];
      var b = this.palette[color][2];
      for (var i = 0; i < pixels.length; i++) {
        var j = pixels[i] * 4;
        data.data[j]     = r;
        data.data[j + 1] = g;
        data.data[j + 2] = b;
      }
    }
    context.putImageData(data, 0, 0);
  },

  setChannel: function (channel, value) {
    var half = this.palette.length / 2;
    for (var i = 0; i < half; i++) {
      this.palette[i][channel] = Math.round(value * i / half);
    }
    for (i = Math.floor(half); i < this.palette.length; i++) {
      var blend = i / half - 1;
      this.palette[i][channel] = Math.round(255 * blend + value * (1 - blend));
    }
  },

  setRed: function (value) {this.setChannel(0, value); this.colorize();},

  setGreen: function (value) {this.setChannel(1, value); this.colorize();},

  setBlue: function (value) {this.setChannel(2, value); this.colorize();},

  setColor: function (red, green, blue) {
    this.setChannel(0, red);
    this.setChannel(1, green);
    this.setChannel(2, blue);
    this.colorize();
  },

}



