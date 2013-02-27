var resizeCanvas = require('../lib/canvas/resize')
  , fs = require('fs')
  , join = require('path').join
  , imageFixture = join(__dirname, 'fixtures', 'bill.png')
  , tmpLocation = join(__dirname, 'fixtures', 'temp')
  , Canvas = require('canvas')
  , Image = Canvas.Image
  , canvas
  , pngStream

describe('ResizeCanvas', function() {

  beforeEach(function() {
    canvas = new Canvas()
    pngStream = canvas.pngStream()
  })

  it('should resize and crop an image to 100x100', function () {
    canvas.width = 100
    canvas.height = 100
    var test = resizeCanvas(fs.readFileSync(imageFixture), new Image(), canvas)
      , writeStream = fs.createWriteStream(join(tmpLocation, '100x100.png'))
    test.onerror = function (error) {
      throw error
    }
    pngStream.pipe(writeStream)
  })

})