var DarkroomStream = require('./darkroom-stream')
  , Stream = require('stream').Stream
  , gm = require('gm')
  , fs = require('fs')
  , async = require('async')
  , temp = require('temp')

function Composite(path, options) {
  if (!(this instanceof Composite))
    return new Composite()
  DarkroomStream.call(this)
  this.width = 0
  this.height = 0
  this.crop = true
  this.watermarkPath = path
  this.options = options

  if (options.opacity === undefined) {
    this.options.opacity = 10
  }
}

Composite.prototype = Object.create(DarkroomStream.prototype)

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

  function streamOutput (err, stdout) {
    if (err) {
      self.emit('error', err)
      return
    }

    stdout.on('data', self.emit.bind(self, 'data'))

    stdout.on('end', function (chunk) {
      self.emit('end', chunk)
    })
  }

  var watermarkPath = this.watermarkPath
    , baseImage = gm(Buffer.concat(self.chunks, self.size), 'img.jpg')
    , watermarkImage = gm(fs.createReadStream(watermarkPath))
    , opacity = this.options.opacity

  function calculateWatermarkSize(imageSizes) {
    var watermarkRatio = imageSizes.watermark.width / imageSizes.watermark.height
      , imageRatio = imageSizes.base.width / imageSizes.base.height
      , aspect = imageRatio / watermarkRatio
      , scale
    if (aspect >= 1) {
      scale = imageSizes.base.height / imageSizes.watermark.height
    } else {
      scale = imageSizes.base.width / imageSizes.watermark.width
    }
    var watermarkSize =
      { width: Math.floor(imageSizes.watermark.width * scale)
      , height: Math.floor(imageSizes.watermark.height * scale)
      }

    return watermarkSize
  }

  function applyWatermark(err, imageSizes) {
    if (err) return self.emit('error', err)
    var newWatermarkSize = calculateWatermarkSize(imageSizes)
      , tempFilePath

    temp.track()

    self.on('end', function () {
      fs.unlink(tempFilePath)
    })

    temp.open({ suffix: '.png' }, function(err, info) {
      if (err) {
        return streamOutput(err)
      }

      tempFilePath = info.path

      gm(fs.createReadStream(watermarkPath))
        .resize(newWatermarkSize.width, newWatermarkSize.height)
        .write(info.path, function (err) {
          if (err) return streamOutput(err)

          baseImage.subCommand('composite')
            .gravity('Center')
            .dissolve(opacity)
            .in(info.path)
            .stream(streamOutput)
        })
    })
  }

  async.parallel(
    { watermark: function (cb) {
      watermarkImage.size(cb)
    }
      , base: function (cb) {
      baseImage.size(cb)
    }
    }, applyWatermark)
}

module.exports = Composite
