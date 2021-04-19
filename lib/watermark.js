var DarkroomStream = require('./darkroom-stream'),
  gm = require('gm'),
  fs = require('fs'),
  async = require('async'),
  temp = require('temp')

class Watermark extends DarkroomStream {
  constructor(path, options) {
    super()
    this.width = 0
    this.height = 0
    this.crop = true
    this.watermarkPath = path
    this.options = options

    if (options.opacity === undefined) {
      this.options.opacity = 10
    }
  }

  pipe(dest, options) {
    options = options || {}
    this.width = options.width || 0
    this.height = options.height || 0
    if (options.crop === undefined) {
      this.crop = false
    }

    if (this.resume) this.resume()

    return super.pipe(dest, options)
  }

  write(chunk) {
    super.write(chunk)
  }

  exec() {
    const streamOutput = (err, stdout) => {
      if (err) {
        this.emit('error', err)
        return
      }

      stdout.on('data', this.emit.bind(this, 'data'))

      stdout.on('end', (chunk) => {
        this.emit('end', chunk)
      })
    }

    var watermarkPath = this.watermarkPath,
      baseImage = gm(Buffer.concat(this.chunks, this.size), 'img.jpg'),
      watermarkImage = gm(fs.createReadStream(watermarkPath)),
      opacity = this.options.opacity

    const calculateWatermarkSize = (imageSizes) => {
      var watermarkRatio =
          imageSizes.watermark.width / imageSizes.watermark.height,
        imageRatio = imageSizes.base.width / imageSizes.base.height,
        aspect = imageRatio / watermarkRatio,
        scale
      if (aspect >= 1) {
        scale = imageSizes.base.height / imageSizes.watermark.height
      } else {
        scale = imageSizes.base.width / imageSizes.watermark.width
      }
      var watermarkSize = {
        width: Math.floor(imageSizes.watermark.width * scale),
        height: Math.floor(imageSizes.watermark.height * scale)
      }

      return watermarkSize
    }

    const applyWatermark = (err, imageSizes) => {
      if (err) return this.emit('error', err)
      var newWatermarkSize = calculateWatermarkSize(imageSizes),
        tempFilePath

      temp.track()

      this.on('end', function () {
        fs.unlink(tempFilePath)
      })

      temp.open({ suffix: '.png' }, (err, info) => {
        if (err) {
          return streamOutput(err)
        }

        tempFilePath = info.path

        gm(fs.createReadStream(watermarkPath))
          .resize(newWatermarkSize.width, newWatermarkSize.height)
          .write(info.path, function (err) {
            if (err) return streamOutput(err)

            baseImage
              .subCommand('composite')
              .gravity('Center')
              .dissolve(opacity)
              .in(info.path)
              .stream(streamOutput)
          })
      })
    }

    async.parallel(
      {
        watermark: function (cb) {
          watermarkImage.size(cb)
        },
        base: function (cb) {
          baseImage.size(cb)
        }
      },
      applyWatermark
    )
  }
}

module.exports = Watermark
