module.exports = tasks

var join = require('path').join
  , child

// Growl is only for Mac users
try {
  var growl = require('growl')
} catch (e) {}

function notify() {
  if (growl) growl.apply(null, arguments)
}

function tasks(pliers) {

  pliers.filesets('tests', [join(__dirname, 'test', '*', '**/*.test.js')])
  pliers.filesets('serverJs',
    [ join(__dirname, 'lib/**/*.js')
    , join(__dirname, '*.js')
    , join(__dirname, 'test/**/*.js')
    ]
  )

  pliers('qa', 'test', 'lint')
  pliers('noExitQa', 'noExitLint', 'noExitTest')

  pliers('lint', function (done) {
    pliers.exec('jshint .', true, done)
  })

  pliers('noExitLint', function (done) {
    var child = pliers.exec('jshint .', false, done)
    child.on('exit', function (code) {
      if (code === 1) {
        notify('Lint errors found')
      }
    })
  })

  pliers('noExitTest', function (done) {
    var child = pliers.exec('node test/tests.js', false, done)
    child.on('exit', function (code) {
      if (code === 1) {
        notify('Lint errors found')
      }
    })
  })

  pliers('qaWatch', function () {
    pliers.logger.info('Watching for JavaScript changes for QA')
    pliers.run('noExitQa')
    pliers.watch(pliers.filesets.serverJs, function () {
      pliers.run('noExitQa')
    })
  })

  pliers('test', function (done) {
    pliers.exec('node test/tests.js', done)
  })

  pliers('start', function (done) {
    if (child) child.kill()
    child = pliers.exec('node app')
    done()
  })

  pliers('watch', function () {

    pliers.logger.info('Watching for application JavaScript changes')
    pliers.watch(pliers.filesets.serverJs, function () {
      pliers.run('start', function () {
        pliers.logger.info('Restarting server…')
        notify('Server restarted')
      })
    })

    pliers.run('start')

  })

}