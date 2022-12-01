const assert = require('assert')
const CropStream = require('../lib/crop')
const DarkroomStream = require('../lib/darkroom-stream')
const { join } = require('path')
const temp = require('temp')
// const rimraf = require('rimraf')
const fs = require('fs')
const gm = require('gm')
const async = require('async')
let tmp

describe.only('CropStream', function () {
  before(function (done) {
    temp.mkdir('crop-test', function (err, path) {
      if (err) return done(err)
      tmp = path
      done()
    })
  })

  after(function () {
    // If you need to see some of the image diffs from failing test comment
    // out this line.
    // rimraf.sync(tmp)
  })

  it('should be a DarkroomStream', function () {
    const s = new CropStream()
    assert(s instanceof DarkroomStream)
  })

  const formats = ['png', 'gif']
  formats.forEach(function (format) {
    describe('shared crop tests: ' + format, function () {
      it('Corrupted image should trigger error', function (done) {
        const filepath = join(tmp, 'broken-image.' + format)
        const readStream = fs.createReadStream(
          join(__dirname, 'fixtures', 'broken-image.' + format)
        )
        const writeStream = fs.createWriteStream(filepath)
        const cropStream = new CropStream()

        readStream.pipe(cropStream).pipe(writeStream, {
          crop: {
            w: 400,
            h: 400
          }
        })

        cropStream.on('error', function () {
          fs.readFile(filepath, done)
        })
      })

      it('Should handle crop of xx.9', function (done) {
        const options = {
          crop: {
            w: 89.9,
            h: 79.9,
            x1: 99.9,
            y1: 29.9
          },
          gravity: 'NorthWest'
        }
        const image = new CropStream()
        const input = join(__dirname, 'fixtures', 'test-pattern.' + format)
        const out = join(tmp, 'test-pattern-test-xx.9.' + format)
        const readStream = fs.createReadStream(input)
        const writeStream = fs.createWriteStream(out)
        const expectedOut = join(
          __dirname,
          'fixtures',
          'test-pattern-cropped.' + format
        )

        readStream.pipe(image).pipe(writeStream, options)

        writeStream.on('close', function () {
          const options = {
            file: join(tmp, 'test-pattern-test-diff-xx.9.' + format),
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

      it('Should handle crop of xx.5', function (done) {
        const options = {
          crop: {
            w: 89.5,
            h: 79.5,
            x1: 99.5,
            y1: 29.5
          },
          gravity: 'NorthWest'
        }
        const image = new CropStream()
        const input = join(__dirname, 'fixtures', 'test-pattern.' + format)
        const out = join(tmp, 'test-pattern-test-xx.5.' + format)
        const readStream = fs.createReadStream(input)
        const writeStream = fs.createWriteStream(out)
        const expectedOut = join(
          __dirname,
          'fixtures',
          'test-pattern-cropped-xx.5.' + format
        )

        readStream.pipe(image).pipe(writeStream, options)

        writeStream.on('close', function () {
          const options = {
            file: join(tmp, 'test-pattern-test-diff-xx.5.' + format),
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

      it('Should handle crop of xx.1', function (done) {
        const options = {
          crop: {
            w: 90.1,
            h: 80.1,
            x1: 100.1,
            y1: 30.1
          },
          gravity: 'NorthWest'
        }
        const image = new CropStream()
        const input = join(__dirname, 'fixtures', 'test-pattern.' + format)
        const out = join(tmp, 'test-pattern-test-xx.1.' + format)
        const readStream = fs.createReadStream(input)
        const writeStream = fs.createWriteStream(out)
        const expectedOut = join(
          __dirname,
          'fixtures',
          'test-pattern-cropped.' + format
        )

        readStream.pipe(image).pipe(writeStream, options)

        writeStream.on('close', function () {
          const options = {
            file: join(tmp, 'test-pattern-test-diff-xx.1.' + format),
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

  describe('orientation', function () {
    it('should auto orient the image for the cropped output', function (done) {
      const options = {
        crop: { w: 300, h: 200 }
      }
      const image = new CropStream()
      const input = join(__dirname, 'fixtures', 'oriented-right-in-exif.jpeg')
      const out = join(tmp, 'oriented-right-in-exif-cropped.jpeg')
      const readStream = fs.createReadStream(input)
      const writeStream = fs.createWriteStream(out)
      const expectedOut = join(
        __dirname,
        'fixtures',
        'oriented-right-in-exif-cropped-expected.jpeg'
      )

      readStream.pipe(image).pipe(writeStream, options)

      writeStream.on('close', function () {
        const options = {
          file: join(tmp, 'oriented-right-in-exif-cropped-diff.jpeg'),
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

  describe('gravity', function () {
    it('should return an image of the requested size when a portrait image is cropped', function (done) {
      const options = {
        crop: {
          w: 720,
          h: 480
        },
        gravity: 'Center'
      }
      const image = new CropStream()
      const out = join(tmp, 'gravity-portrait-cropped-test.png')
      const input = join(
        __dirname,
        'fixtures',
        'gravity-portrait-original.jpeg'
      )
      const readStream = fs.createReadStream(input)
      const writeStream = fs.createWriteStream(out)
      const expectedOut = join(
        __dirname,
        'fixtures',
        'gravity-portrait-cropped.jpeg'
      )

      readStream.pipe(image).pipe(writeStream, options)

      writeStream.on('close', function () {
        const options = {
          file: join(tmp, 'gravity-portrait-cropped-diff.jpeg'),
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

    it('should return an image of the requested size when a landscape image is cropped', function (done) {
      const options = {
        crop: {
          w: 400,
          h: 400
        },
        gravity: 'Center'
      }
      const image = new CropStream()
      const out = join(tmp, 'gravity-landscape-cropped-test.png')
      const input = join(
        __dirname,
        'fixtures',
        'gravity-landscape-original.jpeg'
      )
      const readStream = fs.createReadStream(input)
      const writeStream = fs.createWriteStream(out)
      const expectedOut = join(
        __dirname,
        'fixtures',
        'gravity-landscape-cropped.jpeg'
      )

      readStream.pipe(image).pipe(writeStream, options)

      writeStream.on('close', function () {
        const options = {
          file: join(tmp, 'gravity-landscape-cropped-diff.jpeg'),
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

  describe('gif', function () {
    it('should correctly crop single page gif', function (done) {
      const options = {
        crop: {
          w: 90,
          h: 80,
          x1: 100,
          y1: 30
        },
        gravity: 'NorthWest'
      }
      const image = new CropStream()
      const input = join(__dirname, 'fixtures', 'test-pattern.gif')
      const out = join(tmp, 'test-pattern-test.gif')
      const readStream = fs.createReadStream(input)
      const writeStream = fs.createWriteStream(out)
      const expectedOut = join(
        __dirname,
        'fixtures',
        'test-pattern-cropped.gif'
      )

      readStream.pipe(image).pipe(writeStream, options)

      writeStream.on('close', function () {
        const options = {
          file: join(tmp, 'animated-cropped-diff.gif'),
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

    it('should correctly crop animated gif', function (done) {
      const options = {
        crop: {
          w: 90,
          h: 80,
          x1: 100,
          y1: 30
        },
        gravity: 'NorthWest'
      }
      const image = new CropStream()
      const input = join(__dirname, 'fixtures', 'animated.gif')
      const out = join(tmp, 'animated-cropped.gif')
      const readStream = fs.createReadStream(input)
      const writeStream = fs.createWriteStream(out)
      const expectedOut = join(__dirname, 'fixtures', 'animated-cropped.gif')

      readStream.pipe(image).pipe(writeStream, options)

      writeStream.on('close', function () {
        const options = {
          file: join(tmp, 'animated-cropped-diff.gif'),
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

    it('should not match optimised gif cropped by gm', function (done) {
      // optimising the mangled gm gif takes time
      this.timeout(15000)
      const options = {
        crop: {
          w: 100,
          h: 100,
          x1: 0,
          y1: 0
        }
      }
      const image = new CropStream()
      const input = join(__dirname, 'fixtures', 'landscape.gif')
      const out = join(tmp, 'landscape-cropped-gm.gif')
      const readStream = fs.createReadStream(input)
      const writeStream = fs.createWriteStream(out)
      const expectedOut = join(__dirname, 'fixtures', 'landscape-gm.gif')

      readStream.pipe(image).pipe(writeStream, options)

      writeStream.on('close', function () {
        async.map(
          [expectedOut, out],
          function (item, cb) {
            gm(item).identify(function (err, result) {
              cb(err, result)
            })
          },
          function (err, results) {
            const item = results[0],
              other = results[1]

            assert.notEqual(
              item.Format.length,
              other.Format.length,
              'Images should not have the same number of frames'
            )
            assert.deepStrictEqual(
              item.size,
              other.size,
              'Images should be the same size'
            )
            assert.notDeepEqual(
              item.Geometry,
              other.Geometry,
              'Gif frames should not be the same size'
            )
            done()
          }
        )
      })
    })

    it('should match gif cropped by gifsicle', function (done) {
      const options = {
        crop: {
          w: 100,
          h: 100,
          x1: 0,
          y1: 0
        }
      }
      const image = new CropStream()
      const input = join(__dirname, 'fixtures', 'landscape.gif')
      const out = join(tmp, 'landscape-cropped-gifsicle.gif')
      const readStream = fs.createReadStream(input)
      const writeStream = fs.createWriteStream(out)
      const expectedOut = join(__dirname, 'fixtures', 'landscape-gifsicle.gif')

      readStream.pipe(image).pipe(writeStream, options)

      writeStream.on('close', function () {
        async.map(
          [expectedOut, out],
          function (item, cb) {
            gm(item).identify(function (err, result) {
              cb(err, result)
            })
          },
          function (err, results) {
            const item = results[0]
            const other = results[1]

            assert.strictEqual(
              item.Format.length,
              other.Format.length,
              'Gifs should have the same number of frames'
            )
            assert.deepStrictEqual(
              item.size,
              other.size,
              'Gifs should be the same size'
            )
            assert.deepStrictEqual(
              item.Geometry,
              other.Geometry,
              'Gif frames should be the same size'
            )
            done()
          }
        )
      })
    })
  })
})
