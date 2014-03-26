/*jslint vars: true */
/*jslint indent: 4 */
/*jslint white: false */
/*jslint browser: true */
/*jslint devel: true */

/** 
 *  ImageManager.js
 *  @author <a href="mailto:gfcarv@gmail.com">Gustavo Carvalho</a>
 */
(function (global, undefined) {
    'use strict';
    
    /**
    * Make debug using console safe in all browsers
    * @constructor
    */
    function JSDebugger(tag, mode) {
        
        var EMPTY = function () {},
            TAG = '[JSDebugger]';
        
        this.error = EMPTY;
        this.info = EMPTY;
        this.log = EMPTY;
        this.warn = EMPTY;
        
        if (!global.console || typeof global.console === 'undefined') {
            return this;
        }
        
        switch (mode) {
        case 0: // none (no messages are shown)                
            this.error = EMPTY;
            this.info = EMPTY;
            this.log = EMPTY;
            this.warn = EMPTY;
            return this;
        case 1: // debug (show info and logs only)
            console.info(TAG, tag, 'MODE: Logs and Info only');
            this.error = EMPTY;
            this.info = console.info.bind(console, tag);
            this.log = console.log.bind(console, tag);
            this.warn = EMPTY;
            return this;
        case 2: // errors (show errors only)
            console.info(TAG, tag, 'MODE: Errors only');
            this.error = console.error.bind(console, tag);
            this.info = EMPTY;
            this.log = EMPTY;
            this.warn = EMPTY;
            return this;
        default: // verbose (show all messages)
            console.info(TAG, tag, 'MODE: Verbose');
            this.error = console.error.bind(console, tag);
            this.info = console.info.bind(console, tag);
            this.log = console.log.bind(console, tag);
            this.warn = console.warn.bind(console, tag);
            return this;
        }
    }
    
    /**
    * ID Generator
    * Generate sequential unique numerical ID's
    * @construtor
    */
    function IdGenerator() {
        var id = 0;
        this.generate = function () {
            id += 1;
            return id;
        };
    }

    /**
    * ImageManager
    */
    var ImageManager = (function (undefined) {
        var EMPTY_FN = function () {}, // a function that simple returns undefined
            debug, // new instance of JSDebbuger
            idGenerator, // an instance of IdGenerator
            cache, // keeps a reference for each image
            cacheSize, // number of images completely loaded
            totalToLoad, // number of images to load
            loadStack, // hold all load processes
            loadStackSize; // track the length of loadStack

        debug = new JSDebugger('[ImageManager]', 0);
        idGenerator = new IdGenerator();
        
        cache = {};
        cacheSize = 0;
        totalToLoad = 0;
        loadStack = {};
        loadStackSize = 0;
        
        /**
         * kill an especific LoadProcess instance
         * @private
         */
        function endProcess(id) {
            debug.log('Ending load process:', id);
            if (loadStack.hasOwnProperty(id)) {
                loadStack[id].clear();
                loadStack[id] = null; // release memory
                delete loadStack[id]; // remove property
                loadStackSize -= 1;
            }
        }

        /**
         * Creates a process that controls the loading of an image or a set of images
         * @private
         * @constructor
         */
        function LoadProcess() {
            var instance = this, // capture the instance of this process
                instanceID = '#' + idGenerator.generate(), // generate a unique id
                collection = {}, // hold the images of this process
                loaded = 0, // number of images of this instance that has finish load              
                toLoad = 0, // number of images remaining
                errors = 0, // number of images with errors
                loading = false, // true if this load process is running, false otherwise
                onProgress = EMPTY_FN, // user defined callback
                onComplete = EMPTY_FN; // user defined callback

            /**
             * Called when an image is loaded
             * @private
             */
            function onImageLoad(name, src, onload) {
                loaded += 1;
                cache[name] = collection[name];
                cacheSize += 1;
                
                debug.log(collection[name].src, '  loaded');

                // call the user defined onload callback for a specific image when it's loaded
                onload.call(cache[name]);

                // call the user defined onProgress callback when any image is loaded
                onProgress.call(undefined, instance.getProgress());

                // check if all images (of this instance) are loaded with or without errors,
                // call the onComplete callback and kill the thread                
                if (loaded === toLoad) {
                    loading = false;
                    
                    endProcess(instanceID);
                    debug.log('Load process', instanceID, 'done with no errors.');
                    
                    onComplete.call(undefined, {code: 1, errors: 0});
                    
                } else if (loaded + errors === toLoad) {
                    loading = false;
                    
                    endProcess(instanceID);
                    debug.warn('Load process', instanceID, 'done with', errors, 'errors');
                    
                    onComplete.call(undefined, {code: 0, errors: errors});
                }
            }

            /**
             * Load an image from an object definition and set it to the images pool
             * @private
             */
            function loadImage(obj) {
                var name = null,
                    src = null,
                    onload = EMPTY_FN,
                    onerror = EMPTY_FN;

                // validate name property
                if (obj.name && typeof obj.name === 'string') {
                    name = obj.name;
                    if (cache.hasOwnProperty(name)) {
                        debug.warn('Duplicated names found. Overwriting', name);
                    }
                } else {
                    throw new Error('Missing or invalid name property. Check your image(s) object(s)');
                }

                // validate src property
                if (obj.src && typeof obj.src === 'string') {
                    src = obj.src;
                } else {
                    throw new Error('Missing or invalid src property. Check your image(s) object(s)');
                }

                // validate the onload and on error properties
                if (obj.onload && typeof obj.onload === 'function') {
                    onload = obj.onload;
                }
                if (obj.onerror && typeof obj.onerror === 'function') {
                    onerror = obj.onerror;
                }

                // TAG LOADER:
                // creates a new Image object and add it to this instance's collection
                
                collection[name] = new Image();
                collection[name].name = name;
                collection[name].onload = function () {
                    onImageLoad(name, src, onload);
                };
                collection[name].onerror = function (e) {
                    errors += 1;
                    onerror.call(this, e);
                    if (loaded + errors === toLoad) {
                        loading = false;
                        onComplete.call(undefined, {code: 0, errors: errors});

                        debug.warn('Load process', instanceID, 'done with', errors, 'errors');
                        endProcess(instanceID); // kill this load thread
                    }
                };
                collection[name].src = src;
            }
            
             /**
             * Get the ID of this loading process
             * @priviledged
             * @function
             * @return Number
             */
            this.getId = function () {
                return instanceID;
            };

            /**
             * Get the overall progress of this loading process, in percentage
             * @priviledged
             * @function
             * @return Number
             */
            this.getProgress = function () {
                return (loaded / toLoad) * 100;
            };

            /**
             * If this loading process is still loading
             * @priviledged
             * @function
             * @return Boolean
             */
            this.isLoading = function () {
                return loading;
            };
            
            /**
             * Release the memory of a load process
             * @priviledged
             * @function
             * @return Boolean
             */
            this.clear = function () {
                var img;
                for (img in collection) {
                    if (collection.hasOwnProperty(img)) {
                        collection[img] = null;
                        delete collection[img];
                    }
                }
                instance = null;
                collection = null;
                loaded = null;
                toLoad = null;
                errors = null;
                loading = null;
                //instanceID = null;
                //onProgress = null;
                //onComplete = null;
            };
            
            /**
             * Load an image or a set(Array) of images
             * @priviledged
             * @function
             * @param
             * @return ImageManager
             */
            this.load = function (images, fnComplete, fnProgress) {
                var i;
                if (!loading) {
                    loaded = 0;
                    loading = true;
                    debug.log('Load process', instanceID, 'started.');
                    try {
                        onProgress = fnProgress || EMPTY_FN;
                        onComplete = fnComplete || EMPTY_FN;
                        if (images instanceof Array) {
                            toLoad = images.length;
                            totalToLoad += toLoad;
                            for (i = 0; i < toLoad; i += 1) {
                                loadImage(images[i]);
                            }
                        } else { // assumes a single Image Object
                            toLoad += 1;
                            totalToLoad += 1;
                            loadImage(images);
                        }
                    } catch (e) {
                        debug.warn(e.message);
                    } finally {
                        return this;
                    }
                }

                // return the reference for this thread to allow chaining
                return this;
            };

        }

        /**
         * Get an image loaded from the shared image pool
         * @public
         * @static
         * @function
         * @param name {String} The name of the image.
         * @return Image
         */
        function getImage(name) {
            if (cache.hasOwnProperty(name)) {
                return cache[name];
            }
        }
        
        /**
         * Creates a new Image tag as a copy of an image in cache
         */
        function cloneImage(name) { // TODO: allow an Image as parameter 
            var img = new Image();
            if (cache.hasOwnProperty(name)) {
                img.name = cache[name].name;
                img.src = cache[name].src;
                return img;
            }
        }

        /**
         * Get the overall global progress, in percentage
         * @public
         * @static
         * @return Number
         */
        function getProgress() {
            return (cacheSize / totalToLoad) * 100;
        }

        /**
         * Test if there is any LoadProcess instances running
         * @public
         * @static
         * @return Boolean false if all load instances has finished its tasks
         */
        function hasNoProcess() {
            return loadStackSize === 0;
        }

        /**
         * Clear cache and the process stack
         * Not works if there is any load process running
         * @public
         * @static
         * @return {Boolean} will return true if clear was successful, and
         *     false otherwise (if there are loading tasks still performing)
         */
        function clear() {
            var image,
                process;
            if (hasNoProcess()) {
                for (image in cache) {
                    if (cache.hasOwnProperty(image)) {
                        cache[image] = null; // release memory
                        delete cache[image]; // remove property
                    }
                }
                for (process in loadStack) {
                    if (loadStack.hasOwnProperty(process)) {
                        loadStack[process].clear();
                        loadStack[process] = null; // release memory
                        delete loadStack[process]; // remove property
                    }
                }
                cacheSize = 0;
                loadStackSize = 0;
                totalToLoad = 0;
                return true; // clear success
            }
            return false; // clear fail
        }
        
        /**
         * Load an image or a set of images and call the callbacks
         * @public
         * @static
         * @param {Object or Array} img an object or an array of objects with image properties
         * @param {function} fnC onComplete callback
         * @param {function} fnP onProgress callback
         */
        function newProcess(img, fnC, fnP) {
            var process = new LoadProcess();
            loadStack[process.getId()] = process.load(img, fnC, fnP);
            loadStackSize += 1;
        }
        
        /**
         * Remove the given image from cache
         * @public
         * @static
         * @param {String} name the name of the image to be removed from cache
         */
        function removeFromCache(name) {
            /*var domImgs,
                i;*/
            if (cache.hasOwnProperty(name)) {
                /*domImgs = document.getElementsByName(name);
                for (i = 0; i < domImgs.length; i += 1) {
                    domImgs[i].remove();
                }*/
                cache[name] = null;
                delete cache[name];
            }
            cacheSize -= 1;
            totalToLoad -= 1;
        }
        
        /**
         * debug purposes only
         */
        function debugMode(mode) {
            debug = null;
            debug = new JSDebugger('[ImageManager]', mode);
        }

        // public API
        return {
            load : newProcess,
            getProgress : getProgress,
            hasFinished : hasNoProcess,
            getImage : getImage,
            cloneImage : cloneImage,
            clear : clear,
            cache : cache,
            remove : removeFromCache
            //debugMode : debugMode
        };

    }());

    // AMD, CommonJS and Window support
    if (typeof define === 'function') {
        define([], function () {
            return ImageManager;
        });
    } else if (typeof module !== 'undefined' && module.exports) {
        module.exports = ImageManager;
    } else if (typeof global.ImageManager === 'undefined') {
        global.ImageManager = ImageManager;
    }

// get at whatever the global object is, like window in browsers
}((function () { return this; }())));
