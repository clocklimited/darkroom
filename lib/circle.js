module.exports = Circle

var DarkroomStream = require('./darkroom-stream')
  , gm = require('gm')
  , temp = require('temp')
  , async = require('async')

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

Circle.prototype._createMask = function (results, cb) {
  var width = results.size.width
    , height = results.size.height

  this.maskPath = results.temp.path

  this._ensureCircleGeometry(width, height)

  var image = gm(width, height, 'none')

  image
    .draw.apply(image, [ 'roundRectangle' ].concat(this.dimensions))
    .write(this.maskPath, cb)
}

// gm().composite() doesnt support passing in a buffer
// as a base image, so we need to write it to disk first
Circle.prototype._writeImage = function (image, cb) {
  temp.open('base-image', function (err, tempFile) {
    if (err) return cb(err)
    this.baseImagePath = tempFile.path
    gm(image).write(tempFile.path, cb)
  }.bind(this))
}

Circle.prototype._writeColourBackground = function (size, cb) {
  if (this.options.colour === 'none') return cb()

  temp.open({ suffix: '.jpg' }, function (err, tempFile) {
    if (err) return cb(err)
    this.backgroundImagePath = tempFile.path
    gm(size.width, size.height, this.options.colour).write(tempFile.path, cb)
  }.bind(this))
}

Circle.prototype._createCropped = function (image, cb) {
  this._writeImage(image, function (err) {
    if (err) return cb(err)
    var outImage = gm().compose('In').composite(this.baseImagePath, this.maskPath)

    if (this.backgroundImagePath) {
      outImage.compose('Over').composite(this.backgroundImagePath)
    }

    outImage.stream(cb)
  }.bind(this))
}

Circle.prototype._getImageSize = function (image, cb) {
  return gm(image).size(cb)
}

Circle.prototype.exec = function () {
  var self = this

  function emitError(err) {
    return self.emit('error', err)
  }

  function streamOutput(err, results) {
    if (err) return emitError(err)
    var stdout = results.output[0]

    stdout.on('data', self.emit.bind(self, 'data'))

    stdout.on('end', function (chunk) {
      self.emit('end', chunk)
      temp.cleanup()
    })
  }

  var image = Buffer.concat(this.chunks, this.size)

  async.parallel(
    { temp: temp.open.bind(null, { suffix: '.png' })
    , size: this._getImageSize.bind(null, image)
    }, function (err, results) {
      if (err) return emitError(err)

      async.series(
        { mask: this._createMask.bind(this, results)
        , colourBackground: this._writeColourBackground.bind(this, results.size)
        , output: this._createCropped.bind(this, image)
        }, streamOutput)

    }.bind(this))
}
