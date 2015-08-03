var Resize = require('../lib/resize')
  , streamToTest = require('./stream.fixture.js')
  , fs = require('fs')
  , join = require('path').join
  , tmp
  , temp = require('temp')
  , resize
  , rimraf = require('rimraf')
  , gm = require('gm')

describe('ResizeStream', function() {

  before(function () {
    temp.mkdir('crop-test', function(err, path) {
      tmp = path
    })
  })

  after(function () {
    // If you need to see some of the image diffs from failing test comment
    // out this line.
    rimraf.sync(tmp)
  })

  beforeEach(function() {
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

  it('should return an image with a known length', function (done) {
    resize.chunks.should.have.lengthOf(0)
    var filePath = join(tmp, 'small-stretch.png')
      , readStream = fs.createReadStream(join(__dirname, 'fixtures', '500x399-24bit.png'))
      , writeStream = fs.createWriteStream(filePath)

    readStream.pipe(resize).pipe(writeStream
    , { width: 200
      , height: 200
      , mode: 'stretch'
      }
    )

    writeStream.on('close', function() {
      fs.readFile(filePath, function (err, data) {
        if (err) throw err
        data.length.should.be.above(100)
        done()
      })
    })
  })

  it('should return an image with the dimensions of 100x50', function (done) {
    resize.chunks.should.have.lengthOf(0)
    var filepath = join(tmp, '100x50-stretch.png')
      , readStream = fs.createReadStream(join(__dirname, 'fixtures', '500x399.jpeg'))
      , writeStream = fs.createWriteStream(filepath)

    readStream.pipe(resize).pipe(writeStream
    , { width: 100
      , height: 50
      , mode: 'stretch'
      }
    )

    writeStream.on('close', function() {
       gm(filepath).size(function (err, size) {
        size.width.should.equal(100)
        size.height.should.equal(50)
        done()
      })
    })
  })

  it('should stretch down if source is bigger than required height', function (done) {
    resize.chunks.should.have.lengthOf(0)
    var filepath = join(tmp, '100x200-stretch.png')
      , readStream = fs.createReadStream(join(__dirname, 'fixtures', '500x399-24bit.png'))
      , writeStream = fs.createWriteStream(filepath)

    readStream.pipe(resize).pipe(writeStream
    , { width: 100
      , height: 200
      , mode: 'stretch'
      }
    )

    writeStream.on('close', function() {
       gm(filepath).identify(function (err, data) {
        data.size.width.should.equal(100)
        data.size.height.should.equal(200)
        done()
      })
    })
  })

  it('should scale up if source is smaller than required height', function (done) {
    resize.chunks.should.have.lengthOf(0)
    var filepath = join(tmp, '600x200-scaleup-stretch.png')
      , readStream = fs.createReadStream(join(__dirname, 'fixtures', '500x399-24bit.png'))
      , writeStream = fs.createWriteStream(filepath)

    readStream.pipe(resize).pipe(writeStream
    , { width: 600
      , height: 200
      , mode: 'stretch'
      }
    )

    writeStream.on('close', function() {
       gm(filepath).identify(function (err, data) {
        data.size.width.should.equal(600)
        data.size.height.should.equal(200)
        done()
      })
    })
  })

  it('should keep ratio on 500x399 image when only resizing by width', function (done) {
    resize.chunks.should.have.lengthOf(0)
    var filepath = join(tmp, '100x-fit-landscape.png')
      , readStream = fs.createReadStream(join(__dirname, 'fixtures', '500x399-24bit.png'))
      , writeStream = fs.createWriteStream(filepath)

    readStream.pipe(resize).pipe(writeStream
    , { width: 100
      , mode: 'fit'
      }
    )

    writeStream.on('close', function() {
       gm(filepath).identify(function (err, data) {
        data.size.width.should.equal(100)
        data.size.height.should.equal(80)
        done()
      })
    })
  })

  it('should keep ratio on 500x399 image when only resizing by height', function (done) {
    resize.chunks.should.have.lengthOf(0)
    var filepath = join(tmp, 'x100-fit-landscape.png')
      , readStream = fs.createReadStream(join(__dirname, 'fixtures', '500x399-24bit.png'))
      , writeStream = fs.createWriteStream(filepath)

    readStream.pipe(resize).pipe(writeStream
    , { height: 100
      , mode: 'fit'
      }
    )

    writeStream.on('close', function() {
       gm(filepath).identify(function (err, data) {
        data.size.width.should.equal(125)
        data.size.height.should.equal(100)
        done()
      })
    })
  })

  it('should keep ratio for landscape and constrain to 100x100', function (done) {
    resize.chunks.should.have.lengthOf(0)
    var filepath = join(tmp, '100x100-fit-landscape-width-and-height.png')
      , readStream = fs.createReadStream(join(__dirname, 'fixtures', '500x399-24bit.png'))
      , writeStream = fs.createWriteStream(filepath)

    readStream.pipe(resize).pipe(writeStream
    , { height: 100
      , width: 100
      , mode: 'fit'
      }
    )

    writeStream.on('close', function() {
       gm(filepath).identify(function (err, data) {
        data.size.width.should.equal(100)
        data.size.height.should.equal(80)
        done()
      })
    })
  })

  it('should keep ratio for portrait and constrain to 100x100', function (done) {
    resize.chunks.should.have.lengthOf(0)
    var filepath = join(tmp, '100x100-fit-portrait-width-and-height.png')
      , readStream = fs.createReadStream(join(__dirname, 'fixtures', '399x500-24bit.png'))
      , writeStream = fs.createWriteStream(filepath)

    readStream.pipe(resize).pipe(writeStream
    , { height: 100
      , width: 100
      , mode: 'fit'
      }
    )

    writeStream.on('close', function() {
       gm(filepath).identify(function (err, data) {
        data.size.width.should.equal(80)
        data.size.height.should.equal(100)
        done()
      })
    })
  })

  it('should correctly ‘cover’ with a landscape constrained to 100x100', function (done) {
    resize.chunks.should.have.lengthOf(0)
    var filepath = join(tmp, '100x100-cover-landscape-width-and-height.png')
      , readStream = fs.createReadStream(join(__dirname, 'fixtures', '500x399-24bit.png'))
      , writeStream = fs.createWriteStream(filepath)

    readStream.pipe(resize).pipe(writeStream
    , { height: 100
      , width: 100
      , mode: 'cover'
      }
    )

    writeStream.on('close', function() {
       gm(filepath).identify(function (err, data) {
        data.size.width.should.equal(100)
        data.size.height.should.equal(100)
        done()
      })
    })
  })

  it('should correctly ‘cover’ with a portrait constrained to 100x100', function (done) {
    resize.chunks.should.have.lengthOf(0)
    var filepath = join(tmp, '100x100-cover-portrait-width-and-height.png')
      , readStream = fs.createReadStream(join(__dirname, 'fixtures', '399x500-24bit.png'))
      , writeStream = fs.createWriteStream(filepath)

    readStream.pipe(resize).pipe(writeStream
    , { height: 100
      , width: 100
      , mode: 'cover'
      }
    )

    writeStream.on('close', function() {
       gm(filepath).identify(function (err, data) {
        data.size.width.should.equal(100)
        data.size.height.should.equal(100)
        done()
      })
    })
  })

  it('should correctly ‘cover’ with a landscape constrained to 100x100 with an 8bit png', function (done) {
    resize.chunks.should.have.lengthOf(0)
    var filepath = join(tmp, '100x100-cover-landscape-8bit-width-and-height.png')
      , readStream = fs.createReadStream(join(__dirname, 'fixtures', '500x399-8bit.png'))
      , writeStream = fs.createWriteStream(filepath)

    readStream.pipe(resize).pipe(writeStream
    , { height: 100
      , width: 100
      , mode: 'cover'
      }
    )

    writeStream.on('close', function() {
       gm(filepath).identify(function (err, data) {
        data.size.width.should.equal(100)
        data.size.height.should.equal(100)
        done()
      })
    })
  })

  it('should error if stretch is attempted with only a width', function () {
    resize.chunks.should.have.lengthOf(0)
    var filepath = join(tmp, '100x-should-error.png')
      , readStream = fs.createReadStream(join(__dirname, 'fixtures', '500x399.jpeg'))
      , writeStream = fs.createWriteStream(filepath)

    ;(function() {
      readStream.pipe(resize).pipe(writeStream
      , { width: 100
        , mode: 'stretch'
        }
      )
    }).should.throw('Unable to stretch to a single dimension constant')

  })

  it('should scale up with only one requested dimension', function (done) {
    resize.chunks.should.have.lengthOf(0)
    var filepath = join(tmp, '600x479-scale-up-width.png')
      , readStream = fs.createReadStream(join(__dirname, 'fixtures', '500x399.jpeg'))
      , writeStream = fs.createWriteStream(filepath)

    readStream.pipe(resize).pipe(writeStream
    , { width: 600
      , mode: 'fit'
      }
    )

    writeStream.on('close', function() {
       gm(filepath).size(function (err, size) {
        size.width.should.equal(600)
        size.height.should.equal(479)
        done()
      })
    })
  })

  it('should return a progressive image ', function (done) {
    resize.chunks.should.have.lengthOf(0)
    var filepath = join(tmp, 'progressive-test.jpg')
      , inputfile = join(__dirname, 'fixtures', 'bill-non-progressive.jpeg')
      , readStream = fs.createReadStream(inputfile)
      , writeStream = fs.createWriteStream(filepath)

    readStream.pipe(resize).pipe(writeStream
    , { width: 100
      , height: 200
      }
    )

    writeStream.on('close', function() {
      gm(filepath).identify(function (err, data) {
        data.Interlace.should.equal('Line')
        done()
      })
    })
  })

  it('should return a image of the same type as the input ', function (done) {
    resize.chunks.should.have.lengthOf(0)
    var filepath = join(tmp, 'iampng')
      , inputfile = join(__dirname, 'fixtures', '500x399-24bit.png')
      , readStream = fs.createReadStream(inputfile)
      , writeStream = fs.createWriteStream(filepath)

    readStream.pipe(resize).pipe(writeStream
    , { width: 100
      , height: 200
      }
    )

    writeStream.on('close', function() {
      gm(filepath).identify(function (err, data) {
        data.format.should.equal('PNG')
        done()
      })
    })
  })

  it('Corrupted image should trigger error', function (done) {
    resize.chunks.should.have.lengthOf(0)
    var filepath = join(tmp, 'broken-image.png')
      , readStream = fs.createReadStream(join(__dirname, 'fixtures', 'broken-image.png'))
      , writeStream = fs.createWriteStream(filepath)

    readStream.pipe(resize).pipe(writeStream
      , { width: 100
        , height: 200
      }
    )

    resize.on('error', function() {
      fs.readFile(filepath, function (err) {
        if (err) {
          throw err
        }
        done()
      })
    })
  })
})
