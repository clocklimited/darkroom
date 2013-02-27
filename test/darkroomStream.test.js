var darkroomStream = require('../lib/darkroomStream')
  , stream = require('stream')


describe('DarkroomStream', function () {
  it('should act as a stream', function (done) {
    var source = new stream.Stream()
      , dest = new stream.Stream()

    source.readable = true
    dest.writable = true

    source.pipe(darkroomStream)

    var i = 0

    while (i !== 100) {
      source.emit('data', 'ssvsv')
      i++
    }

    process.nextTick(function () {
      darkroomStream.chunks.should.have.lengthOf(100)
      i = 0
      dest.write = function () {
        i++
      }

      darkroomStream.pipe(dest).should.equal(dest)
      process.nextTick(function () {
        i.should.equal(100)
        done()
      })
    })
  })
})