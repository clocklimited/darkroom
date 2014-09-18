var Resize = require('../lib/resize')
  , streamToTest = require('./stream.fixture.js')
  , fs = require('fs')
  , join = require('path').join
  , tmp = join(__dirname, 'fixtures', 'temp')
  , resize
  , mkdirp = require('mkdirp')
  , rimraf = require('rimraf')

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
      resize.should.be.type('object').and.have.property('pipe')
    })

    it('should have a write method', function () {
      resize.should.be.type('object').and.have.property('write')
    })

    it('should shouldn\'t have a pause method', function () {
      resize.should.be.type('object').and.not.have.property('pause')
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

  it('should return an image with the dimensions of 100x200', function (done) {
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
      fs.readFile(filepath, function (err, data) {
        if (err) throw err
        data.length.should.be.above(100)
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
      fs.readFile(filepath, function (err, data) {
        if (err) {
          throw err
        }
        done()
      })
    })
  })
})