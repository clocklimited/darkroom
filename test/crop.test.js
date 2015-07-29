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
  , gm = require('gm')

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
})
