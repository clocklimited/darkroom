var Canvas = require('canvas')
  , util = require('util')
  , DarkroomStream = require('./darkroomStream')
  , Stream = require('stream').Stream
  , Image = Canvas.Image
  , CropCanvas = require('./canvas/crop')

var Crop = function() {
  if (!(this instanceof Crop))
    return new Crop()
  DarkroomStream.call(this)
  this.width = 0
  this.height = 0
  this.xOffset = 0
  this.yOffset = 0
}

util.inherits(Crop, DarkroomStream)

Crop.prototype.pipe = function (dest, options) {
  options = options || {}
  this.width = options.width || 0
  this.height = options.height || 0
  this.xOffset = options.xOffset || 0
  this.yOffset = options.yOffset || 0

  var self = this

  if (self.resume)
    self.resume()

  return Stream.prototype.pipe.call(self, dest, options)
}

Crop.prototype.write = function (chunk) {
  DarkroomStream.prototype.write.call(this, chunk)
}

Crop.prototype.end = function (chunk) {
  DarkroomStream.prototype.end.call(this, chunk)
  this.exec.call(this)
}

Crop.prototype.exec = function () {
  var canvas = new Canvas(this.width, this.height)
  , self = this

  var imageManipulation = new CropCanvas()

  imageManipulation.onerror = function (error) {
    self.emit('error', error)
  }

  imageManipulation.onload = function (canvas) {
    var pngStream = canvas.pngStream()

    pngStream.on('data', self.emit.bind(self, 'data'))

    pngStream.on('error', self.emit.bind(self, 'error'))

    pngStream.on('end', function (chunk) {
      self.emit('end', chunk)
    })
  }

  imageManipulation.crop(Buffer.concat(this.chunks, this.size), new Image(), canvas,
    { xOffset: this.xOffset, yOffset: this.yOffset})
}

module.exports = Crop