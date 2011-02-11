function TeamSprite(imageURL) {
  this.image = new Image();
  this.canvas = document.createElement("canvas");
  this.context = this.canvas.getContext("2d");
  this.loaded = false;
  this.palette = []; // colorized palette that replaces team colors
  this.indices = []; // index of each pixel for each team color
  var map = {}; // maps packed rgb values to team color numbers

  // initialize the map and arrays
  for (var i = 0; i < TeamSprite.TEAM_COLORS.length; i++) {
    var r = TeamSprite.TEAM_COLORS[i][0];
    var g = TeamSprite.TEAM_COLORS[i][1];
    var b = TeamSprite.TEAM_COLORS[i][2];
    var packed = 65536 * r + 256 * g + b;
    map[packed] = i;
    this.indices.push([]);
    this.palette.push([r, g, b]);
  }

  // Get information that is only available after the image loads.
  var self = this;
  this.image.src = imageURL;
  this.image.onload = function () {
    self.loaded = true;
    // make the canvas the same size as the image
    self.canvas.width = self.image.width;
    self.canvas.height = self.image.height;
    // draw the image on the canvas
    self.context.drawImage(self.image, 0, 0);
    // get the indices of the pixels that are team colors
    self.data = self.context.getImageData(0, 0, self.canvas.width, self.canvas.height);
    for (var i = 0, j = 0; i < self.data.width * self.data.height; i++, j += 4) {
      var r = self.data.data[j];
      var g = self.data.data[j + 1];
      var b = self.data.data[j + 2];
      var packed = 65536 * r + 256 * g + b;
      var color = map[packed];
      if (typeof(color) != "undefined") {
        self.indices[color].push(i);
      }
    }
    // colorize it!
    self.colorize();
  };
}

// magenta team color palette
TeamSprite.TEAM_COLORS = [
  [ 63,   0,  22],  [ 85,   0,  42],  [105,   0,  57],  [123,   0,  69],
  [140,   0,  81],  [158,   0,  93],  [177,   0, 105],  [195,   0, 116],
  [214,   0, 127],  [236,   0, 140],  [238,  61, 150],  [239,  91, 161],
  [241, 114, 172],  [242, 135, 182],  [244, 154, 193],  [246, 173, 205],
  [248, 193, 217],  [250, 213, 229],  [253, 233, 241],
];

TeamSprite.prototype.colorize = function () {
  for (var color = 0; color < this.indices.length; color++) {
    var pixels = this.indices[color];
    var r = this.palette[color][0];
    var g = this.palette[color][1];
    var b = this.palette[color][2];
    for (var i = 0; i < pixels.length; i++) {
      var j = pixels[i] * 4;
      this.data.data[j]     = r;
      this.data.data[j + 1] = g;
      this.data.data[j + 2] = b;
    }
  }
  this.context.putImageData(this.data, 0, 0);
};

TeamSprite.prototype.setChannel = function (channel, value) {
  var half = this.palette.length / 2;
  for (var i = 0; i < half; i++) {
    this.palette[i][channel] = Math.round(value * i / half);
  }
  for (i = Math.floor(half); i < this.palette.length; i++) {
    var blend = i / half - 1;
    this.palette[i][channel] = Math.round(255 * blend + value * (1 - blend));
  }
  if (this.loaded) {
    this.colorize();
  }
};

TeamSprite.prototype.__defineSetter__("red", function (value) {
  this.setChannel(0, value);
});

TeamSprite.prototype.__defineSetter__("green", function (value) {
  this.setChannel(1, value);
});

TeamSprite.prototype.__defineSetter__("blue", function (value) {
  this.setChannel(2, value);
});

