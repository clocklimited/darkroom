const DarkroomStream = require('./darkroom-stream')
const gm = require('gm')

class Info extends DarkroomStream {
  _getOrientation(cb) {
    gm(Buffer.concat(this.chunks, this.size), 'img.jpg').size(
      { bufferStream: true },
      function (error, size) {
        if (error) {
          return cb(error)
        }
        this.orientation(function (error, value) {
          if (error) {
            return cb(error)
          }
          return cb(null, value[0].toLowerCase(), size)
        })
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
