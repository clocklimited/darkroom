var stream = require('stream')
  , assert = require('assert')

module.exports = function (streamToTest) {
  var source = new stream.Stream()
    , dest = new stream.Stream()

  source.readable = true
  dest.writable = true

  streamToTest.on('error', function() {})

  source.pipe(streamToTest)

  var i = 0

  while (i !== 100) {
    source.emit('data', 'data!')
    i++
  }

  source.emit('end')

  process.nextTick(function () {
    assert(streamToTest.chunks.length > 0)
    i = 0
    dest.write = function () {
      i++
    }

    dest.end = function () {}

    streamToTest.pipe(dest).should.equal(dest)
  })
}