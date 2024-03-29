const DarkroomStream = require('./darkroom-stream')
const sharp = require('sharp')
const fileType = require('file-type')
const createGifsicle = require('./gifsicle')

class Crop extends DarkroomStream {
  constructor(options = {}) {
    super(options)

    if (options.concurrency) sharp.concurrency(Number(options.concurrency))
  }

  pipe(dest, options) {
    options = options || {}
    this.crop = options.crop || {}
    this.quality = parseInt(options.quality) || 82

    return super.pipe(dest, options)
  }

  _getRoundedCoords() {
    return {
      x1: Math.ceil(this.crop.x1 - 0.5),
      y1: Math.ceil(this.crop.y1 - 0.5),
      width: Math.round(this.crop.w),
      height: Math.round(this.crop.h)
    }
  }

  exec() {
    const imageFileType = fileType(this.chunks[0])
    let context

    if (imageFileType === null) {
      this.emit('error', new Error('Unsupported file type'))
      return false
    }

    const originalBuffer = Buffer.concat(this.chunks, this.size)
    if (imageFileType.ext !== 'gif') {
      const coords = this._getRoundedCoords()
      context = sharp(originalBuffer)
        .rotate()
        .toColorspace('RGB')
        .sharpen({ m1: 0.25, sigma: 0.25, y2: 8, x1: 0.065 })
        .extract({
          left: coords.x1 || 0,
          top: coords.y1 || 0,
          width: coords.width,
          height: coords.height
        })

      if (imageFileType.ext === 'png') {
        context = context.png({ quality: this.quality })
      }

      if (imageFileType.ext === 'jpg') {
        // This makes it progressive
        context = context.jpeg({ progessive: true, quality: this.quality })
      }

      this.sharp(context)
    } else if (imageFileType.ext === 'gif') {
      // this is the rounding graphicsmagick uses for geometry, we we're using it for gifs
      const coords = this._getRoundedCoords()
      const roundedX1 = coords.x1
      const roundedY1 = coords.y1
      const roundedWidth = coords.width
      const roundedHeight = coords.height
      const crop =
        roundedX1 + ',' + roundedY1 + '+' + roundedWidth + 'x' + roundedHeight
      context = createGifsicle(['--crop', crop, '--colors', '256'])
      context.stdin.write(originalBuffer)
      context.stdin.end()
      this.output(null, context.stdout)
    }
  }
}

module.exports = Crop
