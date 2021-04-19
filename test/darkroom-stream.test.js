var DarkroomStream = require('../lib/darkroom-stream'),
  streamToTest = require('./stream.fixture.js')

describe('DarkroomStream', function () {
  it('should act as a stream', function () {
    var darkroomStream = new DarkroomStream()
    streamToTest(darkroomStream)
  })
})
