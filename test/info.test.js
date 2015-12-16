var Info = require('../lib/info')
  , join = require('path').join
  , fs = require('fs')

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

    var input = join(__dirname, 'fixtures', 'gm-1.19-does-not-like.jpg')
      , readStream = fs.createReadStream(input)
      , info = new Info()

    info.on('error', done)
    info.on('end', done)

    readStream.pipe(info).pipe(process.stdout)

  })

})
