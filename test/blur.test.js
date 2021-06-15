const assert = require('assert')
const BlurStream = require('../lib/blur')
const DarkroomStream = require('../lib/darkroom-stream')
const { join } = require('path')
const temp = require('temp')
const rimraf = require('rimraf')
const fs = require('fs')
const gm = require('gm')
let tmp

describe.only('BlurStream', function () {
  before(function (done) {
    temp.mkdir('blur-test', function (err, path) {
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

  it('should be a DarkroomStream', function () {
    const s = new BlurStream({
      masks: [
        [
          [100, 100],
          [100, 200],
          [200, 100]
        ]
      ]
    })
    assert(s instanceof DarkroomStream)
  })

  it('should default to pixelate the whole image', function (done) {
    const blur = new BlurStream()
    const out = join(tmp, '500x399-blurred-full.png')
    const input = join(__dirname, 'fixtures', '500x399.jpeg')
    const readStream = fs.createReadStream(input)
    const writeStream = fs.createWriteStream(out)

    readStream.pipe(blur).pipe(writeStream)

    function getImageSize(img, cb) {
      return gm(img).size(cb)
    }

    writeStream.on('close', function () {
      getImageSize(input, function (err, size) {
        if (err) return done(err)
        assert.strictEqual(500, size.width)
        assert.strictEqual(399, size.height)
        done()
      })
    })
  })

  it('should blur the whole image', function (done) {
    this.timeout(5000)
    const blur = new BlurStream({ method: 'gaussian' })
    const out = join(tmp, '500x399-gauss-blurred-full.png')
    const input = join(__dirname, 'fixtures', '500x399.jpeg')
    const readStream = fs.createReadStream(input)
    const writeStream = fs.createWriteStream(out)

    readStream.pipe(blur).pipe(writeStream)

    function getImageSize(img, cb) {
      return gm(img).size(cb)
    }

    writeStream.on('close', function () {
      getImageSize(input, function (err, size) {
        if (err) return done(err)
        assert.strictEqual(500, size.width)
        assert.strictEqual(399, size.height)
        done()
      })
    })
  })

  it('should handle an incorrect mask format', function (done) {
    const blur = new BlurStream({ masks: ['lmao'] })
    const out = join(tmp, '500x399-blurred-error.png')
    const input = join(__dirname, 'fixtures', '500x399.jpeg')
    const readStream = fs.createReadStream(input)
    const writeStream = fs.createWriteStream(out)

    readStream.pipe(blur).pipe(writeStream)

    blur.on('error', function (err) {
      assert(err, 'Did Error')
      done()
    })
  })

  it('should pixellate a 100x100 square', function (done) {
    const blur = new BlurStream({
      masks: [
        [
          [0, 0],
          [0, 100],
          [100, 100],
          [100, 0]
        ]
      ]
    })
    const input = join(__dirname, 'fixtures', '500x399.jpeg')

    const out = join(tmp, '500x399-pixel-portion.png')
    const expectedOutput = join(
      __dirname,
      'fixtures',
      '500x399-pixel-portion.png'
    )

    const readStream = fs.createReadStream(input)
    const writeStream = fs.createWriteStream(out)

    readStream.pipe(blur).pipe(writeStream)

    function getImageSize(img, cb) {
      return gm(img).size(cb)
    }

    writeStream.on('close', function () {
      getImageSize(input, function (err, size) {
        if (err) return done(err)
        assert.strictEqual(size.width, 500)
        assert.strictEqual(size.height, 399)

        const options = {
          file: join(tmp, '500x399-pixel-portion-diff.png'),
          tolerance: 0.001,
          highlightColor: 'yellow'
        }

        gm.compare(
          out,
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

  it('should blur a 100x100 square', function (done) {
    this.timeout(5000)
    const blur = new BlurStream({
      masks: [
        [
          [0, 0],
          [0, 100],
          [100, 100],
          [100, 0]
        ]
      ],
      method: 'gaussian'
    })
    const input = join(__dirname, 'fixtures', '500x399.jpeg')

    const out = join(tmp, '500x399-blurred-portion.png')
    const expectedOutput = join(
      __dirname,
      'fixtures',
      '500x399-blurred-portion.png'
    )

    const readStream = fs.createReadStream(input)
    const writeStream = fs.createWriteStream(out)

    readStream.pipe(blur).pipe(writeStream)

    function getImageSize(img, cb) {
      return gm(img).size(cb)
    }

    writeStream.on('close', function () {
      getImageSize(input, function (err, size) {
        if (err) return done(err)
        assert.strictEqual(size.width, 500)
        assert.strictEqual(size.height, 399)

        const options = {
          file: join(tmp, '500x399-blurred-portion-diff.png'),
          tolerance: 0.001,
          highlightColor: 'yellow'
        }

        gm.compare(
          out,
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

  it('should pixellate a 100x100 square and a triangle', function (done) {
    const blur = new BlurStream({
      masks: [
        [
          [0, 0],
          [0, 100],
          [100, 100],
          [100, 0]
        ],

        [
          [300, 200],
          [400, 200],
          [350, 300]
        ]
      ]
    })
    const input = join(__dirname, 'fixtures', '500x399.jpeg')

    const out = join(tmp, '500x399-pixel-multi-portion.png')
    const expectedOutput = join(
      __dirname,
      'fixtures',
      '500x399-pixel-multi-portion.png'
    )

    const readStream = fs.createReadStream(input)
    const writeStream = fs.createWriteStream(out)

    readStream.pipe(blur).pipe(writeStream)

    function getImageSize(img, cb) {
      return gm(img).size(cb)
    }

    writeStream.on('close', function () {
      getImageSize(input, function (err, size) {
        if (err) return done(err)
        assert.strictEqual(size.width, 500)
        assert.strictEqual(size.height, 399)

        const options = {
          file: join(tmp, '500x399-pixel-multi-portion-diff.png'),
          tolerance: 0.001,
          highlightColor: 'yellow'
        }

        gm.compare(
          out,
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

  it('should pixellate a square and a triangle on a large image', function (done) {
    const blur = new BlurStream({
      masks: [
        [
          [0, 0],
          [0, 500],
          [500, 500],
          [500, 0]
        ],

        [
          [1300, 800],
          [1400, 800],
          [1350, 1300]
        ]
      ]
    })

    const input = join(__dirname, 'fixtures', 'massive-image.jpg')

    const out = join(tmp, 'massive-image-output.png')
    const expectedOutput = join(
      __dirname,
      'fixtures',
      'massive-image-output.png'
    )

    const readStream = fs.createReadStream(input)
    const writeStream = fs.createWriteStream(out)

    readStream.pipe(blur).pipe(writeStream)

    function getImageSize(img, cb) {
      return gm(img).size(cb)
    }

    this.timeout(10000)

    writeStream.on('close', function () {
      getImageSize(input, function (err, size) {
        if (err) return done(err)
        assert.strictEqual(size.width, 3024)
        assert.strictEqual(size.height, 2016)

        const options = {
          file: join(tmp, '500x399-pixel-multi-portion-diff.png'),
          tolerance: 0.001,
          highlightColor: 'yellow'
        }

        gm.compare(
          out,
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
