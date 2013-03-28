var Canvas = require('canvas')
  , util = require('util')
  , DarkroomStream = require('./darkroomStream')
  , Stream = require('stream').Stream
  , Image = Canvas.Image
  , ResizeCanvas = require('./canvas/resize')
  , gm = require('gm')

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

  return Stream.prototype.pipe.call(self, dest, options)
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
  , self = this

  gm(Buffer.concat(this.chunks, this.size), 'img.jpg')
  .resize(this.width, this.height, '!')
  .stream(function (err, stdout, stderr) {
    stdout.on('data', self.emit.bind(self, 'data'))

    stderr.on('data', self.emit.bind(self, 'error'))

    stdout.on('end', function (chunk) {
      self.emit('end', chunk)
    })
  })

  // var imageManipulation = new ResizeCanvas()

  // imageManipulation.onerror = function (error) {
  //   self.emit('error', error)
  // }

  // imageManipulation.onload = function (canvas) {
  //   var pngStream = canvas.pngStream()

  //   pngStream.on('data', self.emit.bind(self, 'data'))

  //   pngStream.on('error', self.emit.bind(self, 'error'))

  //   pngStream.on('end', function (chunk) {
  //     self.emit('end', chunk)
  //   })
  // }

  // imageManipulation.resize(Buffer.concat(this.chunks, this.size), new Image(), canvas, !this.crop)
}

module.exports = Resize