var resize  = require('./resize')
  , crop = require('./cropper')
  , optimise = require('./optimise')
  , info = require('./info')
  // , storage = require('./darkroom-cdn')
  , darkroom = {}

darkroom.resize = resize
darkroom.crop = crop
darkroom.optimise = optimise
darkroom.info = info

module.exports = darkroom