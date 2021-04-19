var DarkroomStream = require('./darkroom-stream'),
  gm = require('gm')

class Info extends DarkroomStream {
  pipe(dest, options) {
    options = options || {}

    if (this.resume) this.resume()

    return super.pipe(dest, options)
  }

  exec() {
    var self = this

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
                var width = size.width,
                  height = size.height

                width = [height, (height = width)][0]

                var newSize = {}
                newSize.height = height
                newSize.width = width
                newSize.orientation = true
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
