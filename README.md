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