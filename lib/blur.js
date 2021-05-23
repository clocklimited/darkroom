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

    this.maskPath = temp.path({ dir: this.tempDir, suffix: 'mask.png' })

    // Multiply each height and width by a set multiplier in order to
    // remove jagged edges from resulting image
    //
    // http://stackoverflow.com/a/22940729
    let mask = gm(width * multiplier, height * multiplier, 'white')

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
        mask = mask.fill('black').drawPolygon(...coords)
      }
    } catch (err) {
      this.output(err)
    }

    return mask.resize(width, height).quality(100).write(this.maskPath, cb)
  }

  _createBlur(image, size, cb) {
    this.blurPath = temp.path({
      dir: this.tempDir,
      suffix: 'blurred-image.png'
    })

    if (this.method === 'gaussian') {
      return gm(image)
        .gaussian(size.width / 15, size.width / 5)
        .write(this.blurPath, cb)
    }

    return gm(image).resize(96).scale(size.width).write(this.blurPath, cb)
  }

  // gm().composite() doesnt support passing in a buffer
  // as a base image, so we need to write it to disk first
  _writeImage(image, cb) {
    this.baseImagePath = temp.path({ dir: this.tempDir, suffix: 'base-image' })
    gm(image).quality(100).write(this.baseImagePath, cb)
  }

  _createBlurred(image, cb) {
    this._writeImage(image, (error) => {
      if (error) return cb(error)

      const outImage = gm(this.blurPath).composite(
        this.baseImagePath,
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
        tempDir: temp.mkdir.bind(null, 'blur'),
        size: this._getImageSize.bind(null, image)
      },
      (error, results) => {
        if (error) return this.output(error)

        const { size, tempDir } = results
        this.tempDir = tempDir

        async.parallel(
          {
            blur: this._createBlur.bind(this, image, size),
            mask: this._createMask.bind(this, size)
          },
          (error) => {
            if (error) return this.output(error)
            this._createBlurred(image, (error, output) => {
              if (error) return this.output(error)
              this.output(null, output)
            })
          }
        )
      }
    )
  }
}

module.exports = Blur