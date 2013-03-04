var canvas = require('canvas')
  , packageJson = require('../package')

describe('Cario', function() {

  it('should be version ' + packageJson.cairo, function() {
    canvas.cairoVersion.should.equal(packageJson.cairo)
  })
})