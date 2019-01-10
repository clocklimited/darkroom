module.exports = Crop

var DarkroomStream = require('./darkroom-stream')
  , stream = require('stream')
  , Stream = stream.Stream
  , gm = require('gm')
  , fileType = require('file-type')
  , Gifsicle = require('gifsicle-stream')

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
  this.quality = options.quality || 82
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
    , imageFileType = fileType(this.chunks[0])
    , context

  if (imageFileType === null) {
    self.emit('error', new Error('Unsupported file type'))
    return false
  }

  function streamOutput(err, stdout, stderr) {
    if (err) {
      self.emit('error', err)
      return
    }

    stdout.on('data', self.emit.bind(self, 'data'))

    if (stderr) {
      stderr.on('data', self.emit.bind(self, 'error'))
    } else {
      stdout.on('error', self.emit.bind(self, 'error'))
    }

    stdout.on('end', function (chunk) {
      self.emit('end', chunk)
    })
  }

  if (imageFileType.ext !== 'gif') {
    context = gm(Buffer.concat(this.chunks, this.size))
      .options({ nativeAutoOrient: true })
      .autoOrient()
      .colorspace('RGB')
      .gravity(this.gravity)
      .quality(this.quality)
      .noProfile()
      .bitdepth(8)
      .unsharp(0.25, 0.25, 8, 0.065)
      .crop(this.crop.w, this.crop.h, this.crop.x1, this.crop.y1)

      if (imageFileType.ext === 'jpg') {
        // This makes it progressive
        context = context.interlace('Line')
      }
      context.stream(streamOutput)
    } else if (imageFileType.ext === 'gif') {
      var crop = this.crop.x1 + ',' + this.crop.y1 + '+' + this.crop.w + 'x' + this.crop.h
      context = new Gifsicle([ '--crop', crop, '--colors', '256' ])
      context.write(Buffer.concat(this.chunks, this.size))
      context.end()
      streamOutput(null, context)
    }
}
