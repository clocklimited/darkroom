const DarkroomStream = require('./darkroom-stream')
const gm = require('gm')

class Info extends DarkroomStream {
  exec() {
    const self = this

    // TODO flatten pyramid
    gm(Buffer.concat(this.chunks, this.size), 'img.jpg').size(
      { bufferStream: true },
      function (error, size) {
        if (error) {
          self.emit('error', error)
        } else {
          this.orientation(function (error, value) {
            if (error) {
              self.emit('error', error)
            } else {
              if (
                value[0].toLowerCase() === 'r' ||
                value[0].toLowerCase() === 'l'
              ) {
                let width = size.width
                let height = size.height

                width = [height, (height = width)][0]

                const newSize = {
                  height,
                  width,
                  orientation: true
                }
                self.emit('data', new Buffer.from(JSON.stringify(newSize)))
              } else {
                self.emit('data', new Buffer.from(JSON.stringify(size)))
              }
              self.emit('end')
            }
          })
        }
      }
    )
  }
}

module.exports = Info
