const DarkroomStream = require('./darkroom-stream')
const gm = require('gm')
const async = require('async')

class Info extends DarkroomStream {
  _getOrientation(cb) {
    const image = gm(Buffer.concat(this.chunks, this.size), 'img.jpg')
    async.parallel(
      {
        size: (cb) => image.size(cb),
        orientation: (cb) => image.orientation(cb)
      },
      (error, results) => {
        if (error) {
          return cb(error)
        }
        const { size, orientation } = results
        return cb(null, orientation[0].toLowerCase(), size)
      }
    )
  }

  exec() {
    this._getOrientation((error, orientation, size) => {
      if (error) {
        return this.emit('error', error)
      }
      if (orientation === 'r' || orientation === 'l') {
        let width = size.width
        let height = size.height

        width = [height, (height = width)][0]

        const newSize = {
          height,
          width,
          orientation: true
        }
        this.emit('data', new Buffer.from(JSON.stringify(newSize)))
      } else {
        this.emit('data', new Buffer.from(JSON.stringify(size)))
      }
      this.emit('end')
    })
  }
}

module.exports = Info
