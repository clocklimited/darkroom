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

Resize.prototype.pipe = function(dest, options) {
  options = options || {}
  this.width = options.width || null
  this.height = options.height || null
  this.quality = options.quality || 75
  this.mode = options.mode || 'fit'

  if ((this.mode === 'stretch') && ((this.width === null) || (this.height === null)))
    throw new Error('Unable to stretch to a single dimension constant')

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

  var context = gm(Buffer.concat(this.chunks, this.size))
    .options({ nativeAutoOrient: true })
    .autoOrient()
    .colorspace('RGB')
    .noProfile()
    .gravity('North')
    .quality(this.quality)
    // This makes it progressive
    .interlace('Line')

  if (this.mode === 'fit') {
    context
      .resize(this.width, this.height)
      .stream(streamOutput)
  } else if (this.mode === 'cover') {
    context
      .resize(this.width, this.height, '^')
      .background('transparent')
      .extent(this.width, this.height)
      .stream(streamOutput)
  } else {
    context
      .resize(this.width, this.height, '!')
      .stream(streamOutput)
  }

}

module.exports = Resize
