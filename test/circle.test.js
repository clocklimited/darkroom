var assert = require('assert')
  , CircleStream = require('../lib/circle')
  , DarkroomStream = require('../lib/darkroom-stream')
  , join = require('path').join
  , tmp = join(__dirname, 'fixtures', 'temp')
  , mkdirp = require('mkdirp')
  , rimraf = require('rimraf')
  , Promise = require('bluebird')
  , fs = Promise.promisifyAll(require('fs'))
  , gm = require('gm')
  , bufferEqual = require('buffer-equal')
  , imageType = require('image-type')

Promise.promisifyAll(gm.prototype)

describe('CircleStream', function() {

  before(function () {
    rimraf.sync(tmp)
    mkdirp.sync(tmp)
  })

  after(function () {
    rimraf.sync(tmp)
  })

  it('should throw if missing params', function () {
    // jshint nonew: false
    assert.throws(function () {
      new CircleStream()
    }, /x0 is required/)

    assert.throws(function () {
      new CircleStream({ x0: 100 })
    }, /y0 is required/)

    assert.throws(function () {
      new CircleStream({ x0: 100, y0: 100 })
    }, /x1 is required/)

    assert.throws(function () {
      new CircleStream({ x0: 100, y0: 100, x1: 100 })
    }, /y1 is required/)
  })

  it('should default dimensions as best guess sizes')

  it('should be a DarkroomStream', function () {
    var s = new CircleStream({ x0: 100, y0: 100, x1: 100, y1: 100 })
    assert(s instanceof DarkroomStream)
  })

  it('should return an image of the same size', function (done) {
    var circle = new CircleStream({ x0: 100, y0: 100, x1: 100, y1: 100 })
      , out = join(tmp, 'bill-circle-test.png')
      , input = join(__dirname, 'fixtures', 'bill-progressive.jpeg')
      , readStream = fs.createReadStream(input)
      , writeStream = fs.createWriteStream(out)

    readStream.pipe(circle).pipe(writeStream)

    function getImageSize(img) {
      return gm(img).sizeAsync()
    }

    writeStream.on('close', function () {
      Promise.join(getImageSize(input), getImageSize(out)).spread(function (image1, image2) {
        assert.deepEqual(image1, image2)
      }).then(done)
    })

  })

  it('should return with a circular image', function (done) {
    var circle = new CircleStream({ x0: 100, y0: 100, x1: 100, y1: 100 })
      , out = join(tmp, 'bill-circle-test.png')
      , input = join(__dirname, 'fixtures', 'bill-progressive.jpeg')
      , readStream = fs.createReadStream(input)
      , writeStream = fs.createWriteStream(out)
      , expectedOut = join(__dirname, 'fixtures', 'bill-circle.png')

    readStream.pipe(circle).pipe(writeStream)

    function readImage(img) {
      return fs.readFileAsync(img)
    }

    writeStream.on('close', function () {
      Promise.join(readImage(out), readImage(expectedOut)).spread(function (image1, image2) {
        assert.equal(bufferEqual(image1, image2), true, 'Output should be as expected')
      }).then(done)
    })
  })
})
