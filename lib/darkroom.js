var resize  = require('./resize')
  , crop = require('./cropper')
  , optimise = require('./optimise')
  , info = require('./info')
  , watermark = require('./watermark')
  // , storage = require('./darkroom-cdn')
  , darkroom = {}

darkroom.resize = resize
darkroom.crop = crop
darkroom.optimise = optimise
darkroom.info = info
darkroom.watermark = watermark

module.exports = darkroom
