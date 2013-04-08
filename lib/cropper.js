var Canvas = require('canvas')
  , util = require('util')
  , DarkroomStream = require('./darkroomStream')
  , Stream = require('stream').Stream
  , gm = require('gm')

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
  this.crop = options.crop || {}

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
  var self = this

    var streamOutput = function (err, stdout, stderr) {
    stdout.on('data', self.emit.bind(self, 'data'))

    stderr.on('data', self.emit.bind(self, 'error'))

    stdout.on('end', function (chunk) {
      self.emit('end', chunk)
    })
  }

  gm(Buffer.concat(this.chunks, this.size), 'img.jpg')
    .noProfile()
    .quality(100)
    .crop(this.crop.w, this.crop.h, this.crop.x1, this.crop.y1)
    .stream(streamOutput)
}

module.exports = Crop