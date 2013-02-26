var Mocha = require('mocha')
  , join = require('path').join
  , fs = require('fs')

require('should')

var mocha = new Mocha()
  , counts =
    { total: 0
    , pass: 0
    , fail: 0
    }

function addFile(filepath) {

  if (fs.existsSync(filepath)) {
    console.log('Adding tests ' + filepath)
    mocha.addFile(filepath)
  }
  return
}

mocha.reporter('spec').ui('bdd');

addFile(join(__dirname, 'resize.integration.test.js'))

var runner = mocha.run(function () {
  console.log('Finished', counts)
  process.exit(counts.fail === 0 ? 0 : 1)
})

runner.on('pass', function () {
  counts.total += 1
  counts.pass += 1
})

runner.on('fail', function () {
  counts.total += 1
  counts.fail += 1
})