/**
 *  This should work in the browser with no modification,
 *  this means that it might be possible to resize images client side!
 *
 *  Think of the bandwidth!
 */
module.exports = function() {

  var self = {}

  self.crop = function (src, img, canvas, options) {
    options = options || {}

    var xOffset = options.xOffset || 0
      , yOffset = options.yOffset || 0

    img.onerror = self.onerror

    img.onload = function () {
      //TODO: Abstract this general canvas code out when more bugs are found.
      canvas.width = (Math.abs(canvas.width) > img.width) ? img.width : Math.abs(canvas.width)
      canvas.height = (Math.abs(canvas.height) > img.height) ? img.height : Math.abs(canvas.height)

      var ctx = canvas.getContext('2d')
        , width = Math.abs(canvas.width)
        , height = Math.abs(canvas.height)


      var w1 = img.width
        , h1 = img.height

      ctx.drawImage(img, xOffset, yOffset, w1, h1, 0, 0, width, height)
      self.onload(canvas, ctx)
    }

    img.src = src
  }


  self.onload = function () {}
  self.onerror = function () {}

  return self
}