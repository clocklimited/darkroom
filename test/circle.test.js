var assert = require('assert')
  , CircleStream = require('../lib/circle')
  , DarkroomStream = require('../lib/darkroom-stream')
  , join = require('path').join
  , tmp = join(__dirname, 'fixtures', 'temp')
  , mkdirp = require('mkdirp')
  , rimraf = require('rimraf')
  , fs = require('fs')
  , gm = require('gm')
  , bufferEqual = require('buffer-equal')
  , imageType = require('image-type')
  , max = require('lodash.max')
  , async = require('async')

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

    function getImageSize(img, cb) {
      return gm(img).size(cb)
    }

    writeStream.on('close', function () {
      async.parallel(
        [ getImageSize.bind(null, input)
        , getImageSize.bind(null, out)
        ], function (err, results) {
        if (err) return done(err)
        assert.deepEqual(results[0], results[1])
        return done()
      })
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

    function readImage(img, cb) {
      return fs.readFile(img, cb)
    }

    writeStream.on('close', function () {
      async.parallel(
        [ readImage.bind(null, out)
        , readImage.bind(null, expectedOut)
        ], function (err, results) {
          if (err) return done(err)
          assert.equal(bufferEqual(results[0], results[1]), true, 'Output should be as expected')
          return done()
        })
    })
  })

  it('should save as a jpg if background colour is given', function (done) {
    var colour = '#0165FF'
      , circle = new CircleStream({ x0: 250, y0: 200, x1: 400, y1: 320, colour: colour })
      , out = join(tmp, 'bill-circle-test.jpg')
      , input = join(__dirname, 'fixtures', 'bill-progressive.jpeg')
      , readStream = fs.createReadStream(input)
      , writeStream = fs.createWriteStream(out)
      , histogramPath = join(tmp, 'histogram.txt')

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

    function assertMainImageColour(err) {
      if (err) return done(err)
      fs.readFile(histogramPath, function (err, file) {
        if (err) return done(err)
        var counts = file.toString().split('\n')
          .map(getColour)
          .reduce(countColours, {})

        assert.equal(max(counts, 'count').colour, colour)
        return done()
      })
    }

    function createImageHistogram() {
      return gm(out).command('convert').write(histogramPath, assertMainImageColour)
    }

    writeStream.on('close', function () {
      fs.readFile(out, function (err, file) {
        if (err) return done(err)

        assertFileType(file)
        createImageHistogram()
      })
    })
  })
})
