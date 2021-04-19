var Watermark = require('../lib/watermark'),
  streamToTest = require('./stream.fixture.js'),
  fs = require('fs'),
  join = require('path').join,
  tmp,
  temp = require('temp'),
  watermark,
  rimraf = require('rimraf'),
  gm = require('gm'),
  assert = require('assert'),
  Writable = require('stream').Writable

describe('WatermarkStream', function () {
  before(function (done) {
    temp.mkdir('watermark-test', function (err, path) {
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

  beforeEach(function () {
    watermark = new Watermark(join(__dirname, './fixtures/watermark.png'))
  })

  describe('Inherit from DarkroomStream', function () {
    it('should have a pipe method', function () {
      watermark.should.be.an.instanceOf(Object).and.have.property('pipe')
    })

    it('should have a write method', function () {
      watermark.should.be.an.instanceOf(Object).and.have.property('write')
    })

    it('shouldn’t have a pause method', function () {
      watermark.should.be.an.instanceOf(Object).and.not.have.property('pause')
    })
  })

  it('should read in an image using streams', function () {
    watermark.chunks.should.have.lengthOf(0)
    streamToTest(watermark)
  })

  var formats = ['png', 'jpeg']
  formats.forEach(function (format) {
    describe('shared watermark tests: ' + format, function () {
      it('should return an image with a known length', function (done) {
        watermark.chunks.should.have.lengthOf(0)
        var filePath = join(tmp, 'watermark-test.' + format),
          readStream = fs.createReadStream(
            join(__dirname, 'fixtures', '500x399-24bit.' + format)
          ),
          writeStream = fs.createWriteStream(filePath)

        readStream
          .pipe(watermark)
          .pipe(writeStream, { width: 200, height: 200 })

        writeStream.on('close', function () {
          fs.readFile(filePath, function (err, data) {
            if (err) throw err
            data.length.should.be.above(100)
            done()
          })
        })
      })

      it('should correctly apply a watermark at default opacity', function (done) {
        watermark.chunks.should.have.lengthOf(0)
        var filepath = join(tmp, 'watermark-opacity.' + format),
          readStream = fs.createReadStream(
            join(__dirname, 'fixtures', '500x399.' + format)
          ),
          writeStream = fs.createWriteStream(filepath),
          expectedOutput = join(
            __dirname,
            'fixtures',
            'watermark-opacity.' + format
          )

        readStream.pipe(watermark).pipe(writeStream)

        writeStream.on('close', function () {
          gm(filepath).identify(function (err, data) {
            data.size.width.should.equal(500)
            data.size.height.should.equal(399)
            var options = {
              file: join(tmp, 'watermark-opacity-diff.' + format),
              tolerance: 0.001,
              highlightColor: 'yellow'
            }

            gm.compare(
              filepath,
              expectedOutput,
              options,
              function (err, isEqual, equality, raw) {
                assert.strictEqual(
                  isEqual,
                  true,
                  'Images do not match see ‘' +
                    options.file +
                    '’ for a diff.\n' +
                    raw
                )
                done()
              }
            )
          })
        })
      })

      it('should correctly apply a watermark at custom opacity', function (done) {
        watermark = new Watermark(join(__dirname, './fixtures/watermark.png'), {
          opacity: 100
        })
        watermark.chunks.should.have.lengthOf(0)
        var filepath = join(tmp, 'watermark-opacity-custom.' + format),
          readStream = fs.createReadStream(
            join(__dirname, 'fixtures', '500x399.' + format)
          ),
          writeStream = fs.createWriteStream(filepath),
          expectedOutput = join(
            __dirname,
            'fixtures',
            'watermark-opacity-custom.' + format
          )

        readStream.pipe(watermark).pipe(writeStream)

        writeStream.on('close', function () {
          gm(filepath).identify(function (err, data) {
            data.size.width.should.equal(500)
            data.size.height.should.equal(399)
            var options = {
              file: join(tmp, 'watermark-opacity-custom-diff.' + format),
              tolerance: 0.001,
              highlightColor: 'yellow'
            }

            gm.compare(
              filepath,
              expectedOutput,
              options,
              function (err, isEqual, equality, raw) {
                assert.strictEqual(
                  isEqual,
                  true,
                  'Images do not match see ‘' +
                    options.file +
                    '’ for a diff.\n' +
                    raw
                )
                done()
              }
            )
          })
        })
      })
    })
  })

  it('should trigger error with a corrupted image', function (done) {
    watermark.chunks.should.have.lengthOf(0)
    var readStream = fs.createReadStream(
        join(__dirname, 'fixtures', 'broken-image.png')
      ),
      writeStream = new Writable()

    readStream.pipe(watermark).pipe(writeStream, { width: 100, height: 200 })

    writeStream.on('data', function () {
      done(
        new Error(
          'Write stream should not receive any data for corrupt image input'
        )
      )
    })

    watermark.on('error', function () {
      done()
    })
  })
})
