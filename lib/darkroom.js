var resize  = require('./resizer')
  , crop = require('./cropper')
  , optimise = require('./optimise')
  , storage = require('./darkroom-cdn')
  , darkroom = {}

darkroom.resize = resize
darkroom.crop = crop
darkroom.optimise = optimise

module.exports = darkroom