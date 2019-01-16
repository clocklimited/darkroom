var DarkroomStream = require('./darkroom-stream')
  , Stream = require('stream').Stream
  , gm = require('gm')
  , fileType = require('file-type')
  , createGifsicle = require('./gifsicle')

function Resize() {
  if (!(this instanceof Resize))
    return new Resize()
  DarkroomStream.call(this)
  this.width = 0
  this.height = 0
}

Resize.prototype = Object.create(DarkroomStream.prototype)

Resize.prototype.pipe = function(dest, options) {
  /* jshint maxcomplexity: 10 */

  options = options || {}
  this.width = options.width || null
  this.height = options.height || null
  this.quality = options.quality || 75
  this.mode = options.mode || 'fit'
  this.format = options.format || null

  if ((this.mode === 'stretch') && ((this.width === null) || (this.height === null)))
    throw new Error('Unable to stretch to a single dimension constant')

  var self = this

  if (self.resume)
    self.resume()

  return Stream.prototype.pipe.call(self, dest, options)
}

Resize.prototype.write = function (chunk) {
  DarkroomStream.prototype.write.call(this, chunk)
}

Resize.prototype.end = function (chunk) {
  DarkroomStream.prototype.end.call(this, chunk)
  this.exec.call(this)
}

Resize.prototype.exec = function () {
  var self = this
    , imageFileType = fileType(this.chunks[0])
    , context

  if (imageFileType === null) {
    self.emit('error', new Error('Unsupported file type'))
    return false
  }

  function streamOutput(err, stdout, stderr) {
    if (err) {
      self.emit('error', err)
      return
    }

    stdout.on('data', self.emit.bind(self, 'data'))
    if (stderr) {
      stderr.on('data', self.emit.bind(self, 'error'))
    }

    stdout.on('end', function (chunk) {
      self.emit('end', chunk)
    })
  }

  if (imageFileType.ext !== 'gif') {
    context = getGmContext.call(this, imageFileType)
    context.stream(streamOutput)
  } else {
    context = getGifsicleContext.call(this, function (err, context) {
      if (err) {
        return streamOutput(err)
      }
      streamOutput(null, context.stdout)
    })
  }
}

function getGifsicleContext (cb) {
  var params = [ '--colors', '256' ]
    , originalBuffer = Buffer.concat(this.chunks, this.size)
    , width = (this.width || '_')
    , height = (this.height || '_')

  if (this.mode === 'cover') {
    return gm(originalBuffer).size(function(err, size) {
      if (err) {
        return cb(err)
      }
      getGifsicleCoverResize.call(this, params, originalBuffer, size, cb)
    }.bind(this))
  } else if (this.mode === 'fit') {
    params.push('--resize-touch', width + 'x' + height)
  } else {
    params.push('--resize', width + 'x' + height)
  }

  var context = createGifsicle(params)
  context.stdin.write(originalBuffer)
  context.stdin.end()
  cb(null, context)
}

function getGifsicleCoverResize(params, originalBuffer, originalSize, cb) {
  // Cropping takes place before any rotation, flipping, resizing, or positioning.
  // This ensures the resize happens first
  var newSize = { width: this.width, height: this.height }
    , dimens = calculateResize(originalSize, newSize)
    , buffers = []
    , input = createGifsicle(params.concat('--resize', dimens))

  input.stdout.on('data', function (data) { buffers.push(data) })
  input.stdout.on('end', function () {
    var resized = Buffer.concat(buffers)
    gm(resized).size(function (err, currentSize) {
      if (err) return cb(err)

      var widthTrim = (currentSize.width - newSize.width) / 2
        , heightTrim = (currentSize.height - newSize.height) / 2
        , crop = calculateCrop(widthTrim, heightTrim)
        , context = createGifsicle([ '--crop', crop, '--colors', '256' ])

      context.stdin.write(resized)
      context.stdin.end()
      cb(null, context)
    })
  })

  input.stdin.write(originalBuffer)
  input.stdin.end()
}

function calculateResize(originalSize, newSize) {
  var dimens

  if (newSize.width < newSize.height
     || (newSize.width === newSize.height
     && originalSize.width < originalSize.height)) {
    dimens = newSize.width + 'x_'
  } else {
    dimens = '_x' + newSize.height
  }

  return dimens
}

function calculateCrop(widthTrim, heightTrim) {
  var widthTrimStart = widthTrim
    , heightTrimStart = heightTrim
    , widthTrimAmount = widthTrim
    , heightTrimAmount = heightTrim

  if (widthTrim !== 0) {
    widthTrimStart = widthTrim - 0.5
    widthTrimAmount = widthTrim + 0.5
  }

  if (heightTrim !== 0) {
    heightTrimStart = heightTrim - 0.5
    heightTrimAmount = heightTrim + 0.5
  }
  return widthTrimStart + ',' + heightTrimStart + '+-' + widthTrimAmount + 'x-' + heightTrimAmount
}

function getGmContext (imageFileType) {
  var outputFileType = this.format || imageFileType.ext
    , context = gm(Buffer.concat(this.chunks, this.size))
        .options({ nativeAutoOrient: true })
        .autoOrient()
        .colorspace('RGB')
        .gravity('North')
        .noProfile()
        .bitdepth(8)
        .unsharp(0.25, 0.25, 8, 0.065)
        .quality(this.quality)

  if (this.format) context.setFormat(this.format)

  if (outputFileType === 'jpg') {
    // This makes it progressive
    context = context.interlace('Line')
  }

  if (this.mode === 'fit') {
    context.resize(this.width, this.height)
  } else if (this.mode === 'cover') {
    context
      .resize(this.width, this.height, '^')
      .background('transparent')
      .extent(this.width, this.height)
  } else {
    context.resize(this.width, this.height, '!')
  }

  return context
}

module.exports = Resize
