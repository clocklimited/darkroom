module.exports = DarkroomStream

var stream = require('stream')
  , util = require('util')

function DarkroomStream() {
  if (!(this instanceof DarkroomStream))
    return new DarkroomStream()
  stream.Stream.call(this)
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

  if (this.piped) return dest

  process.nextTick(function () {
  //   // self.chunks.forEach(function (c) {self.emit('data', c)})
  //   self.size = 0
  // ; delete self.chunks
    if (self.ended) {
      self.emit('end')
    }
  })

  this.piped = true

  return dest
}

DarkroomStream.prototype.write = function (chunk) {
  if (!this.writable) {
    throw new Error('Stream is not writable');
  }

  if (this.ended) {
    throw new Error('Stream is already ended');
  }

  if (typeof chunk === 'string') {
    chunk = new Buffer(chunk)
  } else if (!Buffer.isBuffer(chunk)) {
    return this.emit('error', new Error('Chunk must be either a string or a Buffer'))
  }

  if (!this.chunks) {
    //just discard data when the stream has been ended.
    this.emit('data', chunk)
    return
  }
  this.chunks.push(chunk)
  this.size += chunk.length
  return true
}

DarkroomStream.prototype.end = function (chunk) {
  if (this.ended) {
    throw new Error('Stream is already ended')
  }

  if (chunk != null) this.write(chunk)

  if (!this.chunks) {
    this.emit('end')
  } else {
    this.ended = true
  }
}
