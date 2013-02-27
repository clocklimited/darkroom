var darkroomStream = require('../lib/darkroomStream')()
, streamToTest = require('./stream.fixture.js')

describe('DarkroomStream', function () {
  it('should act as a stream', function () {
    streamToTest(darkroomStream)
  })
})