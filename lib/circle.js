const DarkroomStream = require('./darkroom-stream')
const gm = require('gm')
const temp = require('temp')
const async = require('async')
const rimraf = require('rimraf')

class Circle extends DarkroomStream {
  constructor(options = {}) {
    super(options)
    this.options = options
    this.options.colour = this.options.colour || 'none'
    this.dimensions = []
  }

  cleanup(cb) {
    rimraf(this.tempDir, cb)
  }

  _ensureCircleGeometry(width, height) {
    this.options.x0 = this.options.x0 || width / 2
    this.options.y0 = this.options.y0 || height / 2
    this.options.x1 = this.options.x1 || width * 0.8
    this.options.y1 = this.options.y1 || height * 0.8
  }

  _createMask(size, cb) {
    const width = size.width
    const height = size.height
    const multiplier = 4

    this.maskPath = temp.path({ dir: this.tempDir, suffix: '.png' })

    this._ensureCircleGeometry(width, height)

    // Multiply each height and width by a set multiplier in order to
    // remove jagged edges from resulting image
    //
    // http://stackoverflow.com/a/22940729
    return gm(width * multiplier, height * multiplier, 'none')
      .drawCircle(
        this.options.x0 * multiplier,
        this.options.y0 * multiplier,
        this.options.x1 * multiplier,
        this.options.y1 * multiplier
      )
      .resize('25%')
      .quality(100)
      .write(this.maskPath, cb)
  }

  // gm().composite() doesnt support passing in a buffer
  // as a base image, so we need to write it to disk first
  _writeImage(image, cb) {
    this.baseImagePath = temp.path({ dir: this.tempDir, suffix: 'base-image' })
    gm(image).quality(100).write(this.baseImagePath, cb)
  }

  _writeColourBackground(size, cb) {
    if (this.options.colour === 'none') return cb()

    this.backgroundImagePath = temp.path({ dir: this.tempDir, suffix: '.jpg' })

    gm(size.width, size.height, this.options.colour)
      .quality(100)
      .write(this.backgroundImagePath, cb)
  }

  _createCropped(image, cb) {
    this._writeImage(image, (error) => {
      if (error) return cb(error)
      const outImage = gm()
        .compose('In')
        .quality(100)
        .composite(this.baseImagePath, this.maskPath)

      if (this.backgroundImagePath) {
        outImage.compose('Over').composite(this.backgroundImagePath)
      }

      outImage.stream(cb)
    })
  }

  _getImageSize(image, cb) {
    return gm(image).size(cb)
  }

  exec() {
    const emitError = (error) => {
      return this.emit('error', error)
    }

    const image = Buffer.concat(this.chunks, this.size)

    async.parallel(
      {
        tempDir: temp.mkdir.bind(null, 'circle'),
        size: this._getImageSize.bind(null, image)
      },
      (error, results) => {
        if (error) return emitError(error)

        const { size, tempDir } = results
        this.tempDir = tempDir

        async.series(
          {
            mask: this._createMask.bind(this, size),
            colourBackground: this._writeColourBackground.bind(this, size),
            output: this._createCropped.bind(this, image)
          },
          (error, imageResults) => {
            if (error) return emitError(error)
            const { output } = imageResults
            this.output(null, output[0])
          }
        )
      }
    )
  }
}

module.exports = Circle
