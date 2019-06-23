# darkroom

[![Greenkeeper badge](https://badges.greenkeeper.io/clocklimited/darkroom.svg)](https://greenkeeper.io/)

An image manipulation library.

## Installation

As of v4.0.0 darkroom requires 1.3.20+ to work correctly.

It will still mostly work with GraphicsMagick 1.3.18+ but the `resize({ mode: 'fit '})` will
not work due to this [#36](https://github.com/clocklimited/Darkroom-api/issues/36)

v4 will not work well with GraphicsMagick pre 1.3.18

### Mac OS 

    brew install graphicsmagick
    npm install --save