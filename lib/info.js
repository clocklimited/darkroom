module.exports = Info

var DarkroomStream = require('./darkroom-stream'),
  Stream = require('stream').Stream,
  gm = require('gm')

function Info() {
  if (!(this instanceof Info)) return new Info()
  DarkroomStream.call(this)
}

Info.prototype = Object.create(DarkroomStream.prototype)

Info.prototype.pipe = function (dest, options) {
  options = options || {}

  var self = this

  if (self.resume) self.resume()

  return Stream.prototype.pipe.call(self, dest, options)
}

Info.prototype.write = function (chunk) {
  DarkroomStream.prototype.write.call(this, chunk)
}

Info.prototype.end = function (chunk) {
  DarkroomStream.prototype.end.call(this, chunk)
  this.exec.call(this)
}

Info.prototype.exec = function () {
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
              self.emit('data', new Buffer(JSON.stringify(newSize)))
            } else {
              self.emit('data', new Buffer(JSON.stringify(size)))
            }
            self.emit('end')
          }
        })
      }
    }
  )
}
