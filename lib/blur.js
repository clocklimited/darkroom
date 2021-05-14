const DarkroomStream = require('./darkroom-stream')
const gm = require('gm')
const temp = require('temp')
const async = require('async')
const rimraf = require('rimraf')

/**
 * Given an image and an array of co-ords arrays, censor portions of an image
 *
 * A coords array is in a format similar to:
 *
 * [ [ [100, 100], [ 100, 200 ], [ 200, 100 ] ] ]
 */
class Blur extends DarkroomStream {
  constructor(options = {}) {
    super(options)
    this.options = options
    this.options.colour = this.options.colour || 'none'
    this.dimensions = []
    this.masks = options.masks || []
    this.method = options.method || 'pixellate'
  }

  cleanup(cb) {
    rimraf(this.tempDir, cb)
  }

  _createMask(size, cb) {
    const width = size.width
    const height = size.height
    const multiplier = 4

    this.maskPath = temp.path({ dir: this.tempDir, suffix: '.png' })

    // Multiply each height and width by a set multiplier in order to
    // remove jagged edges from resulting image
    //
    // http://stackoverflow.com/a/22940729
    let mask = gm(width * multiplier, height * multiplier, 'black')

    if (!this.masks.length) {
      this.masks.push([
        [0, 0],
        [0, height],
        [width, height],
        [width, 0]
      ])
    }

    try {
      for (const polygon of this.masks) {
        const coords = polygon.map(([x, y]) => [x * multiplier, y * multiplier])
        mask = mask.fill('white').drawPolygon(...coords)
      }
    } catch (err) {
      this.output(err)
    }

    return mask.resize('25%').quality(100).write(this.maskPath, cb)
  }

  _createBlur(image, cb) {
    this.blurPath = temp.path({ dir: this.tempDir, suffix: '.png' })

    if (this.method === 'blur') {
      return gm(image).gaussian(20, 10).write(this.blurPath, cb)
    }

    return gm(image).resize('25%').scale('400%').write(this.blurPath, cb)
  }

  // gm().composite() doesnt support passing in a buffer
  // as a base image, so we need to write it to disk first
  _writeImage(image, cb) {
    this.baseImagePath = temp.path({ dir: this.tempDir, suffix: 'base-image' })
    gm(image).quality(100).write(this.baseImagePath, cb)
  }

  _createCropped(image, cb) {
    this._writeImage(image, (error) => {
      if (error) return cb(error)
      const outImage = gm(this.baseImagePath).composite(
        this.blurPath,
        this.maskPath
      )

      outImage.stream(cb)
    })
  }

  _getImageSize(image, cb) {
    return gm(image).size(cb)
  }

  exec() {
    const image = Buffer.concat(this.chunks, this.size)

    async.parallel(
      {
        tempDir: temp.mkdir.bind(null, 'circle'),
        size: this._getImageSize.bind(null, image)
      },
      (error, results) => {
        if (error) return this.output(error)

        const { size, tempDir } = results
        this.tempDir = tempDir

        async.series(
          {
            blur: this._createBlur.bind(this, image),
            mask: this._createMask.bind(this, size),
            output: this._createCropped.bind(this, image)
          },
          (error, imageResults) => {
            if (error) return this.output(error)
            const { output } = imageResults
            this.output(null, output[0])
          }
        )
      }
    )
  }
}

module.exports = Blur
