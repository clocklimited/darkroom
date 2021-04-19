const DarkroomStream = require('./darkroom-stream')
const gm = require('gm')
const fs = require('fs')
const async = require('async')
const temp = require('temp')
const rimraf = require('rimraf')

class Watermark extends DarkroomStream {
  constructor(path, options = {}) {
    super()
    this.watermarkPath = path
    this.options = options

    if (options.opacity === undefined) {
      this.options.opacity = 10
    }
  }

  cleanup(callback) {
    rimraf(this.tempFilePath, callback)
  }

  exec() {
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

    const applyWatermark = (error, imageSizes) => {
      if (error) return this.emit('error', error)
      var newWatermarkSize = calculateWatermarkSize(imageSizes)

      temp.track()

      temp.open({ suffix: '.png' }, (error, info) => {
        if (error) {
          return this.output(error)
        }

        this.tempFilePath = info.path

        gm(fs.createReadStream(watermarkPath))
          .resize(newWatermarkSize.width, newWatermarkSize.height)
          .write(info.path, (error) => {
            if (error) return this.output(error)

            baseImage
              .subCommand('composite')
              .gravity('Center')
              .dissolve(opacity)
              .in(info.path)
              .stream(this.output.bind(this))
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
