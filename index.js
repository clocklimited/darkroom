if (require('./package').cairo !== require('canvas').cairoVersion) {
  throw new Error('Please ensure your cairo version is set to '
    + require('./package').cairo
    + ' current version is at: ' + require('canvas').cairoVersion)
  return false
}

module.exports = require('./lib/darkroom')