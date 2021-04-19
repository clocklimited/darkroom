const DarkroomStream = require('./darkroom-stream')
const gm = require('gm')
const fileType = require('file-type')
const createGifsicle = require('./gifsicle')

class Resize extends DarkroomStream {
  constructor(...args) {
    super(...args)

    this.width = 0
    this.height = 0
  }

  pipe(dest, options) {
    options = options || {}
    this.width = options.width || null
    this.height = options.height || null
    this.quality = options.quality || 75
    this.mode = options.mode || 'fit'
    this.format = options.format || ''

    if (
      this.mode === 'stretch' &&
      (this.width === null || this.height === null)
    )
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
      context = getGmContext.call(this, imageFileType)
      context.stream(this.output.bind(this))
    } else {
      context = getGifsicleContext.call(this, (error, context) => {
        if (error) {
          return this.output(error)
        }
        this.output(null, context.stdout)
      })
    }
  }
}

// TODO move into class
function getGifsicleContext(cb) {
  const params = ['--colors', '256']
  const originalBuffer = Buffer.concat(this.chunks, this.size)
  const newSize = {
    width: Math.floor(this.width + 0.5),
    height: Math.floor(this.height + 0.5)
  }
  const width = newSize.width || '_'
  const height = newSize.height || '_'

  if (this.mode === 'cover') {
    return gm(originalBuffer).size(
      function (error, originalSize) {
        if (error) {
          return cb(error)
        }
        getGifsicleCoverResize.call(
          this,
          params,
          originalBuffer,
          originalSize,
          newSize,
          cb
        )
      }.bind(this)
    )
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

function getGifsicleCoverResize(
  params,
  originalBuffer,
  originalSize,
  newSize,
  cb
) {
  // Cropping takes place before any rotation, flipping, resizing, or positioning.
  // This ensures the resize happens first
  const dimensions = calculateCoverResize(originalSize, newSize)
  const buffers = []
  const input = createGifsicle(params.concat('--resize', dimensions))

  input.stdout.on('data', function (data) {
    buffers.push(data)
  })
  input.stdout.on('end', function () {
    const resized = Buffer.concat(buffers)
    gm(resized).size(function (err, currentSize) {
      if (err) return cb(err)

      const widthTrim = (currentSize.width - newSize.width) / 2
      const heightTrim = (currentSize.height - newSize.height) / 2
      const crop = calculateCrop(widthTrim, heightTrim)
      const context = createGifsicle(['--crop', crop, '--colors', '256'])

      context.stdin.write(resized)
      context.stdin.end()
      cb(null, context)
    })
  })

  input.stdin.write(originalBuffer)
  input.stdin.end()
}

function calculateCoverResize(originalSize, newSize) {
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

function calculateCrop(widthTrim, heightTrim) {
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

function getGmContext(imageFileType) {
  function setTypeSpecificOptions(
    context,
    format,
    inputFileType,
    outputFileType
  ) {
    if (format) context.setFormat(format)
    // keep pngs lossless
    if (format.toLowerCase() === 'webp' && inputFileType === 'png')
      context.define('webp:lossless=true')
    // This makes it progressive
    if (outputFileType === 'jpg') context = context.interlace('Line')
  }

  const outputFileType = this.format || imageFileType.ext
  let context = gm(Buffer.concat(this.chunks, this.size))
    .options({ nativeAutoOrient: true })
    .autoOrient()
    .colorspace('RGB')
    .gravity('North')
    .noProfile()
    .bitdepth(8)
    .unsharp(0.25, 0.25, 8, 0.065)
    .quality(this.quality)

  setTypeSpecificOptions(
    context,
    this.format,
    imageFileType.ext,
    outputFileType
  )

  if (this.mode === 'fit') {
    context.resize(this.width, this.height)
  } else if (this.mode === 'cover') {
    context
      .resize(this.width, this.height, '^')
      .background('transparent')
      .extent(this.width, this.height)
  } else if (this.mode === 'pad') {
    if (outputFileType !== 'jpg') {
      context = context.background('transparent')
    }

    context
      .gravity('Center')
      .resize(this.width, this.height)
      .extent(this.width, this.height)
  } else {
    context.resize(this.width, this.height, '!')
  }

  return context
}

module.exports = Resize
