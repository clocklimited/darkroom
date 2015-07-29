var assert = require('assert')
  , CropStream = require('../lib/crop')
  , DarkroomStream = require('../lib/darkroom-stream')
  , join = require('path').join
  , tmp
  , temp = require('temp')
  , mkdirp = require('mkdirp')
  , rimraf = require('rimraf')
  , fs = require('fs')
  , bufferEqual = require('buffer-equal')
  , async = require('async')
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
            , xOffset: 100
            , yOffset: 200
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
