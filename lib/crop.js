module.exports = Crop

var DarkroomStream = require('./darkroom-stream')
  , Stream = require('stream').Stream
  , gm = require('gm')

function Crop() {
  if (!(this instanceof Crop))
    return new Crop()
  DarkroomStream.call(this)
  this.width = 0
  this.height = 0
  this.xOffset = 0
  this.yOffset = 0
}

Crop.prototype = Object.create(DarkroomStream.prototype)

Crop.prototype.pipe = function (dest, options) {
  options = options || {}
  this.crop = options.crop || {}
  this.quality = options.quality || 85
  this.gravity = options.gravity || 'NorthWest'

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
  function streamOutput(err, stdout, stderr) {
    if (err) {
      self.emit('error', err)
      return
    }

    stdout.on('data', self.emit.bind(self, 'data'))
    stderr.on('data', self.emit.bind(self, 'error'))

    stdout.on('end', function (chunk) {
      self.emit('end', chunk)
    })
  }

  gm(Buffer.concat(this.chunks, this.size))
    .options({ nativeAutoOrient: true })
    .autoOrient()
    .colorspace('RGB')
    .noProfile()
    .quality(this.quality)
    // This makes it progressive
    .interlace('Line')
    .gravity(this.gravity)
    .crop(this.crop.w, this.crop.h, this.crop.x1, this.crop.y1)
    .stream(streamOutput)
}
