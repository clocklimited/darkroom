module.exports = createGifsicle

const { spawn } = require('child_process')

function createGifsicle(args) {
  const process = spawn('gifsicle', args)

  return process
}
