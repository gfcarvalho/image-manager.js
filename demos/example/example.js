/*jslint indent: 4 */
/*jslint white: false */
/*jslint browser: true */
/*jslint devel: true */
/*jslint vars: true */

(function (global) {
    "use strict";
    
    var ImageManager = global.ImageManager; // import ImagerManager to the local scope

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
            if (confirm('Error on load images. Reload the page to try again?')) {
                window.location.reload();
            }
        }
    }
    
    function onProgress(progress) {
        progressElem.value = progress;
        progressElem.innerHTML = 'Loading...' + progress + '%';
    }

    ImageManager.load(images, onComplete, onProgress); // start the loading process

}(this));
