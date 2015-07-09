var darkroom = require('..')
  , assert = require('assert')

describe('darkroom', function() {
  it('should have correct interface', function() {
    assert(darkroom.Crop)
    assert(darkroom.Info)
    assert(darkroom.Watermark)
    assert(darkroom.Resize)
    assert(darkroom.Circle)
  })
})
