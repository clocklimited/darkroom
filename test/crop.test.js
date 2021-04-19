var assert = require('assert'),
  CropStream = require('../lib/crop'),
  DarkroomStream = require('../lib/darkroom-stream'),
  join = require('path').join,
  tmp,
  temp = require('temp'),
  rimraf = require('rimraf'),
  fs = require('fs'),
  gm = require('gm'),
  async = require('async')

describe('CropStream', function () {
  before(function (done) {
    temp.mkdir('crop-test', function (err, path) {
      tmp = path
      done()
    })
  })

  after(function () {
    // If you need to see some of the image diffs from failing test comment
    // out this line.
    rimraf.sync(tmp)
  })

  it('should be a DarkroomStream', function () {
    var s = new CropStream()
    assert(s instanceof DarkroomStream)
  })

  var formats = ['png', 'gif']
  formats.forEach(function (format) {
    describe('shared crop tests: ' + format, function () {
      it('Corrupted image should trigger error', function (done) {
        var filepath = join(tmp, 'broken-image.' + format),
          readStream = fs.createReadStream(
            join(__dirname, 'fixtures', 'broken-image.' + format)
          ),
          writeStream = fs.createWriteStream(filepath),
          cropStream = new CropStream()

        readStream.pipe(cropStream).pipe(writeStream, {
          crop: {
            w: 400,
            h: 400
          }
        })

        cropStream.on('error', function () {
          fs.readFile(filepath, function (err) {
            if (err) {
              throw err
            }
            done()
          })
        })
      })

      it('Should handle crop of xx.9', function (done) {
        var options = {
            crop: {
              w: 89.9,
              h: 79.9,
              x1: 99.9,
              y1: 29.9
            },
            gravity: 'NorthWest'
          },
          image = new CropStream(),
          input = join(__dirname, 'fixtures', 'test-pattern.' + format),
          out = join(tmp, 'test-pattern-test-xx.9.' + format),
          readStream = fs.createReadStream(input),
          writeStream = fs.createWriteStream(out),
          expectedOut = join(
            __dirname,
            'fixtures',
            'test-pattern-cropped.' + format
          )

        readStream.pipe(image).pipe(writeStream, options)

        writeStream.on('close', function () {
          var options = {
            file: join(tmp, 'test-pattern-test-diff-xx.9.' + format),
            tolerance: 0.001,
            highlightColor: 'yellow'
          }
          gm.compare(
            out,
            expectedOut,
            options,
            function (err, isEqual, equality, raw) {
              assert.equal(
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
        var options = {
            crop: {
              w: 89.5,
              h: 79.5,
              x1: 99.5,
              y1: 29.5
            },
            gravity: 'NorthWest'
          },
          image = new CropStream(),
          input = join(__dirname, 'fixtures', 'test-pattern.' + format),
          out = join(tmp, 'test-pattern-test-xx.5.' + format),
          readStream = fs.createReadStream(input),
          writeStream = fs.createWriteStream(out),
          expectedOut = join(
            __dirname,
            'fixtures',
            'test-pattern-cropped-xx.5.' + format
          )

        readStream.pipe(image).pipe(writeStream, options)

        writeStream.on('close', function () {
          var options = {
            file: join(tmp, 'test-pattern-test-diff-xx.5.' + format),
            tolerance: 0.001,
            highlightColor: 'yellow'
          }
          gm.compare(
            out,
            expectedOut,
            options,
            function (err, isEqual, equality, raw) {
              assert.equal(
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
        var options = {
            crop: {
              w: 90.1,
              h: 80.1,
              x1: 100.1,
              y1: 30.1
            },
            gravity: 'NorthWest'
          },
          image = new CropStream(),
          input = join(__dirname, 'fixtures', 'test-pattern.' + format),
          out = join(tmp, 'test-pattern-test-xx.1.' + format),
          readStream = fs.createReadStream(input),
          writeStream = fs.createWriteStream(out),
          expectedOut = join(
            __dirname,
            'fixtures',
            'test-pattern-cropped.' + format
          )

        readStream.pipe(image).pipe(writeStream, options)

        writeStream.on('close', function () {
          var options = {
            file: join(tmp, 'test-pattern-test-diff-xx.1.' + format),
            tolerance: 0.001,
            highlightColor: 'yellow'
          }
          gm.compare(
            out,
            expectedOut,
            options,
            function (err, isEqual, equality, raw) {
              assert.equal(
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
      var options = {
          crop: { w: 300, h: 200 }
        },
        image = new CropStream(),
        input = join(__dirname, 'fixtures', 'oriented-right-in-exif.jpeg'),
        out = join(tmp, 'oriented-right-in-exif-cropped.jpeg'),
        readStream = fs.createReadStream(input),
        writeStream = fs.createWriteStream(out),
        expectedOut = join(
          __dirname,
          'fixtures',
          'oriented-right-in-exif-cropped-expected.jpeg'
        )

      readStream.pipe(image).pipe(writeStream, options)

      writeStream.on('close', function () {
        var options = {
          file: join(tmp, 'oriented-right-in-exif-cropped-diff.jpeg'),
          tolerance: 0.001,
          highlightColor: 'yellow'
        }
        gm.compare(
          out,
          expectedOut,
          options,
          function (err, isEqual, equality, raw) {
            assert.equal(
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
      var options = {
          crop: {
            w: 720,
            h: 480
          },
          gravity: 'Center'
        },
        image = new CropStream(),
        out = join(tmp, 'gravity-portrait-cropped-test.png'),
        input = join(__dirname, 'fixtures', 'gravity-portrait-original.jpeg'),
        readStream = fs.createReadStream(input),
        writeStream = fs.createWriteStream(out),
        expectedOut = join(
          __dirname,
          'fixtures',
          'gravity-portrait-cropped.jpeg'
        )

      readStream.pipe(image).pipe(writeStream, options)

      writeStream.on('close', function () {
        var options = {
          file: join(tmp, 'gravity-portrait-cropped-diff.jpeg'),
          tolerance: 0.001,
          highlightColor: 'yellow'
        }
        gm.compare(
          out,
          expectedOut,
          options,
          function (err, isEqual, equality, raw) {
            assert.equal(
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
      var options = {
          crop: {
            w: 400,
            h: 400
          },
          gravity: 'Center'
        },
        image = new CropStream(),
        out = join(tmp, 'gravity-landscape-cropped-test.png'),
        input = join(__dirname, 'fixtures', 'gravity-landscape-original.jpeg'),
        readStream = fs.createReadStream(input),
        writeStream = fs.createWriteStream(out),
        expectedOut = join(
          __dirname,
          'fixtures',
          'gravity-landscape-cropped.jpeg'
        )

      readStream.pipe(image).pipe(writeStream, options)

      writeStream.on('close', function () {
        var options = {
          file: join(tmp, 'gravity-landscape-cropped-diff.jpeg'),
          tolerance: 0.001,
          highlightColor: 'yellow'
        }
        gm.compare(
          out,
          expectedOut,
          options,
          function (err, isEqual, equality, raw) {
            assert.equal(
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
      var options = {
          crop: {
            w: 90,
            h: 80,
            x1: 100,
            y1: 30
          },
          gravity: 'NorthWest'
        },
        image = new CropStream(),
        input = join(__dirname, 'fixtures', 'test-pattern.gif'),
        out = join(tmp, 'test-pattern-test.gif'),
        readStream = fs.createReadStream(input),
        writeStream = fs.createWriteStream(out),
        expectedOut = join(__dirname, 'fixtures', 'test-pattern-cropped.gif')

      readStream.pipe(image).pipe(writeStream, options)

      writeStream.on('close', function () {
        var options = {
          file: join(tmp, 'animated-cropped-diff.gif'),
          tolerance: 0.001,
          highlightColor: 'yellow'
        }
        gm.compare(
          out,
          expectedOut,
          options,
          function (err, isEqual, equality, raw) {
            assert.equal(
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
      var options = {
          crop: {
            w: 90,
            h: 80,
            x1: 100,
            y1: 30
          },
          gravity: 'NorthWest'
        },
        image = new CropStream(),
        input = join(__dirname, 'fixtures', 'animated.gif'),
        out = join(tmp, 'animated-cropped.gif'),
        readStream = fs.createReadStream(input),
        writeStream = fs.createWriteStream(out),
        expectedOut = join(__dirname, 'fixtures', 'animated-cropped.gif')

      readStream.pipe(image).pipe(writeStream, options)

      writeStream.on('close', function () {
        var options = {
          file: join(tmp, 'animated-cropped-diff.gif'),
          tolerance: 0.001,
          highlightColor: 'yellow'
        }
        gm.compare(
          out,
          expectedOut,
          options,
          function (err, isEqual, equality, raw) {
            assert.equal(
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
      var options = {
          crop: {
            w: 100,
            h: 100,
            x1: 0,
            y1: 0
          }
        },
        image = new CropStream(),
        input = join(__dirname, 'fixtures', 'landscape.gif'),
        out = join(tmp, 'landscape-cropped-gm.gif'),
        readStream = fs.createReadStream(input),
        writeStream = fs.createWriteStream(out),
        expectedOut = join(__dirname, 'fixtures', 'landscape-gm.gif')

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
            var item = results[0],
              other = results[1]

            assert.notEqual(
              item.Format.length,
              other.Format.length,
              'Images should not have the same number of frames'
            )
            assert.deepEqual(
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
      var options = {
          crop: {
            w: 100,
            h: 100,
            x1: 0,
            y1: 0
          }
        },
        image = new CropStream(),
        input = join(__dirname, 'fixtures', 'landscape.gif'),
        out = join(tmp, 'landscape-cropped-gifsicle.gif'),
        readStream = fs.createReadStream(input),
        writeStream = fs.createWriteStream(out),
        expectedOut = join(__dirname, 'fixtures', 'landscape-gifsicle.gif')

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
            var item = results[0],
              other = results[1]

            assert.equal(
              item.Format.length,
              other.Format.length,
              'Gifs should have the same number of frames'
            )
            assert.deepEqual(
              item.size,
              other.size,
              'Gifs should be the same size'
            )
            assert.deepEqual(
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
