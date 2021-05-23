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

  _calculateWatermarkSize({ watermark, base }) {
    const watermarkRatio = watermark.width / watermark.height
    const imageRatio = base.width / base.height
    const aspect = imageRatio / watermarkRatio
    let scale
    if (aspect >= 1) {
      scale = base.height / watermark.height
    } else {
      scale = base.width / watermark.width
    }
    const watermarkSize = {
      width: Math.floor(watermark.width * scale),
      height: Math.floor(watermark.height * scale)
    }

    return watermarkSize
  }

  exec() {
    const baseImage = gm(Buffer.concat(this.chunks, this.size), 'img.jpg')
    const watermarkImage = gm(fs.createReadStream(this.watermarkPath))
    const opacity = this.options.opacity

    const applyWatermark = (error, imageSizes) => {
      if (error) return this.emit('error', error)
      const newWatermarkSize = this._calculateWatermarkSize(imageSizes)

      temp.track()

      temp.open({ suffix: '.png' }, (error, info) => {
        if (error) {
          return this.output(error)
        }

        this.tempFilePath = info.path

        gm(fs.createReadStream(this.watermarkPath))
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
        watermark: (cb) => watermarkImage.size(cb),
        base: (cb) => baseImage.size(cb)
      },
      applyWatermark
    )
  }
}

module.exports = Watermark
