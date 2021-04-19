const { Stream } = require('stream')

class DarkroomStream extends Stream {
  constructor(...args) {
    super(...args)
    this.size = 0
    this.chunks = []
    this.writable = true
    this.readable = true
  }

  pipe(dest, options) {
    if (this.resume) this.resume()
    super.pipe(dest, options)

    if (this.piped) return dest

    process.nextTick(() => {
      if (this.ended) {
        this.emit('end')
      }
    })

    this.piped = true

    return dest
  }

  write(chunk) {
    if (!this.writable) {
      throw new Error('Stream is not writable')
    }

    if (this.ended) {
      throw new Error('Stream is already ended')
    }

    if (typeof chunk === 'string') {
      chunk = Buffer.from(chunk)
    } else if (!Buffer.isBuffer(chunk)) {
      return this.emit(
        'error',
        new Error('Chunk must be either a string or a Buffer')
      )
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

  end(chunk) {
    if (this.ended) {
      throw new Error('Stream is already ended')
    }

    if (chunk != null) this.write(chunk)

    if (!this.chunks) {
      this.emit('end')
    } else {
      this.ended = true
    }

    if (this.exec) {
      this.exec()
    }
  }

  // Stub for cleanup (e.g. remove temp files)
  cleanup(cb) {
    cb()
  }

  output(error, stdout, stderr) {
    if (error) {
      this.emit('error', error)
      return
    }

    stdout.on('data', this.emit.bind(this, 'data'))
    if (stderr) {
      stderr.on('data', this.emit.bind(this, 'error'))
    }

    stdout.on('end', (chunk) => {
      this.cleanup((error) => {
        if (error) {
          this.emit('error', error)
        }
        this.emit('end', chunk)
      })
    })
  }
}

module.exports = DarkroomStream
