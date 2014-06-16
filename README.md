[ImageManager.js](http://gfcarvalho.github.io/ImageManager.js/)
===================
[![Build Status](https://travis-ci.org/gfcarvalho/image-manager.js.svg?branch=master)](https://travis-ci.org/gfcarvalho/image-manager.js)
[![Code Climate](https://codeclimate.com/github/gfcarvalho/ImageManager.js.png)](https://codeclimate.com/github/gfcarvalho/ImageManager.js)

By Gustavo Carvalho

ImageManager.js is an easy to use, small and standalone but powerful and complex library that gives you amazing control of your image assets by preloading, caching and managing it.

Get total control of the images on your page by using ***ImageManager.js***.

##Features
- Tag loading and eased progress information
- Event oriented
- After loaded, all images will be accessible through a cache object
- Create independent load tasks

##Examples:

Preload a set of images, show the loading progress using the progress element and draw it on a canvas when load finishes:

```js 
var images = [{
    name: "bkg",
    src: "img/background.png"
}, {
    name: "frg",
    src: "img/foreground.png"
}, {
    name: "player",
    src: "img/player.png"
}];

var progressElem = document.getElementById('progress');
var canvasContext = document.getElementById('canvas').getContext('2d');

function onComplete(e) {
    var status = e.status; // OK : all images successfully downloaded,
                           // FAIL : one or more image has failed to download      
                           // ABORTED : one or more images weren't downloaded because user clicked on X button

    var cache = ImageManager.cache; // retrieve the cache

    if (status === ImageManager.OK) {
        // draw images on canvas
        canvasContext.drawImage(cache.bkg, 0, 0);
        canvasContext.drawImage(cache.frg, 0, 0);
        canvasContext.drawImage(cache.player, 60, 180);
    } else {
        // notify the user and ask to reload the page
        if(confirm('Error on load images. Reload the page to try again?')) {
            window.location.reload();
        }
    }
}

function onProgress(progress) {
    progressElem.value = progress;
    progressElem.innerHTML = 'Loading...' + progress + '%';
}

ImageManager.load(images, onComplete, onProgress); // start the loading process
    
```

[Live example](https://dl.dropboxusercontent.com/u/37981960/github/ImageManager.js/demos/example/index.html)
