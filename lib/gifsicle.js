module.exports = createGifsicle

var spawn = require('child_process').spawn

function createGifsicle (args) {
  var process = spawn('gifsicle', args)

  return process
}
