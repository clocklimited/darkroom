var Resize = require('../lib/resize')
  , streamToTest = require('./stream.fixture.js')
  , fs = require('fs')
  , join = require('path').join
  , tmp = join(__dirname, 'fixtures', 'temp')
  , resize
  , _ = require('lodash')
  , assert = require('assert')

function run(files, amount, i, ready) {
    var resize2 = new Resize()
        , filepath = join(tmp, i + 'xmultiple.png')
        , readStream = fs.createReadStream(join(__dirname, 'fixtures', 'bill' + i + '.png'))
        , writeStream = fs.createWriteStream(filepath)
        , status = 0
        , finishStatus = 0

      files.push(filepath)

      var timeout = Math.random() * 10

        readStream.on('end', function () {
          console.log('end', i)
        })

        readStream.on('close', function () {
          console.log('close', i)
        })

        resize2.on('error', function (error) {
          console.log('resize error', error)
          throw error
        })

        writeStream.on('error', function (error) {
          console.log('writeStream error', error)
          throw error
        })

        readStream.on('error', function (error) {
          console.log('readStream error', error)
          throw error
        })

        writeStream.on('close', function(error) {
          if (error) throw error
          if (status === 1)
            throw new Error('End has already been called')
          status = 1
          console.log('ready with ', i)
          fs.readFile(filepath, function (err, data) {
            if (err) throw err
            // assert(data.length === 100614, 'length ' + data.length + ' does not match expected '
            //   + 100614 + ' for id ' + i)
            ready(i)
          })
        })

      resize2.on('end', function () {
        // console.log('end', i, resize2.ended)
        console.log('start', i)
        if (finishStatus === 1)
          throw new Error('End has already been called')
        finishStatus = 1
      })

      setTimeout(function() {
        readStream.pipe(writeStream)
        // console.log('wait ' + timeout + ' for ' + i)

      }, timeout)


}

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
        data.length.should.equal(51372)
        done()
      })
    })
  })

  this.timeout(6000)
  it('should return an image with the dimensions multiple times', function (done) {
    var ready = 0
      , amount = 10
      , files = []

    for (var i = 0; i <= amount; i++) {
      run(files, amount, i, function(i) {
        console.log(i)
        ready++

      })
    }
    var poll = setInterval(function() {
      if (ready > amount) {
        _.each(files, function(file) {
          fs.unlinkSync(file)
        })
        done()
        clearInterval(poll)
      }
    }, 10)
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
        data.length.should.equal(26258)
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
        data.length.should.equal(26258)
        done()
      })
    })
  })
})