const DarkroomStream = require('../lib/darkroom-stream')
const streamToTest = require('./stream.fixture.js')

describe('DarkroomStream', function () {
  it('should act as a stream', function () {
    const darkroomStream = new DarkroomStream()
    streamToTest(darkroomStream)
  })
})
