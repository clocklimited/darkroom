const Resize = require('../lib/resize')
const streamToTest = require('./stream.fixture.js')
const fs = require('fs')
const { join } = require('path')
const temp = require('temp')
const rimraf = require('rimraf')
const gm = require('gm')
const assert = require('assert')
const Writable = require('stream')
const async = require('async')
const getWebpInfo = require('webpinfo').WebPInfo
let tmp
let resize

describe('ResizeStream', function () {
  before(function (done) {
    temp.mkdir('resize-test', function (err, path) {
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
    resize = new Resize()
  })

  describe('Inherit from DarkroomStream', function () {
    it('should have a pipe method', function () {
      resize.should.be.an.instanceOf(Object).and.have.property('pipe')
    })

    it('should have a write method', function () {
      resize.should.be.an.instanceOf(Object).and.have.property('write')
    })

    it('shouldn’t have a pause method', function () {
      resize.should.be.an.instanceOf(Object).and.not.have.property('pause')
    })
  })

  it('should read in an image using streams', function () {
    resize.chunks.should.have.lengthOf(0)
    streamToTest(resize)
  })

  const formats = ['png', 'jpeg', 'gif']
  formats.forEach(function (format) {
    describe('shared resize tests: ' + format, function () {
      it('should return an image with a known length', function (done) {
        resize.chunks.should.have.lengthOf(0)
        const filePath = join(tmp, 'small-stretch.' + format)
        const readStream = fs.createReadStream(
          join(__dirname, 'fixtures', '500x399-24bit.' + format)
        )
        const writeStream = fs.createWriteStream(filePath)

        readStream
          .pipe(resize)
          .pipe(writeStream, { width: 200, height: 200, mode: 'stretch' })

        writeStream.on('close', function () {
          fs.readFile(filePath, function (err, data) {
            if (err) throw err
            data.length.should.be.above(100)
            done()
          })
        })
      })

      it('should stretch down if source is bigger than required height', function (done) {
        resize.chunks.should.have.lengthOf(0)
        const filepath = join(tmp, '100x200-stretch.' + format)
        const readStream = fs.createReadStream(
          join(__dirname, 'fixtures', '500x399-24bit.' + format)
        )
        const writeStream = fs.createWriteStream(filepath)

        readStream
          .pipe(resize)
          .pipe(writeStream, { width: 100, height: 200, mode: 'stretch' })

        writeStream.on('close', function () {
          gm(filepath).identify(function (err, data) {
            data.size.width.should.equal(100)
            data.size.height.should.equal(200)
            done()
          })
        })
      })

      it('should scale up if source is smaller than required height', function (done) {
        resize.chunks.should.have.lengthOf(0)
        const filepath = join(tmp, '600x200-scaleup-stretch.' + format)
        const readStream = fs.createReadStream(
          join(__dirname, 'fixtures', '500x399-24bit.' + format)
        )
        const writeStream = fs.createWriteStream(filepath)

        readStream
          .pipe(resize)
          .pipe(writeStream, { width: 600, height: 200, mode: 'stretch' })

        writeStream.on('close', function () {
          gm(filepath).identify(function (err, data) {
            data.size.width.should.equal(600)
            data.size.height.should.equal(200)
            done()
          })
        })
      })

      it('should keep ratio on 500x399 image when only resizing by width', function (done) {
        resize.chunks.should.have.lengthOf(0)
        const filepath = join(tmp, '100x-fit-landscape.' + format)
        const readStream = fs.createReadStream(
          join(__dirname, 'fixtures', '500x399-24bit.' + format)
        )
        const writeStream = fs.createWriteStream(filepath)

        readStream.pipe(resize).pipe(writeStream, { width: 100, mode: 'fit' })

        writeStream.on('close', function () {
          gm(filepath).identify(function (err, data) {
            data.size.width.should.equal(100)
            data.size.height.should.equal(80)
            done()
          })
        })
      })

      it('should keep ratio on 500x399 image when only resizing by height', function (done) {
        resize.chunks.should.have.lengthOf(0)
        const filepath = join(tmp, 'x100-fit-landscape.' + format)
        const readStream = fs.createReadStream(
          join(__dirname, 'fixtures', '500x399-24bit.' + format)
        )
        const writeStream = fs.createWriteStream(filepath)

        readStream.pipe(resize).pipe(writeStream, { height: 100, mode: 'fit' })

        writeStream.on('close', function () {
          gm(filepath).identify(function (err, data) {
            data.size.width.should.equal(125)
            data.size.height.should.equal(100)
            done()
          })
        })
      })

      it('should keep ratio for landscape and constrain to 100x100', function (done) {
        resize.chunks.should.have.lengthOf(0)
        const filepath = join(
          tmp,
          '100x100-fit-landscape-width-and-height.' + format
        )
        const readStream = fs.createReadStream(
          join(__dirname, 'fixtures', '500x399-24bit.' + format)
        )
        const writeStream = fs.createWriteStream(filepath)

        readStream
          .pipe(resize)
          .pipe(writeStream, { height: 100, width: 100, mode: 'fit' })

        writeStream.on('close', function () {
          gm(filepath).identify(function (err, data) {
            data.size.width.should.equal(100)
            data.size.height.should.equal(80)
            done()
          })
        })
      })

      it('should keep ratio for portrait and constrain to 100x100', function (done) {
        resize.chunks.should.have.lengthOf(0)
        const filepath = join(
          tmp,
          '100x100-fit-portrait-width-and-height.' + format
        )
        const readStream = fs.createReadStream(
          join(__dirname, 'fixtures', '399x500-24bit.' + format)
        )
        const writeStream = fs.createWriteStream(filepath)

        readStream
          .pipe(resize)
          .pipe(writeStream, { height: 100, width: 100, mode: 'fit' })

        writeStream.on('close', function () {
          gm(filepath).identify(function (err, data) {
            data.size.width.should.equal(80)
            data.size.height.should.equal(100)
            done()
          })
        })
      })

      it('should correctly ‘cover’ with a landscape constrained to 100x100', function (done) {
        resize.chunks.should.have.lengthOf(0)
        const filepath = join(
          tmp,
          '100x100-cover-landscape-width-and-height.' + format
        )
        const readStream = fs.createReadStream(
          join(__dirname, 'fixtures', '500x399-24bit.' + format)
        )
        const writeStream = fs.createWriteStream(filepath)

        readStream
          .pipe(resize)
          .pipe(writeStream, { height: 100, width: 100, mode: 'cover' })

        writeStream.on('close', function () {
          gm(filepath).identify(function (err, data) {
            data.size.width.should.equal(100)
            data.size.height.should.equal(100)
            done()
          })
        })
      })

      it('should correctly ‘cover’ with a portrait constrained to 100x100', function (done) {
        resize.chunks.should.have.lengthOf(0)
        const filepath = join(
          tmp,
          '100x100-cover-portrait-width-and-height.' + format
        )
        const readStream = fs.createReadStream(
          join(__dirname, 'fixtures', '399x500-24bit.' + format)
        )
        const writeStream = fs.createWriteStream(filepath)

        readStream
          .pipe(resize)
          .pipe(writeStream, { height: 100, width: 100, mode: 'cover' })

        writeStream.on('close', function () {
          gm(filepath).identify(function (err, data) {
            data.size.width.should.equal(100)
            data.size.height.should.equal(100)
            done()
          })
        })
      })

      it('should correctly ‘cover’ with a landscape constrained to 100x100 with an 8bit image', function (done) {
        resize.chunks.should.have.lengthOf(0)
        const filepath = join(
          tmp,
          '100x100-cover-landscape-8bit-width-and-height.' + format
        )
        const readStream = fs.createReadStream(
          join(__dirname, 'fixtures', '500x399-8bit.' + format)
        )
        const writeStream = fs.createWriteStream(filepath)

        readStream
          .pipe(resize)
          .pipe(writeStream, { height: 100, width: 100, mode: 'cover' })

        writeStream.on('close', function () {
          gm(filepath).identify(function (err, data) {
            data.size.width.should.equal(100)
            data.size.height.should.equal(100)
            done()
          })
        })
      })

      it('should scale up with only one requested dimension', function (done) {
        resize.chunks.should.have.lengthOf(0)
        const filepath = join(tmp, '600x479-scale-up-width.' + format)
        const readStream = fs.createReadStream(
          join(__dirname, 'fixtures', '500x399.' + format)
        )
        const writeStream = fs.createWriteStream(filepath)

        readStream.pipe(resize).pipe(writeStream, { width: 600, mode: 'fit' })

        writeStream.on('close', function () {
          gm(filepath).size(function (err, size) {
            size.width.should.equal(600)
            size.height.should.equal(479)
            done()
          })
        })
      })

      it('should return an image with the dimensions of 100x50', function (done) {
        resize.chunks.should.have.lengthOf(0)
        const filepath = join(tmp, '100x50-stretch.' + format)
        const readStream = fs.createReadStream(
          join(__dirname, 'fixtures', '500x399.' + format)
        )
        const writeStream = fs.createWriteStream(filepath)

        readStream
          .pipe(resize)
          .pipe(writeStream, { width: 100, height: 50, mode: 'stretch' })

        writeStream.on('close', function () {
          gm(filepath).identify(function (err, data) {
            data.size.width.should.equal(100)
            data.size.height.should.equal(50)
            done()
          })
        })
      })

      it('should handle stretching an image using an xx.9 floating point number', function (done) {
        resize.chunks.should.have.lengthOf(0)
        const filepath = join(tmp, '100x50-stretch-xx.9.' + format)
        const readStream = fs.createReadStream(
          join(__dirname, 'fixtures', '500x399.' + format)
        )
        const writeStream = fs.createWriteStream(filepath)

        readStream
          .pipe(resize)
          .pipe(writeStream, { width: 99.9, height: 49.9, mode: 'stretch' })

        writeStream.on('close', function () {
          gm(filepath).identify(function (err, data) {
            data.size.width.should.equal(100)
            data.size.height.should.equal(50)
            done()
          })
        })
      })

      it('should handle stretching an image using an xx.5 floating point number', function (done) {
        resize.chunks.should.have.lengthOf(0)
        const filepath = join(tmp, '100x50-stretch-xx.5.' + format)
        const readStream = fs.createReadStream(
          join(__dirname, 'fixtures', '500x399.' + format)
        )
        const writeStream = fs.createWriteStream(filepath)

        readStream
          .pipe(resize)
          .pipe(writeStream, { width: 99.5, height: 49.5, mode: 'stretch' })

        writeStream.on('close', function () {
          gm(filepath).identify(function (err, data) {
            data.size.width.should.equal(100)
            data.size.height.should.equal(50)
            done()
          })
        })
      })

      it('should handle stretching an image using an xx.1 floating point number', function (done) {
        resize.chunks.should.have.lengthOf(0)
        const filepath = join(tmp, '100x50-stretch-xx.1.' + format)
        const readStream = fs.createReadStream(
          join(__dirname, 'fixtures', '500x399.' + format)
        )
        const writeStream = fs.createWriteStream(filepath)

        readStream
          .pipe(resize)
          .pipe(writeStream, { width: 100.1, height: 50.1, mode: 'stretch' })

        writeStream.on('close', function () {
          gm(filepath).identify(function (err, data) {
            data.size.width.should.equal(100)
            data.size.height.should.equal(50)
            done()
          })
        })
      })

      it('should correctly ‘cover’ to 100x100 using an xx.9 floating point number', function (done) {
        resize.chunks.should.have.lengthOf(0)
        const filepath = join(
          tmp,
          '100x100-cover-landscape-width-and-height-xx.9.' + format
        )
        const readStream = fs.createReadStream(
          join(__dirname, 'fixtures', '500x399-24bit.' + format)
        )
        const writeStream = fs.createWriteStream(filepath)

        readStream
          .pipe(resize)
          .pipe(writeStream, { height: 99.9, width: 99.9, mode: 'cover' })

        writeStream.on('close', function () {
          gm(filepath).identify(function (err, data) {
            data.size.width.should.equal(100)
            data.size.height.should.equal(100)
            done()
          })
        })
      })

      it('should correctly ‘cover’ to 100x100 using an xx.5 floating point number', function (done) {
        resize.chunks.should.have.lengthOf(0)
        const filepath = join(
          tmp,
          '100x100-cover-landscape-width-and-height-xx.5.' + format
        )
        const readStream = fs.createReadStream(
          join(__dirname, 'fixtures', '500x399-24bit.' + format)
        )
        const writeStream = fs.createWriteStream(filepath)

        readStream
          .pipe(resize)
          .pipe(writeStream, { height: 99.5, width: 99.5, mode: 'cover' })

        writeStream.on('close', function () {
          gm(filepath).identify(function (err, data) {
            data.size.width.should.equal(100)
            data.size.height.should.equal(100)
            done()
          })
        })
      })

      it('should correctly ‘cover’ to 100x100 using an xx.1 floating point number', function (done) {
        resize.chunks.should.have.lengthOf(0)
        const filepath = join(
          tmp,
          '100x100-cover-landscape-width-and-height-xx.1.' + format
        )
        const readStream = fs.createReadStream(
          join(__dirname, 'fixtures', '500x399-24bit.' + format)
        )
        const writeStream = fs.createWriteStream(filepath)

        readStream
          .pipe(resize)
          .pipe(writeStream, { height: 100.1, width: 100.1, mode: 'cover' })

        writeStream.on('close', function () {
          gm(filepath).identify(function (err, data) {
            data.size.width.should.equal(100)
            data.size.height.should.equal(100)
            done()
          })
        })
      })

      it('should correctly ‘pad’ to 200x200', function (done) {
        if (format === 'gif') return done()
        resize.chunks.should.have.lengthOf(0)
        const filepath = join(tmp, '500x399-pad.' + format)
        const readStream = fs.createReadStream(
          join(__dirname, 'fixtures', '500x399.' + format)
        )
        const writeStream = fs.createWriteStream(filepath)
        const expectedOutput = join(
          __dirname,
          'fixtures',
          '500x399-pad.' + format
        )

        readStream
          .pipe(resize)
          .pipe(writeStream, { height: 200, width: 200, mode: 'pad' })

        writeStream.on('close', function () {
          gm(filepath).identify(function (err, data) {
            data.size.width.should.equal(200)
            data.size.height.should.equal(200)
            const options = {
              file: join(tmp, '500x399-pad-diff.' + format),
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

      it('should error if stretch is attempted with only a width', function () {
        resize.chunks.should.have.lengthOf(0)
        const filepath = join(tmp, '100x-should-error.' + format)
        const readStream = fs.createReadStream(
          join(__dirname, 'fixtures', '500x399.' + format)
        )
        const writeStream = fs.createWriteStream(filepath)

        ;(function () {
          readStream
            .pipe(resize)
            .pipe(writeStream, { width: 100, mode: 'stretch' })
        }.should.throw('Unable to stretch to a single dimension constant'))
      })
    })
  })

  it('should return a progressive image ', function (done) {
    resize.chunks.should.have.lengthOf(0)
    const filepath = join(tmp, 'progressive-test.jpg')
    const inputfile = join(__dirname, 'fixtures', 'bill-non-progressive.jpeg')
    const readStream = fs.createReadStream(inputfile)
    const writeStream = fs.createWriteStream(filepath)

    readStream.pipe(resize).pipe(writeStream, { width: 500, height: 399 })

    writeStream.on('close', function () {
      gm(filepath).identify(function (err, data) {
        data.Interlace.should.equal('Line')
        done()
      })
    })
  })

  it('should return an image of the same format as the input if no other format is specified', function (done) {
    resize.chunks.should.have.lengthOf(0)
    const filepath = join(tmp, 'iampng')
    const inputfile = join(__dirname, 'fixtures', '500x399-24bit.png')
    const readStream = fs.createReadStream(inputfile)
    const writeStream = fs.createWriteStream(filepath)

    readStream.pipe(resize).pipe(writeStream, { width: 100, height: 200 })

    writeStream.on('close', function () {
      gm(filepath).identify(function (err, data) {
        data.format.should.equal('PNG')
        done()
      })
    })
  })

  it('should return an image in the specified format', function (done) {
    resize.chunks.should.have.lengthOf(0)
    const filepath = join(tmp, 'iampng')
    const inputfile = join(__dirname, 'fixtures', '500x399-24bit.png')
    const readStream = fs.createReadStream(inputfile)
    const writeStream = fs.createWriteStream(filepath)
    const format = 'JPEG'

    readStream
      .pipe(resize)
      .pipe(writeStream, { width: 100, height: 200, format: format })

    writeStream.on('close', function () {
      gm(filepath).identify(function (err, data) {
        data.format.should.equal(format)
        done()
      })
    })
  })

  it('should trigger error with a corrupted image', function (done) {
    resize.chunks.should.have.lengthOf(0)
    const readStream = fs.createReadStream(
      join(__dirname, 'fixtures', 'broken-image.png')
    )
    const writeStream = new Writable()

    readStream.pipe(resize).pipe(writeStream, { width: 100, height: 200 })

    writeStream.on('data', function () {
      done(
        new Error(
          'Write stream should not receive any data for corrupt image input'
        )
      )
    })

    resize.on('error', function () {
      done()
    })
  })

  describe('resizing from png', function () {
    it('should keep images lossless which were orginally pngs', function (done) {
      resize.chunks.should.have.lengthOf(0)
      const filePath = join(tmp, 'iamlosslesswebp')
      const inputfile = join(__dirname, 'fixtures', '500x399-24bit.png')
      const readStream = fs.createReadStream(inputfile)
      const writeStream = fs.createWriteStream(filePath)
      const format = 'WEBP'

      readStream
        .pipe(resize)
        .pipe(writeStream, { width: 500, height: 399, format: format })

      writeStream.on('close', function () {
        getWebpInfo
          .from(filePath)
          .then(function (info) {
            assert(info.summary.isLossless, 'File is not lossless')
            done()
          })
          .catch(done)
      })
    })
  })

  describe('resizing to webp', function () {
    it('should create a lossy webp', function (done) {
      resize.chunks.should.have.lengthOf(0)
      const filePath = join(tmp, 'iamlossywebp')
      const inputfile = join(__dirname, 'fixtures', '500x399-8bit.jpeg')
      const readStream = fs.createReadStream(inputfile)
      const writeStream = fs.createWriteStream(filePath)
      const format = 'WEBP'

      readStream
        .pipe(resize)
        .pipe(writeStream, { width: 500, height: 399, format: format })

      writeStream.on('close', function () {
        getWebpInfo
          .from(filePath)
          .then(function (info) {
            assert.strictEqual(
              info.summary.isLossless,
              false,
              'File is not lossless'
            )
            done()
          })
          .catch(done)
      })
    })
  })

  describe('gif resizing', function () {
    it('should correctly cover resize animated gifs', function (done) {
      const input = join(__dirname, 'fixtures', 'animated.gif')
      const filePath = join(tmp, 'out-cover.gif')
      const expectedOutput = join(
        __dirname,
        'fixtures',
        'resized-animated-cover.gif'
      )
      const readStream = fs.createReadStream(input)
      const writeStream = fs.createWriteStream(filePath)

      readStream.pipe(resize).pipe(writeStream, {
        width: 200,
        height: 200,
        mode: 'cover',
        interlaced: false
      })

      writeStream.on('close', function () {
        const options = {
          file: join(tmp, 'resized-animated-cover-diff.gif'),
          tolerance: 0.001,
          highlightColor: 'yellow'
        }
        gm.compare(
          filePath,
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

    it('should correctly fit resize animated gifs', function (done) {
      const input = join(__dirname, 'fixtures', 'animated.gif')
      const filePath = join(tmp, 'out-fit.gif')
      const expectedOutput = join(
        __dirname,
        'fixtures',
        'resized-animated-fit.gif'
      )
      const readStream = fs.createReadStream(input)
      const writeStream = fs.createWriteStream(filePath)

      readStream.pipe(resize).pipe(writeStream, {
        width: 200,
        height: 100,
        mode: 'fit',
        interlaced: false
      })

      writeStream.on('close', function () {
        const options = {
          file: join(tmp, 'resized-animated-fit-diff.gif'),
          tolerance: 0.001,
          highlightColor: 'yellow'
        }
        gm.compare(
          filePath,
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

    it('should correctly fit resize animated gifs with one dimens', function (done) {
      const input = join(__dirname, 'fixtures', 'animated.gif')
      const filePath = join(tmp, 'out-fit-height.gif')
      const expectedOutput = join(
        __dirname,
        'fixtures',
        'resized-animated-fit-height.gif'
      )
      const readStream = fs.createReadStream(input)
      const writeStream = fs.createWriteStream(filePath)

      readStream
        .pipe(resize)
        .pipe(writeStream, { height: 200, mode: 'fit', interlaced: false })

      writeStream.on('close', function () {
        const options = {
          file: join(tmp, 'resized-animated-fit-height-diff.gif'),
          tolerance: 0.001,
          highlightColor: 'yellow'
        }
        gm.compare(
          filePath,
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

    it('should correctly stretch resize animated gifs', function (done) {
      const input = join(__dirname, 'fixtures', 'animated.gif')
      const filePath = join(tmp, 'out-stretch.gif')
      const expectedOutput = join(
        __dirname,
        'fixtures',
        'resized-animated-stretch.gif'
      )
      const readStream = fs.createReadStream(input)
      const writeStream = fs.createWriteStream(filePath)

      readStream.pipe(resize).pipe(writeStream, {
        width: 200,
        height: 100,
        mode: 'stretch',
        interlaced: false
      })

      writeStream.on('close', function () {
        const options = {
          file: join(tmp, 'resized-animated-stretch-diff.gif'),
          tolerance: 0.001,
          highlightColor: 'yellow'
        }
        gm.compare(
          filePath,
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

    it('should not match a failed resize done by graphicsmagick', function (done) {
      this.timeout('15000')
      const input = join(__dirname, 'fixtures', 'landscape.gif')
      const filePath = join(tmp, 'out-landscape-fit.gif')
      const gmOutput = join(__dirname, 'fixtures', 'landscape-resized-gm.gif')
      const readStream = fs.createReadStream(input)
      const writeStream = fs.createWriteStream(filePath)

      readStream
        .pipe(resize)
        .pipe(writeStream, { height: 200, mode: 'fit', interlaced: false })

      writeStream.on('close', function () {
        async.map(
          [gmOutput, filePath],
          function (item, cb) {
            gm(item).identify(function (err, result) {
              cb(err, result)
            })
          },
          function (err, results) {
            const item = results[0]
            const other = results[1]

            assert.notDeepEqual(
              item.size,
              other.size,
              'Gifs should not match in size'
            )
            assert.strictEqual(
              item.Format.length,
              other.Format.length,
              'Both gifs should have the same number of frames'
            )
            assert.notDeepEqual(
              item.Geometry,
              other.Geometry,
              'Gif frame geometry should differ'
            )
            done()
          }
        )
      })
    })

    it('should correctly resize optimised animated gifs', function (done) {
      const input = join(__dirname, 'fixtures', 'landscape.gif')
      const filePath = join(tmp, 'out-landscape-fit.gif')
      const expectedOutput = join(
        __dirname,
        'fixtures',
        'landscape-resized-gifsicle.gif'
      )
      const readStream = fs.createReadStream(input)
      const writeStream = fs.createWriteStream(filePath)

      readStream
        .pipe(resize)
        .pipe(writeStream, { height: 200, mode: 'fit', interlaced: false })

      writeStream.on('close', function () {
        const options = {
          file: join(tmp, 'landscape-resized-diff.gif'),
          tolerance: 0.001,
          highlightColor: 'yellow'
        }
        gm.compare(
          filePath,
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
