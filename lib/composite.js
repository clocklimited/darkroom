var util = require('util')
  , DarkroomStream = require('./darkroomStream')
  , Stream = require('stream').Stream
  , gm = require('gm')

var Composite = function(path, opacityPercentage) {
  if (!(this instanceof Composite))
    return new Composite()
  DarkroomStream.call(this)
  this.width = 0
  this.height = 0
  this.crop = true
  this.watermarkPath = path
  this.opacityPercentage = opacityPercentage
}

util.inherits(Composite, DarkroomStream)

Composite.prototype.pipe = function (dest, options) {
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

Composite.prototype.write = function (chunk) {
  DarkroomStream.prototype.write.call(this, chunk)
}

Composite.prototype.end = function (chunk) {
  DarkroomStream.prototype.end.call(this, chunk)
  this.exec.call(this)
}

Composite.prototype.exec = function () {
  var self = this
  var streamOutput = function (err, stdout, stderr) {
    if (err) {
      self.emit('error', err)
      return
    }

    stdout.on('data', self.emit.bind(self, 'data'))

    stdout.on('end', function (chunk) {
      self.emit('end', chunk)
    })
  }

  gm(Buffer.concat(this.chunks, this.size), 'img.jpg')
    .autoOrient()
    .colorspace('RGB')
    .noProfile()
    .quality(80)
    .subCommand('composite')
    .dissolve(this.opacityPercentage)
    .gravity('Center')
    .in(this.watermarkPath)
    .stream(streamOutput)

  // gm(Buffer.concat(this.chunks, this.size), 'img.jpg')
  //   .noProfile()
  //   .quality(80)
  //   .stream(streamOutput)

}

module.exports = Composite
