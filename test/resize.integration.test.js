var should = require('should')
  , darkroom = require('darkroom-server')
  , request = require('request')

darkroom.listen()

describe('Resize', function() {
  describe('#scaleAndResize', function() {
    it('should return an object containing a src attribute', function(done) {
      request(darkroom.url + '/resize', function(req, res, body) {
        body.should.be.a('object').and.has.property('src')
        done()
      })
    })
  })
})