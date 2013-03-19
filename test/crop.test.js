var Crop = require('../lib/crop')
  , streamToTest = require('./stream.fixture.js')
  , fs = require('fs')
  , join = require('path').join
  , tmp = join(__dirname, 'fixtures', 'temp')
  , crop

describe('CropStream', function() {

  beforeEach(function() {
    crop = new Crop()
  })

  describe('Inherit from DarkroomStream', function () {
    it('should have a pipe method', function () {
      crop.should.be.a('object').and.have.property('pipe')
    })

    it('should have a write method', function () {
      crop.should.be.a('object').and.have.property('write')
    })

    it('shouldn\'t have a pause method', function () {
      crop.should.be.a('object').and.not.have.property('pause')
    })
  })

  it('should read in an image using streams', function () {
    crop.chunks.should.have.lengthOf(0)
    streamToTest(crop)
  })

  it('should return an image with a known length', function (done) {
    crop.chunks.should.have.lengthOf(0)
    var readStream = fs.createReadStream(join(__dirname, 'fixtures', 'bill.png'))
      , writeStream = fs.createWriteStream(join(tmp, 'little-bill.png'))

    readStream.pipe(crop).pipe(writeStream
    , { width: 200
      , height: 200
      }
    )

    writeStream.on('close', function() {
      fs.readFile(join(tmp, 'little-bill.png'), function (err, data) {
        if (err) {
          throw err
        }
        data.length.should.equal(51372)
        done()
      })
    })
  })

  it('should return an image with the dimensions of 100x200', function (done) {
    crop.chunks.should.have.lengthOf(0)
    var filepath = join(tmp, '100x200.png')
      , readStream = fs.createReadStream(join(__dirname, 'fixtures', 'bill.png'))
      , writeStream = fs.createWriteStream(filepath)

    readStream.pipe(crop).pipe(writeStream
    , { width: 100
      , height: 200
      }
    )

    writeStream.on('close', function() {
      fs.readFile(filepath, function (err, data) {
        if (err) {
          throw err
        }
        data.length.should.equal(26258)
        done()
      })
    })
  })
})