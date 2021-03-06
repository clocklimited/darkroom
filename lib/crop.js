const DarkroomStream = require('./darkroom-stream')
const gm = require('gm')
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
      context = gm(originalBuffer)
        .options({ nativeAutoOrient: true })
        .autoOrient()
        .colorspace('RGB')
        .gravity(this.gravity)
        .noProfile()
        .bitdepth(8)
        .unsharp(0.25, 0.25, 8, 0.065)
        .crop(this.crop.w, this.crop.h, this.crop.x1, this.crop.y1)

      if (imageFileType.ext !== 'png') {
        context = context.quality(this.quality)
      }

      if (imageFileType.ext === 'jpg') {
        // This makes it progressive
        context = context.interlace('Line')
      }
      context.stream(this.output.bind(this))
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
