if (require('./package').cairo !== require('canvas').cairoVersion) {
  throw new Error('Please ensure your cairo version is set to '
    + require('canvas').cairoVersion
    + ' current version is at: ' + require('./package').cairo)
  return false
}

module.exports = require('./lib/darkroom')