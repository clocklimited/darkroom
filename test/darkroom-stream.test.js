var darkroomStream = require('../lib/darkroom-stream')(),
  streamToTest = require('./stream.fixture.js')

describe('DarkroomStream', function () {
  it('should act as a stream', function () {
    streamToTest(darkroomStream)
  })
})
