const DarkroomStream = require('./darkroom-stream')
const sharp = require('sharp')
const fileType = require('file-type')
const createGifsicle = require('./gifsicle')

class Resize extends DarkroomStream {
  constructor(options = {}) {
    super(options)
    if (options.concurrency) sharp.concurrency(Number(options.concurrency))
    console.log(666, sharp.concurrency())
  }

  constructor(...args) {
    super(...args)

    this.width = 0
    this.height = 0
  }

  _calculateCrop(widthTrim, heightTrim) {
    let widthTrimStart = widthTrim
    let heightTrimStart = heightTrim
    let widthTrimAmount = widthTrim
    let heightTrimAmount = heightTrim

    if (widthTrim !== 0) {
      widthTrimStart = widthTrim - 0.5
      widthTrimAmount = widthTrim + 0.5
    }

    if (heightTrim !== 0) {
      heightTrimStart = heightTrim - 0.5
      heightTrimAmount = heightTrim + 0.5
    }
    return (
      widthTrimStart +
      ',' +
      heightTrimStart +
      '+-' +
      widthTrimAmount +
      'x-' +
      heightTrimAmount
    )
  }

  _getGifsicleContext(cb) {
    const params = ['--colors', '256']
    const originalBuffer = Buffer.concat(this.chunks, this.size)
    const newSize = {
      width: Math.floor(this.width + 0.5),
      height: Math.floor(this.height + 0.5)
    }
    const width = newSize.width || '_'
    const height = newSize.height || '_'

    if (this.mode === 'cover') {
      return sharp(originalBuffer)
        .metadata()
        .then(({ width, height }) => {
          this._getGifsicleCoverResize(
            params,
            originalBuffer,
            { width, height },
            newSize,
            cb
          )
        })
        .catch(cb)
    } else if (this.mode === 'fit') {
      params.push('--resize-touch', width + 'x' + height)
    } else {
      params.push('--resize', width + 'x' + height)
    }

    const context = createGifsicle(params)
    context.stdin.write(originalBuffer)
    context.stdin.end()
    cb(null, context)
  }

  _getGifsicleCoverResize(params, originalBuffer, originalSize, newSize, cb) {
    // Cropping takes place before any rotation, flipping, resizing, or positioning.
    // This ensures the resize happens first
    const dimensions = this._calculateCoverResize(originalSize, newSize)
    const buffers = []
    const input = createGifsicle(params.concat('--resize', dimensions))

    input.stdout.on('data', (data) => {
      buffers.push(data)
    })
    input.stdout.on('end', () => {
      const resized = Buffer.concat(buffers)
      sharp(resized)
        .metadata()
        .then((currentSize) => {
          const widthTrim = (currentSize.width - newSize.width) / 2
          const heightTrim = (currentSize.height - newSize.height) / 2
          const crop = this._calculateCrop(widthTrim, heightTrim)
          const context = createGifsicle(['--crop', crop, '--colors', '256'])

          context.stdin.write(resized)
          context.stdin.end()
          cb(null, context)
        })
        .catch(cb)
    })

    input.stdin.write(originalBuffer)
    input.stdin.end()
  }

  _calculateCoverResize(originalSize, newSize) {
    let dimensions

    if (
      newSize.width < newSize.height ||
      (newSize.width === newSize.height &&
        originalSize.width < originalSize.height)
    ) {
      dimensions = newSize.width + 'x_'
    } else {
      dimensions = '_x' + newSize.height
    }

    return dimensions
  }

  _setTypeSpecificOptions(context, format, inputFileType, outputFileType) {
    const formatOptions = {}

    if (outputFileType !== 'png') {
      formatOptions.quality = this.quality
    }
    // keep pngs lossless
    if (format.toLowerCase() === 'webp' && inputFileType === 'png')
      formatOptions.lossless = true
    // This makes it progressive
    if (outputFileType === 'jpg') formatOptions.progressive = true

    context.toFormat(outputFileType, formatOptions)

    return context
  }

  _getSharpContext(imageFileType) {
    const outputFileType = this.format || imageFileType.ext
    let context = sharp(Buffer.concat(this.chunks, this.size))
      .rotate() // autoorient
      .toColorspace('RGB')
      .sharpen({ m1: 0.25, sigma: 0.25, y2: 8, x1: 0.065 })

    context = this._setTypeSpecificOptions(
      context,
      this.format,
      imageFileType.ext,
      outputFileType
    )

    const options = {
      width: this.width,
      height: this.height,
      position: this.gravity,
      fastShrinkOnLoad: false //https://github.com/lovell/sharp/issues/3526#issuecomment-1380048246
    }
    if (this.mode === 'fit') {
      // in sharp this has a different name to what we're used to
      context.resize(Object.assign({}, options, { fit: 'inside' }))
    } else if (this.mode === 'cover') {
      context.resize(Object.assign({}, options, { fit: 'cover' }))
    } else if (this.mode === 'pad') {
      const padOptions = {
        fit: 'contain',
        position: 'centre',
        background: {
          r: 255,
          g: 255,
          b: 255
        }
      }

      if (outputFileType !== 'jpg') {
        padOptions.background.alpha = 0
      }

      context.resize(Object.assign({}, options, padOptions))
    } else {
      context.resize(options)
    }

    return context
  }

  pipe(dest, options) {
    options = options || {}
    this.width = Math.round(options.width) || null
    this.height = Math.round(options.height) || null
    this.quality = parseInt(options.quality) || 75
    this.mode = options.mode || 'fit'
    this.format = options.format || ''
    this.gravity = (options.gravity && options.gravity.toLowerCase()) || 'north'

    if (this.mode === 'stretch' && (!this.width || !this.height))
      throw new Error('Unable to stretch to a single dimension constant')

    return super.pipe(dest, options)
  }

  exec() {
    const imageFileType = fileType(this.chunks[0])
    let context

    if (imageFileType === null) {
      this.emit('error', new Error('Unsupported file type'))
      return false
    }

    if (imageFileType.ext !== 'gif') {
      context = this._getSharpContext(imageFileType)
      this.output(null, context)
    } else {
      context = this._getGifsicleContext((error, context) => {
        if (error) {
          return this.output(error)
        }
        this.output(null, context.stdout)
      })
    }
  }
}

module.exports = Resize
