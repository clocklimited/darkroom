var Canvas = require('canvas')
  , util = require('util')
  , DarkroomStream = require('./darkroomStream')
  , Image = Canvas.Image

var Resize = function() {
  if (!(this instanceof Resize))
    return new Resize()
  DarkroomStream.call(this)
}

util.inherits(Resize, DarkroomStream)

Resize.prototype.pipe = function (dest, options) {
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
  var resizeCanvas = require('./canvas/resize')
    , canvas = new Canvas(100,100)
    , pngStream = canvas.pngStream()
    , self = this

  var test = resizeCanvas(Buffer.concat(this.chunks, this.size), new Image(), canvas)
  test.onerror = function (error) {
    throw error
    self.emit('error', error)
  }
  pngStream.on('data', self.emit.bind(self, 'data'))

  pngStream.on('end', function (chunk) {
    self.emit('end', chunk)
  })
  // var img = new Image()
  //   , imageData = Buffer.concat(this.chunks, this.size)
  //   , self = this

  // if (this.chunks && this.chunks.length === 0)
  //   self.emit('error', new Error('Nothing to work with'))

  // img.onerror = function (error) {
  //   self.emit('error', error)
  // }

  // img.onload = function () {
  //   var width = 100
  //     , height = 100
  //     , canvas = new Canvas(width, height)
  //     , ctx = canvas.getContext('2d')
  //     , pngStream = canvas.pngStream()

  //   ctx.drawImage(img, 0, 0, width, height)
  //   pngStream.on('data', self.emit.bind(self, 'data'))
  //   pngStream.on('end', function (chunk) {
  //     self.emit('end', chunk)
  //   })
  // }

  // img.src = imageData
}

module.exports = Resize