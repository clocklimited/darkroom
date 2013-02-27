var stream = require('stream')
  , util = require('util')

var DarkroomStream = function () {
  this.writeable = true
  this.readable = true
}

util.inherits(DarkroomStream, stream.Stream)

var DarkroomStream = function () {
  if (!(this instanceof DarkroomStream))
    return new DarkroomStream()
  this.size = 0
  this.chunks = []
  this.writable = true
  this.readable = true
}

util.inherits(DarkroomStream, stream.Stream)

DarkroomStream.prototype.pipe = function (dest, options) {
  var self = this
  if (self.resume)
    self.resume()

  stream.Stream.prototype.pipe.call(self, dest, options)

  if(this.piped)
    return dest

  process.nextTick(function () {
    self.chunks.forEach(function (c) {self.emit('data', c)})
    self.size = 0
  ; delete self.chunks
    if(self.ended)
      self.emit('end')
  })
  this.piped = true

  return dest
}

DarkroomStream.prototype.write = function (chunk) {
  if (!this.chunks) {
    //just discard data when the stream has been ended.
    this.emit('data', chunk)
    return
  }
  this.chunks.push(chunk)
  this.size += chunk.length
}

module.exports = new DarkroomStream()