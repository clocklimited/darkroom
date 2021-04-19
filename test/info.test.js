const Info = require('../lib/info')
const { join } = require('path')
const fs = require('fs')
const assert = require('assert')
const streamAssert = require('stream-assert')

describe('InfoStream', function () {
  it('should work with this specific image that was failing with gm@1.19.0', function (done) {
    // Note
    //
    // With gm@1.19, running the gm `size()` operation caused an ECONNRESET error to
    // be thrown with some specific images. It appears to be the same as this issue
    // https://github.com/aheckmann/gm/issues/448 which was fixed in gm@1.20.
    //
    // One of the specific failing images is included in the fixtures directory and is
    // used in this test.
    //
    // This test fails when gm@1.19.0 is used, and passes with gm@>1.19.

    const input = join(__dirname, 'fixtures', 'gm-1.19-does-not-like.jpg')
    const readStream = fs.createReadStream(input)
    const info = new Info()

    info.on('error', done)

    readStream
      .pipe(info)
      .pipe(
        streamAssert.first((data) =>
          assert.strictEqual(data.toString(), '{"width":1500,"height":843}')
        )
      )
      .pipe(streamAssert.end(done))
  })

  it('should report orientation correctly', function (done) {
    const input = join(__dirname, 'fixtures', 'oriented-right-in-exif.jpeg')
    const readStream = fs.createReadStream(input)
    const info = new Info()

    info.on('error', done)

    readStream
      .pipe(info)
      .pipe(
        streamAssert.first((data) =>
          assert.strictEqual(
            data.toString(),
            '{"height":884,"width":720,"orientation":true}'
          )
        )
      )
      .pipe(streamAssert.end(done))
  })

  it('should trigger error with a corrupted image', function (done) {
    const readStream = fs.createReadStream(
      join(__dirname, 'fixtures', 'broken-image.png')
    )
    const info = new Info()

    readStream.pipe(info)

    info.on('error', function () {
      done()
    })
  })
})
