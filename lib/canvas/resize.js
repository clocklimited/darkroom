module.exports = function (src, img, canvas, options) {

  options = options || {}

  var self = {}

  img.onerror = self.onerror

  img.onload = function () {

    var w1 = img.width
      , h1 = img.height
      , ctx = canvas.getContext('2d')
      , width = canvas.width
      , height = canvas.height
      , xOffset = 0
      , yOffset = 0
      , w2
      , h2

    if (width === 0) {
      width = w1
    }

    if (height === 0) {
      height = h1
    }

    // Width and height aspect ratios
    var wa = width / w1
      , ha = height / h1

    // Which dimesion to scale by
    if (options.resizeOnly) {
      w2 = w1
      h2 = h1

      if (wa > ha) {
        // If width is bigger then
        w1 = w1 * ha
        h1 = h1 * ha
      } else {
        w1 = w1 * wa
        h1 = h1 * wa
      }
      width = Math.min(width, w1)
      height = Math.min(height, h1)
    } else {
      if (wa > ha) {
        w2 = w1
        h2 = (height / width) * w1
        yOffset = (h1 - h2) / 2
        w1 = width
        h1 = height
      } else {
        w2 = (width / height) * h1
        h2 = h1
        xOffset = (w1 - w2) / 2
        w1 = width
        h1 = height
      }
    }

    ctx.drawImage(img, xOffset, yOffset, w2, h2, 0, 0, w1, h1)
    self.onload(canvas, ctx)
  }

  img.src = src

  self.onload = function () {}
  self.onerror = function () {}

  return self
}