Game.Tile = function (xml) {
  this.name = xml.getAttribute("name");
  this.element = Game.createElement("div", {"class": "tile"});
  this.container = Game.createElement("div", {}, this.element);
  var imageElements = xml.getElementsByTagName("image");
  for (var i = 0; i < imageElements.length; i++) {
    var image = new Game.TeamSprite(imageElements[i].textContent, Game.loader);
    this.container.appendChild(image.canvas);
  }
};
Game.Tile.prototype = {

};

