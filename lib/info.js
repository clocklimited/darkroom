var Canvas = require('canvas')
  , util = require('util')
  , DarkroomStream = require('./darkroomStream')
  , Stream = require('stream').Stream
  , Image = Canvas.Image
  , InfoCanvas = require('./canvas/info')

var Info = function() {
  if (!(this instanceof Info))
    return new Info()
  DarkroomStream.call(this)
}

util.inherits(Info, DarkroomStream)

Info.prototype.pipe = function (dest, options) {
  options = options || {}

  var self = this

  if (self.resume)
    self.resume()

  return Stream.prototype.pipe.call(self, dest, options)
}

Info.prototype.write = function (chunk) {
  DarkroomStream.prototype.write.call(this, chunk)
}

Info.prototype.end = function (chunk) {
  DarkroomStream.prototype.end.call(this, chunk)
  this.exec.call(this)
}

Info.prototype.exec = function () {
  var self = this
    , image = new InfoCanvas()

  image.onerror = function (error) {
    self.emit('error', error)
  }

  image.onload = function (info) {
    self.emit('end', info)
  }

  image.info(Buffer.concat(this.chunks, this.size), new Image())
}

module.exports = Info