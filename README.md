darkroom
========

An image manipulation service.


Authentication between services and client will be achieved by using Oauth. This will allow each request to be tied to a specific user account allowing per client granularity.

# Installation
## Mac OS X 10.8
    Install X11 from here: http://xquartz.macosforge.org/
    brew install cairo
    export PKG_CONFIG_PATH=$PKG_CONFIG_PATH:/opt/X11/lib/pkgconfig
    npm install

http://darkroom.io

# API

## Default response will be either an (301 to an image / JSON object pointing to a resource)

## POST /

Creates an image on Darkroom.

### Body

`src` - URL of image to manipulate, or send as multipart form data.

    { "src": "http://tomg.co/image.png" }

### Response

    { "image": "http://darkroom.io/randomstring" }

## POST /resize/{imageurl}

Images will be resized, omission of the width or height parameter will auto resize based on the aspect ratio of the source image.


### Body

`src` - URL of image to manipulate, or send as multipart form data.

`sizes` - An array of sizes to return, dimensions cannot be larger than the source image.

    { "src": "http://tomg.co/image.png"
    , "sizes":
      [ { w: 200
        , h: 400
        }
      , [100, 200]
      , [50] // keeps aspect ratio
      ]
    }

### Response

    { "200x400": "http://darkroom.io/200x400_image.png"
    , "100x200": "http://darkroom.io/100x200_image.png"
    , "50": "http://darkroom.io/50_image.png"
    }

### GET /resize/{width}/{height}/{imageurl}
or
### GET /resize/{width}/{imageurl}

With height being optional. This will return a (301 to an image / link to a CDN hosted version in a JSON structure)

## GET /{imageurl}
or
## GET /optimise/10/{imageurl}
## GET /optimize/10/{imageurl}

This returns with a default optimisation to an image at a specified level from 0-7, 4 being a default and 10 is the most aggressive however more likely to cause artefacts.

Optimisation level (0-10), default of 4.

## GET /original/{imageurl}

Returns the original image

### Request

    { "src": "http://tomg.co/image.png"
    , "level": 2
    }

### Response

    { "image": "http://darkroom.io/opt/2/100x200_image.png"
    }

## POST /crop/{imageurl}

This will preform a manual crop on image using the specified coordinates, for a width and height.

`sizes` - An array of sizes to return, dimensions cannot be larger than the source image.

`sizes.crops` - An object containing the coordinates of the crop to be made. Coordinates are relative to the original image.

### Request

    { "src": "http://tomg.co/image.png"
    , "sizes":
      [ { w: 200
        , h: 400
        , crops:
          { x1: 10
          , x2: 100
          , y1: 100
          , y2: 100
          , w: 100 // relation to original image
          , h: 200 // ""           ""
          }
        }
      , [100, 200] // auto cropped when resized
      ]
    }

### Response

    { "200x400": "http://darkroom.io/200x400_image.png"
    , "100x200": "http://darkroom.io/100x200_image.png"
    }

## GET /

Darkroom.io site.