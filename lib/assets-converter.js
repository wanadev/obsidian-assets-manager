"use strict";

var Class = require("abitbol");
var httpRequest = require("obsidian-http-request");
var Q = require("q");

/**
 * Converter tool for assets.
 *
 * asset:
 *
 *     {
 *         mime,            // {String}
 *         as: {
 *             buffer,      // {Buffer|null}
 *             image,       // {Image|null}
 *             blobUrl,     // {String|null}
 *             data64Url,   // {String|null}
 *             blob         // {Blob|null}
 *         }
 *     }
 *
 * @class obsidian-assets-manager.lib.assets-converter
 */
var AssetsConverter = Class.$extend({

    __classvars__: {

        // ==== To anything

        /**
         * [PROMISE] Ensure the asset is readable as a Buffer.
         *
         * @method toBuffer
         * @param {Object} asset
         * @return {Function} `function(asset)`
         * @static
         */
        toBuffer: function(asset) {
            if (asset.as.buffer) {
                return Q(asset);
            }

            // Conversion: from fastest to slowest
            if (asset.as.data64Url) {
                return AssetsConverter._data64UrlToBuffer(asset);
            } else if (asset.as.blob) {
                return AssetsConverter._blobToBuffer(asset);
            } else if (asset.as.image) {
                return AssetsConverter._imageToBuffer(asset);
            } else if (asset.as.blobUrl) {
                return AssetsConverter._blobUrlToBuffer(asset);
            }

            throw Error("EmptyAsset");
        },

        /**
         * [PROMISE] Ensure the asset is readable as a Blob.
         *
         * @method toBlob
         * @param {Object} asset
         * @return {Function} `function(asset)`
         * @static
         */
        toBlob: function(asset) {
            if (asset.as.blob) {
                return Q(asset);
            }

            return AssetsConverter.toBuffer(asset)
                .then(AssetsConverter._bufferToBlob);
        },

        /**
         * [PROMISE] Ensure the asset is readable as a BlobUrl.
         *
         * @method toBlobUrl
         * @param {Object} asset
         * @return {Function} `function(asset)`
         * @static
         */
        toBlobUrl: function(asset) {
            if (asset.as.blobUrl) {
                return Q(asset);
            }

            return AssetsConverter.toBlob(asset)
                .then(AssetsConverter._blobToBlobUrl);
        },

        /**
         * [PROMISE] Ensure the asset is readable as a Image.
         *
         * @method toImage
         * @param {Object} asset
         * @return {Function} `function(asset)`
         * @static
         */
        toImage: function(asset) {
            if (asset.as.image) {
                return Q(asset);
            }

            if (!asset.mime || asset.mime.indexOf("image/") !== 0) {
                throw new Error("AssetNotAImage");
            }

            if (asset.as.data64Url) {
                return AssetsConverter._data64UrlToImage(asset);
            }

            return AssetsConverter.toBlobUrl(asset)
                .then(AssetsConverter._blobUrlToImage);
        },

        /**
         * [PROMISE] Ensure the asset is readable as a Data64Url.
         *
         * @method toData64Url
         * @param {Object} asset
         * @return {Function} `function(asset)`
         * @static
         */
        toData64Url: function(asset) {
            if (asset.as.data64Url) {
                return Q(asset);
            }

            return AssetsConverter.toBuffer(asset)
                .then(AssetsConverter._bufferToData64Url);
        },

        /**
         * [PROMISE] Url => Buffer.
         *
         * @method urlToBuffer
         * @param {String} url
         * @return {Function} `function(object)` object.buffer, object.mime
         * @static
         */
        urlToBuffer: function(url) {
            return httpRequest._operations._getProxy(url)
                .then(httpRequest._operations._checkHeaders)
                .then(httpRequest._operations._readBody)
                .then(function(response) {
                    return {
                        mime: response.headers["content-type"].split(";")[0].toLowerCase(),
                        buffer: response.body
                    };
                })
                .catch(function(e) {
                    throw Error("Wrong URL: " + url + " " + e);
                });
        },

        // ==== From Buffer

        /**
         * [PROMISE] Buffer => Blob.
         *
         * @method _bufferToBlob
         * @param {Object} asset
         * @return {Function} `function(asset)`
         * @static
         * @private
         */
        _bufferToBlob: function(asset) {
            asset.mime = asset.mime || "application/octet-stream";

            try {
                asset.as.blob = new Blob([asset.as.buffer], { type: asset.mime });
            } catch (e) {
                if (e.name !== "TypeError") {
                    throw e;
                }

                var BlobBuilder = window.BlobBuilder ||
                    window.MSBlobBuilder ||
                    window.MozBlobBuilder ||
                    window.WebKitBlobBuilder;

                var builder = new BlobBuilder();
                builder.append(asset.as.buffer);
                asset.as.blob = builder.getBlob(asset.mime);
            }

            return Q(asset);
        },

        /**
         * [PROMISE] Buffer => Data64Url.
         *
         * @method _bufferToData64Url
         * @param {Object} asset
         * @return {Function} `function(asset)`
         * @static
         * @private
         */
        _bufferToData64Url: function(asset) {
            asset.mime = asset.mime || "application/octet-stream";
            asset.as.data64Url = "data:" + asset.mime + ";base64," + asset.as.buffer.toString("base64");
            return Q(asset);
        },

        // ==== To Buffer

        /**
         * [PROMISE] Blob => Buffer.
         *
         * @method _blobToBuffer
         * @param {Object} asset
         * @return {Function} `function(asset)`
         * @private
         * @static
         */
        _blobToBuffer: function(asset) {
            return Q.Promise(function(resolve, reject) {
                var reader = new FileReader();
                reader.onerror = reject;
                reader.onload = function(event) {
                    try {
                        asset.as.buffer = new Buffer(event.target.result);
                        asset.mime = asset.mime || asset.as.blob.type;
                        resolve(asset);
                    } catch (error) {
                        reject(error);
                    }
                };
                reader.readAsArrayBuffer(asset.as.blob);
            });
        },

        /**
         * [PROMISE] Image => Buffer.
         *
         * @method _imageToBuffer
         * @param {Object} asset
         * @return {Function} `function(asset)`
         * @private
         * @static
         */
        _imageToBuffer: function(asset) {
            asset.mime = asset.mime || "image/png";
            return AssetsConverter._imageToData64Url(asset)
                .then(AssetsConverter._data64UrlToBuffer);
        },

        /**
         * [PROMISE] BlobUrl => Buffer.
         *
         * @method _blobUrlToBuffer
         * @param {Object} asset
         * @return {Function} `function(asset)`
         * @private
         * @static
         */
        _blobUrlToBuffer: function(asset) {
            return this.urlToBuffer(asset.as.blobUrl)
                .then(function(object) {
                    asset.as.buffer = object.buffer;
                    asset.mime = asset.mime || object.mime;
                    return asset;
                })
                .catch(function(e) {
                    throw Error("Wrong URL: " + asset.as.blobUrl + " " + e);
                });
        },

        /**
         * [PROMISE] Data64Url => Buffer.
         *
         * @method _data64UrlToBuffer
         * @param {Object} asset
         * @return {Function} `function(asset)`
         * @private
         * @static
         */
        _data64UrlToBuffer: function(asset) {
            asset.as.buffer = new Buffer(asset.as.data64Url.split(",")[1], "base64");
            asset.mime = asset.mime || asset.as.data64Url.split(";")[0].split(":")[1];
            return Q(asset);
        },

        // ==== Extra

        /**
         * [PROMISE] Image => Data64Url.
         *
         * @method _imageToData64Url
         * @param {Object} asset
         * @return {Function} `function(asset)`
         * @static
         * @private
         */
        _imageToData64Url: function(asset) {
            asset.mime = asset.mime || "application/octet-stream";

            var canvas = document.createElement("canvas");
            canvas.width = asset.as.image.width;
            canvas.height = asset.as.image.height;
            canvas.getContext("2d").drawImage(asset.as.image, 0, 0);

            asset.as.data64Url = canvas.toDataURL(asset.mime);
            return Q(asset);
        },

        /**
         * [PROMISE] Blob => BlobUrl.
         *
         * @method _blobToBlobUrl
         * @param {Object} asset
         * @return {Function} `function(asset)`
         * @static
         * @private
         */
        _blobToBlobUrl: function(asset) {
            asset.as.blobUrl = (global.URL || global.webkitURL).createObjectURL(asset.as.blob);
            return Q(asset);
        },

        /**
         * [PROMISE] BlobUrl => Image.
         *
         * @method _blobUrlToImage
         * @param {Object} asset
         * @return {Function} `function(asset)`
         * @static
         * @private
         */
        _blobUrlToImage: function(asset) {
            return Q.Promise(function(resolve, reject) {
                var image = new Image();
                image.onerror = reject;
                image.onload = function() {
                    asset.as.image = image;
                    resolve(asset);
                };
                image.src = asset.as.blobUrl;
            });
        },

        /**
         * [PROMISE] Data64Url => Image.
         *
         * @method _data64UrlToImage
         * @param {Object} asset
         * @return {Function} `function(asset)`
         * @private
         * @static
         */
        _data64UrlToImage: function(asset) {
            return Q.Promise(function(resolve, reject) {
                var image = new Image();
                image.onerror = reject;
                image.onload = function() {
                    asset.as.image = image;
                    resolve(asset);
                };
                image.src = asset.as.data64Url;
            });
        }

    }

});

module.exports = AssetsConverter;
