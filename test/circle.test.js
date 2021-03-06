const assert = require('assert')
const CircleStream = require('../lib/circle')
const DarkroomStream = require('../lib/darkroom-stream')
const { join } = require('path')
const temp = require('temp')
const rimraf = require('rimraf')
const fs = require('fs')
const gm = require('gm')
const imageType = require('image-type')
const async = require('async')
let tmp

describe('CircleStream', function () {
  before(function (done) {
    temp.mkdir('circle-test', function (err, path) {
      if (err) return done(err)
      tmp = path
      done()
    })
  })

  after(function () {
    // If you need to see some of the image diffs from failing test comment
    // out this line.
    rimraf.sync(tmp)
  })

  it('should default circle dimensions as a best guess size', function (done) {
    const circle = new CircleStream()
    const out = join(tmp, 'bill-circle-test-guess-size.png')
    const input = join(__dirname, 'fixtures', 'bill-progressive.jpeg')
    const readStream = fs.createReadStream(input)
    const writeStream = fs.createWriteStream(out)

    readStream.pipe(circle).pipe(writeStream)

    function getImageSize(img, cb) {
      return gm(img).size(cb)
    }

    writeStream.on('close', function () {
      getImageSize(input, function (err, size) {
        if (err) return done(err)
        assert.strictEqual(circle.options.x0, size.width / 2)
        assert.strictEqual(circle.options.y0, size.height / 2)
        assert.strictEqual(circle.options.x1, size.width * 0.8)
        assert.strictEqual(circle.options.y1, size.height * 0.8)
        done()
      })
    })
  })

  it('should be a DarkroomStream', function () {
    const s = new CircleStream({ x0: 100, y0: 100, x1: 100, y1: 100 })
    assert(s instanceof DarkroomStream)
  })

  it('should return an image of the same size', function (done) {
    const circle = new CircleStream({ x0: 100, y0: 100, x1: 100, y1: 100 })
    const out = join(tmp, 'bill-circle-test.png')
    const input = join(__dirname, 'fixtures', 'bill-progressive.jpeg')
    const readStream = fs.createReadStream(input)
    const writeStream = fs.createWriteStream(out)

    readStream.pipe(circle).pipe(writeStream)

    function getImageSize(img, cb) {
      return gm(img).size(cb)
    }

    writeStream.on('close', function () {
      async.parallel(
        [getImageSize.bind(null, input), getImageSize.bind(null, out)],
        function (err, results) {
          if (err) return done(err)
          assert.deepStrictEqual(results[0], results[1])

          return done()
        }
      )
    })
  })

  it('should return with a circular image', function (done) {
    const circle = new CircleStream({ x0: 250, y0: 200, x1: 400, y1: 320 })
    const out = join(tmp, 'bill-circle-test.png')
    const input = join(__dirname, 'fixtures', 'bill-progressive.jpeg')
    const readStream = fs.createReadStream(input)
    const writeStream = fs.createWriteStream(out)
    const expectedOut = join(__dirname, 'fixtures', 'bill-circle.png')

    readStream.pipe(circle).pipe(writeStream)

    writeStream.on('close', function () {
      const options = {
        file: join(tmp, 'bill-circle-test-diff.png'),
        tolerance: 0.001,
        highlightColor: 'yellow'
      }

      gm.compare(
        out,
        expectedOut,
        options,
        function (err, isEqual, equality, raw) {
          assert.strictEqual(
            isEqual,
            true,
            'Images do not match see ‘' + options.file + '’ for a diff.\n' + raw
          )
          done()
        }
      )
    })
  })

  it('should clean up the temporary directory', function (done) {
    const circle = new CircleStream({ x0: 250, y0: 200, x1: 400, y1: 320 })
    const out = join(tmp, 'bill-circle-test.png')
    const input = join(__dirname, 'fixtures', 'bill-progressive.jpeg')
    const readStream = fs.createReadStream(input)
    const writeStream = fs.createWriteStream(out)

    readStream.pipe(circle).pipe(writeStream)

    writeStream.on('close', function () {
      fs.readdir(circle.tempDir, (error) => {
        assert.ok(error instanceof Error, 'Temporary files left over')
        assert.strictEqual(error.code, 'ENOENT', 'Temporary files left over')
        done()
      })
    })
  })

  it('should save as a jpg if background colour is given', function (done) {
    const colour = '#0166FF'
    const circle = new CircleStream({
      x0: 250,
      y0: 200,
      x1: 400,
      y1: 320,
      colour: colour
    })
    const out = join(tmp, 'bill-circle-test.jpg')
    const input = join(__dirname, 'fixtures', 'bill-progressive.jpeg')
    const readStream = fs.createReadStream(input)
    const writeStream = fs.createWriteStream(out)
    const histogramPath = join(tmp, 'histogram.txt')

    readStream.pipe(circle).pipe(writeStream)

    function assertFileType(file) {
      return assert.strictEqual(imageType(file).ext, 'jpg')
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
        const counts = file
          .toString()
          .split('\n')
          .map(getColour)
          .reduce(countColours, {})
        const maxColour = Object.keys(counts).reduce(function (max, key) {
          if (counts[key].count > max) {
            max = key
          }
          return max
        })
        assert.strictEqual(maxColour, colour)
        return done()
      })
    }

    function createImageHistogram() {
      return gm(out)
        .command('convert')
        .write(histogramPath, assertMainImageColour)
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
