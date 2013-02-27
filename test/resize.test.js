var Resize = require('../lib/resize')
  , streamToTest = require('./stream.fixture.js')
  , fs = require('fs')
  , join = require('path').join
  , temp = require('temp')
  , resize

describe('ResizeStream', function() {

  beforeEach(function() {
    resize = new Resize()
  })

  describe('Inherit from DarkroomStream', function () {
    it('should have a pipe method', function () {
      resize.should.be.a('object').and.have.property('pipe')
    })

    it('should have a write method', function () {
      resize.should.be.a('object').and.have.property('write')
    })

    it('should shouldn\'t have a pause method', function () {
      resize.should.be.a('object').and.not.have.property('pause')
    })
  })

  it('should read in an image using streams', function () {
    resize.chunks.should.have.lengthOf(0)
    streamToTest(resize)
  })

  it('should return an image as a DataUri at 200x200', function (done) {
    resize.chunks.should.have.lengthOf(0)
    var readStream = fs.createReadStream(join(__dirname, 'fixtures', 'bill.png'))
      , writeStream = fs.createWriteStream(join(__dirname, 'fixtures', 'little-bill.png'))

    readStream.pipe(resize).pipe(writeStream)

    writeStream.on('close', function() {
      fs.readFile(join(__dirname, 'fixtures', 'little-bill.png'), function (err) {
        if (err) throw err
        resize.size.should.equal(57901)
        temp.cleanup()
        done()
      })
    })
  })
})