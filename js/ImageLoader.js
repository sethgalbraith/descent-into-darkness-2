// Simple image loader. Calls a function when it is done loading images.
// All of the images must be loaded "at the same time", meaning that this
// class assumes that no image onload event listeners will be called until
// you are done specifying which images you want to load. This will be true
// unless you call the .load() function of the same image loader during
// two or more different events.

/**
 * Create a new ImageLoader.
 * @param callback the function to call when all of the images are done loading.
 */
Game.ImageLoader = function(callback) {
  this.count = 0; // number of images that are not loaded yet
  this.total = 0; // number of images that have started loading
  this.callback = callback; // function to call when all images are loaded
};

/**
 * Start loading an image.
 * @param url the address of the image to load.
 * @return the new HTML image element that is being loaded.
 */
Game.ImageLoader.prototype.load = function (url) {
  this.count++; // Another image needs to be loaded.
  this.total++; // We have started loading another image.
  // The image onload event listener will not remember the current value
  // of the global variable this, so we save it in the local variable self.
  var self = this;
  var newImage = new Image();
  newImage.src = url;
  newImage.onload = function () {self._onload()};
  return newImage;
};

/**
 * Finish loading an image. This is a private function called from
 * the onload event listener of each image this image loader loads.
 * It decrements the count and calls the callback function if all
 * of the images are done loading.
 */
Game.ImageLoader.prototype._onload = function() {
  this.count--; // One less image needs to be loaded.
  if (this.count == 0) {
    // All of the images are loaded, so call the function now.
    this.callback();
  }
};

