var Canvas = require('canvas')
  , util = require('util')
  , DarkroomStream = require('./darkroomStream')
  , Image = Canvas.Image
  , resizeCanvas = require('./canvas/resize')

var Resize = function() {
  if (!(this instanceof Resize))
    return new Resize()
  DarkroomStream.call(this)
  this.width = 0
  this.height = 0
  this.crop = true
}

util.inherits(Resize, DarkroomStream)

Resize.prototype.pipe = function (dest, options) {
  options = options || {}
  this.width = options.width || 0
  this.height = options.height || 0
  if (options.crop === undefined) {
    this.crop = false
  }

  var self = this

  if (self.resume)
    self.resume()

  var a = DarkroomStream.prototype.pipe.call(self, dest, options)
  return a
}

Resize.prototype.write = function (chunk) {
  DarkroomStream.prototype.write.call(this, chunk)
}

Resize.prototype.end = function (chunk) {
  DarkroomStream.prototype.end.call(this, chunk)
  this.exec.call(this)
}

Resize.prototype.exec = function () {
  var canvas = new Canvas(this.width, this.height)
  , pngStream = canvas.pngStream()
  , self = this

  var test = resizeCanvas(Buffer.concat(this.chunks, this.size), new Image(), canvas, !this.crop)
  test.onerror = function (error) {
    self.emit('error', error)
  }
  pngStream.on('data', self.emit.bind(self, 'data'))

  pngStream.on('end', function (chunk) {
    self.emit('end', chunk)
  })
}

module.exports = Resize