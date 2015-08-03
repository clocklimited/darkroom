module.exports = Circle

var DarkroomStream = require('./darkroom-stream')
  , gm = require('gm')
  , temp = require('temp')
  , async = require('async')
  , rimraf = require('rimraf')

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
  this.options.x0 = this.options.x0 || width / 2
  this.options.y0 = this.options.y0 || height / 2
  this.options.x1 = this.options.x1 || width * 0.8
  this.options.y1 = this.options.y1 || height * 0.8
}

Circle.prototype._createMask = function (results, cb) {
  var width = results.size.width
    , height = results.size.height
    , multiplier = 4

  this.maskPath = temp.path({ dir: this.tempDir, suffix: '.png' })

  this._ensureCircleGeometry(width, height)

  // Multiply each height and width by a set multiplier in order to
  // remove jagged edges from resulting image
  //
  // http://stackoverflow.com/a/22940729
  return gm(width * multiplier, height * multiplier, 'none')
    .drawCircle(this.options.x0 * multiplier, this.options.y0 * multiplier
      , this.options.x1 * multiplier, this.options.y1 * multiplier)
    .resize('25%').write(this.maskPath, cb)
}

// gm().composite() doesnt support passing in a buffer
// as a base image, so we need to write it to disk first
Circle.prototype._writeImage = function (image, cb) {
  this.baseImagePath = temp.path({ dir: this.tempDir, suffix: 'base-image' })
  gm(image).write(this.baseImagePath, cb)
}

Circle.prototype._writeColourBackground = function (size, cb) {
  if (this.options.colour === 'none') return cb()

  this.backgroundImagePath = temp.path({ dir: this.tempDir, suffix: '.jpg' })

  gm(size.width, size.height, this.options.colour).write(this.backgroundImagePath, cb)
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
      rimraf(self.tempDir, function (err) {
        if (err) return emitError(err)

        self.emit('end', chunk)
      })
    })
  }

  var image = Buffer.concat(this.chunks, this.size)

  async.parallel(
    { tempDir: temp.mkdir.bind(null, 'circle')
    , size: this._getImageSize.bind(null, image)
    }, function (err, results) {
      if (err) return emitError(err)

      this.tempDir = results.tempDir

      async.series(
        { mask: this._createMask.bind(this, results)
        , colourBackground: this._writeColourBackground.bind(this, results.size)
        , output: this._createCropped.bind(this, image)
        }, streamOutput)

    }.bind(this))
}
