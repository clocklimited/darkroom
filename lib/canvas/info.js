/**
 *  This should work in the browser with no modification,
 *  this means that it might be possible to resize images client side!
 *
 *  Think of the bandwidth!
 */
module.exports = function() {

  var self = {}

  self.info = function (src, img) {
    img.onerror = self.onerror

    img.onload = function () {
      self.onload({ width: img.width, height: img.height })
    }

    img.src = src
  }


  self.onload = function () {}
  self.onerror = function () {}

  return self
}