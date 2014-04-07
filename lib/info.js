var util = require('util')
  , DarkroomStream = require('./darkroomStream')
  , Stream = require('stream').Stream
  , gm = require('gm')

var Info = function() {
  if (!(this instanceof Info))
    return new Info()
  DarkroomStream.call(this)
}

util.inherits(Info, DarkroomStream)

Info.prototype.pipe = function (dest, options) {
  options = options || {}

  var self = this

  if (self.resume)
    self.resume()

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

  gm(Buffer.concat(this.chunks, this.size), 'img.jpg')
    .size(function(error, value) {
      if (error) {
        self.emit('error', error)
      }
      else {
        self.emit('data', new Buffer(JSON.stringify(value)))
        self.emit('end')
      }

    }
  )
  //   , image = new InfoCanvas()

  // image.onerror = function (error) {
  //   self.emit('error', error)
  // }

  // image.onload = function (chunk) {
  //   self.emit('data', new Buffer(JSON.stringify(chunk)))
  //   self.emit('end')
  // }

  // image.info(Buffer.concat(this.chunks, this.size), new Image())
}

module.exports = Info