var assert = require('assert')
  , CropStream = require('../lib/crop')
  , DarkroomStream = require('../lib/darkroom-stream')
  , join = require('path').join
  , tmp = join(__dirname, 'fixtures', 'temp')
  , mkdirp = require('mkdirp')
  , rimraf = require('rimraf')
  , fs = require('fs')
  , bufferEqual = require('buffer-equal')
  , async = require('async')

describe('CropStream', function() {

  before(function () {
    rimraf.sync(tmp)
    mkdirp.sync(tmp)
  })

  after(function () {
    rimraf.sync(tmp)
  })

  it('should be a DarkroomStream', function () {
    var s = new CropStream()
    assert(s instanceof DarkroomStream)
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
        , out = join(tmp, 'crop-gravity-portrait-test.png')
        , input = join(__dirname, 'fixtures', 'gravity-portrait-original.jpeg')
        , readStream = fs.createReadStream(input)
        , writeStream = fs.createWriteStream(out)
        , expectedOut = join(__dirname, 'fixtures', 'gravity-portrait-cropped.jpeg')

      readStream.pipe(image).pipe(writeStream, options)

      function readImage(img, cb) {
        fs.readFile(img, function (err, image) {
          cb(err, image)
        })
      }

      writeStream.on('close', function () {
        async.parallel(
          { readActualImage: readImage.bind(null, out)
          , readExpectedImage: readImage.bind(null, expectedOut)
          }
        , function (err, results) {
            assert.equal(bufferEqual(results.readActualImage, results.readExpectedImage)
              , true
              , 'Output should be es expected'
            )
            done()
          }
        )
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
        , out = join(tmp, 'crop-gravity-landscape-test.png')
        , input = join(__dirname, 'fixtures', 'gravity-landscape-original.jpeg')
        , readStream = fs.createReadStream(input)
        , writeStream = fs.createWriteStream(out)
        , expectedOut = join(__dirname, 'fixtures', 'gravity-landscape-cropped.jpeg')

      readStream.pipe(image).pipe(writeStream, options)

      function readImage(img, cb) {
        fs.readFile(img, function (err, image) {
          cb(err, image)
        })
      }

      writeStream.on('close', function () {
        async.parallel(
          { readActualImage: readImage.bind(null, out)
          , readExpectedImage: readImage.bind(null, expectedOut)
          }
        , function (err, results) {
            assert.equal(bufferEqual(results.readActualImage, results.readExpectedImage)
              , true
              , 'Output should be es expected'
            )
            done()
          }
        )
      })
    })
  })
})
