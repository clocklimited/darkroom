module.exports = Circle

var DarkroomStream = require('./darkroom-stream')
  , Promise = require('bluebird')
  , gm = require('gm')
  , temp = Promise.promisifyAll(require('temp'))

Promise.promisifyAll(gm.prototype)

temp.track()

function Circle(options) {
  if (!(this instanceof Circle))
    return new Circle()

  options = options || {}
  DarkroomStream.call(this)

  this.options = options
  this.options.colour = this.options.colour || 'none'
  this.dimensions = []
}

Circle.prototype = Object.create(DarkroomStream.prototype)

Circle.prototype.end = function (chunk) {
  DarkroomStream.prototype.end.call(this, chunk)
  this.exec.call(this)
}

Circle.prototype._ensureCircleGeometry = function(width, height) {
  var dimensions =
    { x0: function () { return width * 0.1 }
    , y0: function () { return height * 0.1 }
    , x1: function () { return width * 0.9 }
    , y1: function () { return height * 0.9 }
    , w: function () { return width * 0.5 }
    , h: function () { return height * 0.5}
    }

  Object.keys(dimensions).forEach(function (dimension) {
    this.dimensions.push(this.options[dimension] || dimensions[dimension]())
  }.bind(this))
}

Circle.prototype._createMask = function (out) {
  var width = this.size.width
    , height = this.size.height

  this.maskPath = out.path

  this._ensureCircleGeometry(width, height)

  var image = gm(width, height, 'none')

  return image
    .draw.apply(image, [ 'roundRectangle' ].concat(this.dimensions))
    .writeAsync(out.path)
}

// gm().composite() doesnt support passing in a buffer
// as a base image, so we need to write it to disk first
Circle.prototype._writeImage = function (image) {
  return temp.openAsync('base-image').then(function (tempFile) {
    this.baseImagePath = tempFile.path
    return gm(image).writeAsync(tempFile.path)
  }.bind(this))
}

Circle.prototype._writeColourBackground = function () {
  if (this.options.colour === 'none') return

  return temp.openAsync({ suffix: '.jpg' }).then(function (tempFile) {
    this.backgroundImagePath = tempFile.path
    return gm(this.size.width, this.size.height, this.options.colour).writeAsync(tempFile.path)
  }.bind(this))
}

Circle.prototype._createCropped = function (image, out) {
  return this._writeImage(image).then(function () {
    var outImage = gm().compose('In').composite(this.baseImagePath, this.maskPath)

    if (this.backgroundImagePath) {
      outImage.compose('Over').composite(this.backgroundImagePath)
    }

    outImage.stream(out)
  }.bind(this))
}

Circle.prototype._getImageSize = function (image) {
  return gm(image).sizeAsync().then(function (size) {
    this.size = size
  }.bind(this))
}

Circle.prototype.exec = function () {
  var self = this

  function streamOutput(err, stdout) {
    if (err) {
      return self.emit('error', err)
    }

    stdout.on('data', self.emit.bind(self, 'data'))

    stdout.on('end', function (chunk) {
      self.emit('end', chunk)
    })
  }

  var image = Buffer.concat(this.chunks, this.size)

  Promise.join(temp.openAsync({ suffix: '.png' }), this._getImageSize(image)).bind(this)
    .spread(this._createMask)
    .then(this._writeColourBackground.bind(this))
    .then(this._createCropped.bind(this, image, streamOutput))
    .then(temp.cleanupAsync())
}
