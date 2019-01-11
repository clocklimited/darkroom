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
      streamOutput(err, context.stdout)
    })
  }
}

function getGifsicleContext (cb) {
  var params = [ '--colors', '256' ]
    , input
    , originalBuffer = Buffer.concat(this.chunks, this.size)
    , self = this

  if (this.mode === 'fit') {
    params.push('--resize-touch', this.width + 'x' + this.height)
  } else if (this.mode === 'cover') {
    // Cropping takes place before any rotation, flipping, resizing, or positioning.
    // This ensures the resize happens first
    var dimens
      , buffers = []

    if (this.width < this.height) {
      dimens = this.width + 'x_'
    } else {
      dimens = '_x' + this.height
    }

    input = createGifsicle(params.concat('--resize-touch', dimens))
    input.stdout.on('data', function (data) { buffers.push(data) })
    input.stdout.on('end', function () {
      var resized = Buffer.concat(buffers)
      gm(resized).identify(function (err, data) {
        if (err) return cb(err)

        var widthTrim = Math.floor((data.size.width - self.width) / 2)
          , heightTrim = Math.floor((data.size.height - self.height) / 2)
          , crop = widthTrim + ',' + heightTrim + '+-' + widthTrim + 'x' + heightTrim
          , context = createGifsicle([ '--crop', crop, '--colors', '256' ])

        context.stdin.write(resized)
        context.stdin.end()
        cb(null, context)
      })
    })

    input.stdin.write(originalBuffer)
    input.stdin.end()
  } else {
    params.push('--resize', this.width + 'x' + this.height)
  }
  if (!input) {
    var context = createGifsicle(params)
    context.stdin.write(originalBuffer)
    context.stdin.end()
    cb(null, context)
  }
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
