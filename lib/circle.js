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

  var required = [ 'x0', 'y0', 'x1', 'y1' ]

  required.forEach(function (arg) {
    if (!options[arg]) throw new Error(arg + ' is required')
  })

  this.options = options
}

Circle.prototype = Object.create(DarkroomStream.prototype)

Circle.prototype.end = function (chunk) {
  DarkroomStream.prototype.end.call(this, chunk)
  this.exec.call(this)
}

Circle.prototype._createMask = function (size, out) {
  var width = size.width
    , height = size.height

  return gm(width, height, 'none')
    .drawCircle(width / 2, height / 2, width * 0.8, height * 0.8)
    .writeAsync(out.path)
    .then(function () {
      return out.path
    })
}

// gm().composite() doesnt support passing in a buffer
// as a base image, so we need to write it to disk first
Circle.prototype._writeBaseImage = function (image) {
  return temp.openAsync('base-image').then(function (tempFile) {
    return gm(image).writeAsync(tempFile.path).then(function () {
      return tempFile.path
    })
  })
}

Circle.prototype._createCropped = function (image, out, mask) {
  return this._writeBaseImage(image).then(function (path) {
    return gm().compose('In').composite(path, mask).stream(out)
  })
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

  Promise.join(gm(image).sizeAsync(), temp.openAsync({ suffix: '.png' }))
    .spread(this._createMask)
    .then(this._createCropped.bind(this, image, streamOutput))
    .then(temp.cleanupAsync())
}
