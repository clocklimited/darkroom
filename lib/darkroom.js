var resize  = require('./resize')
  , crop = require('./cropper')
  , optimise = require('./optimise')
  , info = require('./info')
  , composite = require('./composite')
  // , storage = require('./darkroom-cdn')
  , darkroom = {}

darkroom.resize = resize
darkroom.crop = crop
darkroom.optimise = optimise
darkroom.info = info
darkroom.composite = composite

module.exports = darkroom