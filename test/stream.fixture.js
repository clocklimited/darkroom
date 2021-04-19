const stream = require('stream')
const assert = require('assert')

module.exports = function (streamToTest) {
  const source = new stream.Stream()
  const dest = new stream.Stream()

  source.readable = true
  dest.writable = true

  streamToTest.on('error', () => {})

  source.pipe(streamToTest)

  let i = 0

  while (i !== 100) {
    source.emit('data', 'data!')
    i++
  }

  source.emit('end')

  process.nextTick(() => {
    assert(streamToTest.chunks.length > 0)
    i = 0
    dest.write = () => i++
    dest.end = () => {}

    streamToTest.pipe(dest).should.equal(dest)
  })
}
