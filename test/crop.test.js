var assert = require('assert')
  , CropStream = require('../lib/crop')
  , DarkroomStream = require('../lib/darkroom-stream')
  , join = require('path').join
  , tmp
  , temp = require('temp')
  , rimraf = require('rimraf')
  , fs = require('fs')
  , gm = require('gm')

describe('CropStream', function() {

  before(function () {
    temp.mkdir('crop-test', function(err, path) {
      tmp = path
    })
  })

  after(function () {
    // If you need to see some of the image diffs from failing test comment
    // out this line.
    rimraf.sync(tmp)
  })

  it('should be a DarkroomStream', function () {
    var s = new CropStream()
    assert(s instanceof DarkroomStream)
  })

  describe('orientation', function () {
    it('should auto orient the image for the cropped output', function (done) {
      var options = {
          crop:
            { w: 300
            , h: 200
            }
        }
        , image = new CropStream()
        , input = join(__dirname, 'fixtures', 'oriented-right-in-exif.jpeg')
        , out = join(tmp, 'oriented-right-in-exif-cropped.jpeg')
        , readStream = fs.createReadStream(input)
        , writeStream = fs.createWriteStream(out)
        , expectedOut = join(__dirname, 'fixtures', 'oriented-right-in-exif-cropped-expected.jpeg')

      readStream.pipe(image).pipe(writeStream, options)

      writeStream.on('close', function () {
        var options =
        { file: join(tmp, 'oriented-right-in-exif-cropped-diff.jpeg')
        , tolerance: 0.001
        , highlightColor: 'yellow'
        }
        gm.compare(out, expectedOut, options, function(err, isEqual, equality, raw) {
          assert.equal(isEqual, true, 'Images do not match see ‘' +  options.file + '’ for a diff.\n' + raw)
          done()
        })
      })
    })
  })

  describe('gravity', function () {
    it('should return an image of the requested size when a portrait image is cropped', function (done) {
      var options = {
          crop: {
            w: 720
          , h: 480
          }
        , gravity: 'Center'
        }
        , image = new CropStream()
        , out = join(tmp, 'gravity-portrait-cropped-test.png')
        , input = join(__dirname, 'fixtures', 'gravity-portrait-original.jpeg')
        , readStream = fs.createReadStream(input)
        , writeStream = fs.createWriteStream(out)
        , expectedOut = join(__dirname, 'fixtures', 'gravity-portrait-cropped.jpeg')

      readStream.pipe(image).pipe(writeStream, options)

      writeStream.on('close', function () {
        var options =
        { file: join(tmp, 'gravity-portrait-cropped-diff.jpeg')
        , tolerance: 0.001
        , highlightColor: 'yellow'
        }
        gm.compare(out, expectedOut, options, function(err, isEqual, equality, raw) {
          assert.equal(isEqual, true, 'Images do not match see ‘' +  options.file + '’ for a diff.\n' + raw)
          done()
        })
      })

    })

    it('should return an image of the requested size when a landscape image is cropped', function (done) {
      var options = {
          crop: {
            w: 400
          , h: 400
          }
        , gravity: 'Center'
        }
        , image = new CropStream()
        , out = join(tmp, 'gravity-landscape-cropped-test.png')
        , input = join(__dirname, 'fixtures', 'gravity-landscape-original.jpeg')
        , readStream = fs.createReadStream(input)
        , writeStream = fs.createWriteStream(out)
        , expectedOut = join(__dirname, 'fixtures', 'gravity-landscape-cropped.jpeg')

      readStream.pipe(image).pipe(writeStream, options)

      writeStream.on('close', function () {
        var options =
        { file: join(tmp, 'gravity-landscape-cropped-diff.jpeg')
        , tolerance: 0.001
        , highlightColor: 'yellow'
        }
        gm.compare(out, expectedOut, options, function(err, isEqual, equality, raw) {
          assert.equal(isEqual, true, 'Images do not match see ‘' +  options.file + '’ for a diff.\n' + raw)
          done()
        })
      })
    })
  })

  describe('gif', function () {
    it('should correctly crop single page gif', function (done) {
      var options = {
          crop: {
            w: 90
          , h: 80
          , x1: 100
          , y1: 30
          }
        , gravity: 'NorthWest'
        }
        , image = new CropStream()
        , input = join(__dirname, 'fixtures', 'test-pattern.gif')
        , out = join(tmp, 'test-pattern-test.gif')
        , readStream = fs.createReadStream(input)
        , writeStream = fs.createWriteStream(out)
        , expectedOut = join(__dirname, 'fixtures', 'test-pattern-cropped.gif')

      readStream.pipe(image).pipe(writeStream, options)

      writeStream.on('close', function () {
        var options =
        { file: join(tmp, 'animated-cropped-diff.gif')
        , tolerance: 0.001
        , highlightColor: 'yellow'
        }
        gm.compare(out, expectedOut, options, function(err, isEqual, equality, raw) {
          assert.equal(isEqual, true, 'Images do not match see ‘' +  options.file + '’ for a diff.\n' + raw)
          done()
        })
      })
    })

    it('should correctly crop animated gif', function (done) {
      var options = {
          crop: {
            w: 90
          , h: 80
          , x1: 100
          , y1: 30
          }
        , gravity: 'NorthWest'
        }
        , image = new CropStream()
        , input = join(__dirname, 'fixtures', 'animated.gif')
        , out = join(tmp, 'animated-cropped.gif')
        , readStream = fs.createReadStream(input)
        , writeStream = fs.createWriteStream(out)
        , expectedOut = join(__dirname, 'fixtures', 'animated-cropped.gif')

      readStream.pipe(image).pipe(writeStream, options)

      writeStream.on('close', function () {
        var options =
        { file: join(tmp, 'animated-cropped-diff.gif')
        , tolerance: 0.001
        , highlightColor: 'yellow'
        }
        gm.compare(out, expectedOut, options, function(err, isEqual, equality, raw) {
          assert.equal(isEqual, true, 'Images do not match see ‘' +  options.file + '’ for a diff.\n' + raw)
          done()
        })
      })
    })
  })

  describe('format', function () {
    it('image should be formatted as PNG', function (done) {
      var options = {
          crop:
            { w: 300
            , h: 200
            }
        , format: 'png'
        }
        , image = new CropStream()
        , input = join(__dirname, 'fixtures', 'oriented-right-in-exif.jpeg')
        , out = join(tmp, 'formatted-png')
        , readStream = fs.createReadStream(input)
        , writeStream = fs.createWriteStream(out)

      readStream.pipe(image).pipe(writeStream, options)

      writeStream.on('close', function () {
        gm(out).format(function (err, value) {
          assert.equal(value, 'PNG')
          done()
        })
      })
    })

    it('image should be formatted as JPEG', function (done) {
      var options = {
          crop:
            { w: 300
            , h: 200
            }
        , format: 'jpg'
        }
        , image = new CropStream()
        , input = join(__dirname, 'fixtures', 'oriented-right-in-exif.jpeg')
        , out = join(tmp, 'formatted-jpeg')
        , readStream = fs.createReadStream(input)
        , writeStream = fs.createWriteStream(out)

      readStream.pipe(image).pipe(writeStream, options)

      writeStream.on('close', function () {
        gm(out).format(function (err, value) {
          assert.equal(value, 'JPEG')
          done()
        })
      })
    })


    it.only('image should be in its original format when no format is supplied', function (done) {
      var options = {
          crop:
            { w: 300
            , h: 200
            }
        }
        , jpegImage = new CropStream()
        , pngImage = new CropStream()
        , gifImage = new CropStream()
        , jpegInput = join(__dirname, 'fixtures', 'oriented-right-in-exif.jpeg')
        , pngInput = join(__dirname, 'fixtures', 'bill-circle.png')
        , gifInput = join(__dirname, 'fixtures', 'test-pattern.gif')
        , jpegOut = join(tmp, 'no-format-change-jpeg')
        , pngOut = join(tmp, 'no-format-change-png')
        , gifOut = join(tmp, 'no-format-change-gif')
        , jpegReadStream = fs.createReadStream(jpegInput)
        , pngReadStream = fs.createReadStream(pngInput)
        , gifReadStream = fs.createReadStream(gifInput)
        , jpegWriteStream = fs.createWriteStream(jpegOut)
        , pngWriteStream = fs.createWriteStream(pngOut)
        , gifWriteStream = fs.createWriteStream(gifOut)

      jpegReadStream.pipe(jpegImage).pipe(jpegWriteStream, options)
      pngReadStream.pipe(pngImage).pipe(pngWriteStream, options)
      gifReadStream.pipe(gifImage).pipe(gifWriteStream, options)

      jpegWriteStream.on('close', function () {
        gm(jpegOut).format(function (err, value) {
          assert.equal(value, 'JPEG')
          done()
        })
      })

      pngWriteStream.on('close', function () {
        gm(pngOut).format(function (err, value) {
          assert.equal(value, 'PNG')
          done()
        })
      })

      gifWriteStream.on('close', function () {
        gm(gifOut).format(function (err, value) {
          assert.equal(value, 'GIF')
          done()
        })
      })
    })
  })

  it('Corrupted image should trigger error', function (done) {
    var filepath = join(tmp, 'broken-image.png')
      , readStream = fs.createReadStream(join(__dirname, 'fixtures', 'broken-image.png'))
      , writeStream = fs.createWriteStream(filepath)
      , cropStream = new CropStream()

    readStream.pipe(cropStream).pipe(writeStream
      , { crop: {
            w: 400
          , h: 400 } })

    cropStream.on('error', function() {
      fs.readFile(filepath, function (err) {
        if (err) {
          throw err
        }
        done()
      })
    })
  })
})
