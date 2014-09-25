var Resize = require('../lib/resize')
  , streamToTest = require('./stream.fixture.js')
  , fs = require('fs')
  , join = require('path').join
  , tmp = join(__dirname, 'fixtures', 'temp')
  , resize
  , mkdirp = require('mkdirp')
  , rimraf = require('rimraf')
  , gm = require('gm')

describe('ResizeStream', function() {

  before(function () {
    rimraf.sync(tmp)
    mkdirp.sync(tmp)
  })

  after(function () {
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
    var readStream = fs.createReadStream(join(__dirname, 'fixtures', 'bill.png'))
      , writeStream = fs.createWriteStream(join(tmp, 'little-bill.png'))

    readStream.pipe(resize).pipe(writeStream
    , { width: 200
      , height: 200
      }
    )

    writeStream.on('close', function() {
      fs.readFile(join(tmp, 'little-bill.png'), function (err, data) {
        if (err) throw err
        data.length.should.be.above(100)
        done()
      })
    })
  })

  it('should return an image with the dimensions of 100x50', function (done) {
    resize.chunks.should.have.lengthOf(0)
    var filepath = join(tmp, '100x50.png')
      , readStream = fs.createReadStream(join(__dirname, 'fixtures', 'bill.jpeg'))
      , writeStream = fs.createWriteStream(filepath)

    readStream.pipe(resize).pipe(writeStream
    , { width: 100
      , height: 50
      }
    )

    writeStream.on('close', function() {
       gm(filepath).identify(function (err, data) {
        data.size.width.should.equal(100)
        data.size.height.should.equal(50)
        done()
      })
    })
  })

  it('should resize to bigger on than original width', function (done) {
    resize.chunks.should.have.lengthOf(0)
    var filepath = join(tmp, '600x100.png')
      , readStream = fs.createReadStream(join(__dirname, 'fixtures', 'bill.jpeg'))
      , writeStream = fs.createWriteStream(filepath)

    readStream.pipe(resize).pipe(writeStream
    , { width: 600
      , height: 100
      }
    )

    writeStream.on('close', function() {
       gm(filepath).identify(function (err, data) {
        data.size.width.should.equal(600)
        data.size.height.should.equal(100)
        done()
      })
    })
  })

  it('should resize to bigger on than original height', function (done) {
    resize.chunks.should.have.lengthOf(0)
    var filepath = join(tmp, '100x200.png')
      , readStream = fs.createReadStream(join(__dirname, 'fixtures', 'bill.png'))
      , writeStream = fs.createWriteStream(filepath)

    readStream.pipe(resize).pipe(writeStream
    , { width: 100
      , height: 200
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

  it('should return image 100x80 keeping ratio on 500x399 image', function (done) {
    resize.chunks.should.have.lengthOf(0)
    var filepath = join(tmp, '100x80.png')
      , readStream = fs.createReadStream(join(__dirname, 'fixtures', 'bill.jpeg'))
      , writeStream = fs.createWriteStream(filepath)

    readStream.pipe(resize).pipe(writeStream
    , { width: 100
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

  it('should not be able to resize bigger then original', function (done) {
    resize.chunks.should.have.lengthOf(0)
    var filepath = join(tmp, '600x500.png')
      , readStream = fs.createReadStream(join(__dirname, 'fixtures', 'bill.jpeg'))
      , writeStream = fs.createWriteStream(filepath)

    readStream.pipe(resize).pipe(writeStream
    , { width: 600
      }
    )

    writeStream.on('close', function() {
       gm(filepath).identify(function (err, data) {
        data.size.width.should.equal(500)
        data.size.height.should.equal(399)
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
      , inputfile = join(__dirname, 'fixtures', 'bill.png')
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
