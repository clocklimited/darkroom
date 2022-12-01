const DarkroomStream = require('./darkroom-stream')
const sharp = require('sharp')
const fileType = require('file-type')
const createGifsicle = require('./gifsicle')

class Crop extends DarkroomStream {
  pipe(dest, options) {
    options = options || {}
    this.crop = options.crop || {}
    this.quality = options.quality || 82
    this.gravity = options.gravity || 'NorthWest'

    return super.pipe(dest, options)
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
      context = sharp(originalBuffer)
        .rotate()
        .toColorspace('RGB')
        .sharpen({ m1: 0.25, sigma: 0.625, y2: 8, x1: 0.065 })
        .extract({
          left: Math.round(this.crop.x1 || 0),
          top: Math.round(this.crop.y1 || 0),
          width: Math.round(this.crop.w),
          height: Math.round(this.crop.h)
        })
        .resize(Math.round(this.crop.w), Math.round(this.crop.h), {
          gravity: this.gravity.toLowerCase()
        })

      // context = gm(originalBuffer)
      //   .options({ nativeAutoOrient: true })
      //   .autoOrient()
      //   .colorspace('RGB')
      //   .gravity(this.gravity)
      //   .noProfile()
      //   .bitdepth(8)
      //   .unsharp(0.25, 0.25, 8, 0.065)
      //   .crop(this.crop.w, this.crop.h, this.crop.x1, this.crop.y1)

      if (imageFileType.ext === 'png') {
        context = context.png({ quality: this.quality })
      }

      if (imageFileType.ext === 'jpg') {
        // This makes it progressive
        context = context.jpeg({ progessive: true, quality: this.quality })
      }

      // eslint-disable-next-line no-console
      this.sharp(context)
    } else if (imageFileType.ext === 'gif') {
      // this is the rounding graphicsmagick uses for geometry
      const roundedX1 = Math.ceil(this.crop.x1 - 0.5)
      const roundedY1 = Math.ceil(this.crop.y1 - 0.5)
      const roundedWidth = Math.floor(this.crop.w + 0.5)
      const roundedHeight = Math.floor(this.crop.h + 0.5)
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
