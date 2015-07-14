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
  , max = require('lodash.max')

Promise.promisifyAll(gm.prototype)

describe('CircleStream', function() {

  before(function () {
    rimraf.sync(tmp)
    mkdirp.sync(tmp)
  })

  after(function () {
    rimraf.sync(tmp)
  })

  it('should default circle dimensions as a best guess size', function (done) {
    var circle = new CircleStream()
      , out = join(tmp, 'bill-circle-test-guess-size.png')
      , input = join(__dirname, 'fixtures', 'bill-progressive.jpeg')
      , readStream = fs.createReadStream(input)
      , writeStream = fs.createWriteStream(out)

    readStream.pipe(circle).pipe(writeStream)

    function getImageSize(img) {
      return gm(img).sizeAsync()
    }

    writeStream.on('close', function () {
      getImageSize(input).then(function (size) {
        assert.equal(circle.dimensions[0], size.width * 0.1)
        assert.equal(circle.dimensions[1], size.height * 0.1)
        assert.equal(circle.dimensions[2], size.width * 0.9)
        assert.equal(circle.dimensions[3], size.height * 0.9)
        assert.equal(circle.dimensions[4], size.width * 0.5)
        assert.equal(circle.dimensions[5], size.height * 0.5)
      }).then(done).catch(done)
    })
  })

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
      }).then(done).catch(done)
    })

  })

  it('should return with a circular image', function (done) {
    var circle = new CircleStream({ x0: 20, y0: 20, x1: 480, y1: 380 })
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
      }).then(done).catch(done)
    })
  })

  it('should save as a jpg if background colour is given', function (done) {
    var colour = '#0165FF'
      , circle = new CircleStream({ x0: 250, y0: 200, x1: 400, y1: 320, colour: colour })
      , out = join(tmp, 'bill-circle-test.jpg')
      , input = join(__dirname, 'fixtures', 'bill-progressive.jpeg')
      , readStream = fs.createReadStream(input)
      , writeStream = fs.createWriteStream(out)

    readStream.pipe(circle).pipe(writeStream)

    function assertFileType(file) {
      return assert.equal(imageType(file).ext, 'jpg')
    }

    function getColour(line) {
      return '#' + line.split('#')[1]
    }

    function countColours(counts, colour) {
      if (counts[colour]) {
        counts[colour].count += 1
      } else {
        counts[colour] = { colour: colour, count: 1 }
      }
      return counts
    }

    function assertMainImageColour(histogram) {
      return fs.readFileAsync(histogram).then(function (file) {
        var counts = file.toString().split('\n')
          .map(getColour)
          .reduce(countColours, {})

        return assert.equal(max(counts, 'count').colour, colour)
      })
    }

    function createImageHistogram() {
      var histogramPath = join(tmp, 'histogram.txt')

      return gm(out).command('convert')
        .writeAsync(histogramPath)
        .then(function () {
          return assertMainImageColour(histogramPath)
        })
    }

    writeStream.on('close', function () {
      fs.readFileAsync(out)
        .then(assertFileType)
        .then(createImageHistogram)
        .then(done)
        .catch(done)
    })
  })
})
