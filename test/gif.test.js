var assert = require('assert')
  , Resize = require('../lib/resize')
  , join = require('path').join
  , tmp
  , resize
  , temp = require('temp')
  // , rimraf = require('rimraf')
  , fs = require('fs')
  , gm = require('gm')

describe('Testing GIF output', function() {

  before(function () {
    temp.mkdir('gif-test', function(err, path) {
      tmp = path
    })
  })
  beforeEach(function() {
    resize = new Resize()
  })

  after(function () {
    // If you need to see some of the image diffs from failing test comment
    // out this line.
    // rimraf.sync(tmp)
  })

  it('Should ouput a resized GIF', function (done) {
    var fileName = 'not-working.gif'
    , out = join(tmp, fileName)
    , input = join(__dirname, 'fixtures', fileName)
    , readStream = fs.createReadStream(input)
    , writeStream = fs.createWriteStream(out)
    , expectedOut = join(__dirname, 'fixtures', fileName)

    readStream.pipe(resize).pipe(writeStream
       , { width: 200
         , height: 200
         , mode: 'stretch'
         }
       )

    writeStream.on('close', function () {
      var options =
      { file: join(tmp, fileName)
      , tolerance: 0.001
      }
      gm.compare(out, expectedOut, options, function(err, isEqual, equality, raw) {
        console.log(equality)
        console.log(isEqual)
        console.log(input + ' ' + options.file)
        assert.equal(isEqual, true, 'Images do not match see ‘' +  options.file + '’ for a diff.\n' + raw)
        done()
      })
    })
  })
})
