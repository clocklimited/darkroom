module.exports = createGifsicle

var spawn = require('child_process').spawn
  , which = require('which')

function createGifsicle (args) {
  var gifsiclePath = which.sync('gifsicle')
    , process = spawn(gifsiclePath, args)

  return process
}
