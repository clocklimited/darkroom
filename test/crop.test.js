var assert = require('assert')
  , CropStream = require('../lib/crop')
  , DarkroomStream = require('../lib/darkroom-stream')
  , join = require('path').join
  , tmp = join(__dirname, 'fixtures', 'temp')
  , mkdirp = require('mkdirp')
  , rimraf = require('rimraf')
  , Promise = require('bluebird')
  , fs = Promise.promisifyAll(require('fs'))
  , gm = require('gm')
  , bufferEqual = require('buffer-equal')

Promise.promisifyAll(gm.prototype)

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

      function readImage(img) {
        return fs.readFileAsync(img)
      }

      writeStream.on('close', function () {
        Promise.join(readImage(out), readImage(expectedOut)).spread(function (image1, image2) {
          assert.equal(bufferEqual(image1, image2), true, 'Output should be as expected')
        }).then(done).catch(done)
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

      function readImage(img) {
        return fs.readFileAsync(img)
      }

      writeStream.on('close', function () {
        Promise.join(readImage(out), readImage(expectedOut)).spread(function (image1, image2) {
          assert.equal(bufferEqual(image1, image2), true, 'Output should be as expected')
        }).then(done).catch(done)
      })

    })
  })
})
