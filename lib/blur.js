const DarkroomStream = require('./darkroom-stream')
const sharp = require('sharp')
const fileType = require('file-type')

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
    this.blurAmount = options.blurAmount || 15
  }

  _createMask(size) {
    const width = size.width
    const height = size.height

    if (!this.masks.length) {
      this.masks.push([
        [0, 0],
        [0, height],
        [width, height],
        [width, 0]
      ])
    }

    let mask = '<clipPath id="mask">'

    for (const polygon of this.masks) {
      const coords = polygon.map(([x, y]) => `${x},${y}`)

      mask += `<polygon points="${coords.join(' ')}" />`
    }

    mask += '</clipPath>'

    return mask
  }

  _createSvg(mask, type, image, size) {
    const base64 = image.toString('base64')
    const xml = `<svg height="${size.height}" width="${size.width}" xmlns="http://www.w3.org/2000/svg">
      ${mask}
      <filter id="blur">
        <feGaussianBlur in="SourceGraphic" stdDeviation="${this.blurAmount}" />
      </filter>
      <image height="${size.height}" width="${size.width}" href="data:${type.mime};;base64,${base64}" />
      <image clip-path="url(#mask)" filter="url(#blur)" height="${size.height}" width="${size.width}" href="data:${type.mime};base64,${base64}" />
    </svg>`

    return Buffer.from(xml)
  }

  _createBlurred(svg, cb) {
    const outImage = sharp(svg)

    if (this.format) {
      outImage.toFormat(this.format, { quality: this.quality })
    }

    cb(null, outImage)
  }

  _getImageInfo(image, cb) {
    return sharp(image).metadata(cb)
  }

  pipe(dest, options) {
    options = options || {}
    this.quality = options.quality || 75
    this.format = options.format || ''

    return super.pipe(dest, options)
  }

  exec() {
    const image = Buffer.concat(this.chunks, this.size)
    const imageFileType = fileType(this.chunks[0])

    this._getImageInfo(image, (error, info) => {
      if (error) return this.output(error)

      if (!this.format) {
        this.format = imageFileType.ext
      }

      let svg

      try {
        const mask = this._createMask(info)
        svg = this._createSvg(mask, imageFileType, image, info)
      } catch (e) {
        return this.output(e)
      }

      this._createBlurred(svg, (error, output) => {
        if (error) return this.output(error)
        this.output(null, output)
      })
    })
  }
}

module.exports = Blur
