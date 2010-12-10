Game.Path = function (element) {
  // read the element's attributes
  this.from = element.getAttribute("from");
  this.to = element.getAttribute("to");
  this.direction = element.getAttribute("direction");

  // extract the steps (points) of the path
  this.steps = [];
  var pElements = element.getElementsByTagName("p");
  for (var i = 0; i < pElements.length; i++) {
    var x = parseInt(pElements[i].getAttribute("x"));
    var y = parseInt(pElements[i].getAttribute("y"));
    this.steps.push({"x": x, "y": y});
  }
};

