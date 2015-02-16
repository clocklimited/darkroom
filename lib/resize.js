var DarkroomStream = require('./darkroom-stream')
  , Stream = require('stream').Stream
  , gm = require('gm')

function Resize() {
  if (!(this instanceof Resize))
    return new Resize()
  DarkroomStream.call(this)
  this.width = 0
  this.height = 0
}

Resize.prototype = Object.create(DarkroomStream.prototype)

Resize.prototype.pipe = function (dest, options) {
  options = options || {}
  this.width = options.width || 0
  this.height = options.height || 0
  this.quality = options.quality || 75

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
  var self = this

  function streamOutput(err, stdout) {
    if (err) {
      self.emit('error', err)
      return
    }

    stdout.on('data', self.emit.bind(self, 'data'))

    stdout.on('end', function (chunk) {
      self.emit('end', chunk)
    })
  }

  if ((this.width > 0) && (this.height > 0)) {
    gm(Buffer.concat(this.chunks, this.size), 'img.jpg')
      .autoOrient()
      .colorspace('RGB')
      .noProfile()
      // This makes it progressive
      .interlace('Line')
      .quality(this.quality)
      .resize(this.width, this.height, '^')
      .gravity('North')
      .extent(this.width, this.height)
      .stream(streamOutput)
  } else {
    gm(Buffer.concat(this.chunks, this.size), 'img.jpg')
      .autoOrient()
      .colorspace('RGB')
      .noProfile()
      // This makes it progressive
      .interlace('Line')
      .quality(this.quality)
      .resize(this.width, this.height)
      .gravity('North')
      .stream(streamOutput)
  }

}

module.exports = Resize
