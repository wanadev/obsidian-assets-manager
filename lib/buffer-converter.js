"use strict";

var Class = require("abitbol");
var httpRequest = require("obsidian-http-request");
var Q = require("q");

/**
 * Converter tool between buffer and blob/image/url/data64Url
 *
 * @class obsidian-assets-manager.lib.buffer-converter
 */
var BufferConverter = Class.$extend({

    __classvars__: {

        // ==== From Buffer

        /**
         * [PROMISE] Buffer => Blob.
         *
         * @method toBlob
         * @param {Buffer} buffer
         * @param {String} mime
         * @return {Function} `function(blob)`
         * @static
         */
        toBlob: function(buffer, mime) {
            mime = mime || "application/octet-stream";
            var properties = { mime: mime };
            var blob;

            try {
                blob = new Blob(buffer, properties);
            } catch (e) {
                if (e.name !== "TypeError") {
                    throw e;
                }

                var BlobBuilder = window.BlobBuilder ||
                    window.MSBlobBuilder ||
                    window.MozBlobBuilder ||
                    window.WebKitBlobBuilder;

                var builder = new BlobBuilder();
                for (var i = 0; i < buffer.length; i += 1) {
                    builder.append(buffer[i]);
                }
                blob = builder.getBlob(mime);
            }

            return Q(blob);
        },

        // ==== To Buffer

        /**
         * [PROMISE] Blob => Buffer.
         *
         * @method fromBlob
         * @param {Blob} blob
         * @return {Function} `function(buffer)` `buffer.data` `buffer.mime`
         * @static
         */
        fromBlob: function(blob) {
            return Q.Promise(function(resolve, reject) {
                var reader = new FileReader();
                reader.onerror = reject;
                reader.onload = function(event) {
                    try {
                        var buffer = new Buffer(event.target.result);
                        var mime = blob.type;
                        resolve({ data: buffer, mime: mime });
                    } catch (error) {
                        reject(error);
                    }
                };
                reader.readAsArrayBuffer(blob);
            });
        },

        /**
         * [PROMISE] Image => Buffer.
         *
         * @method fromImage
         * @param {Image} image
         * @param {String} mime
         * @return {Function} `function(buffer)` `buffer.data` `buffer.mime`
         * @static
         */
        fromImage: function(image, mime) {
            return BufferConverter._imageToData64Url(image, mime)
                .then(BufferConverter.fromData64Url);
        },

        /**
         * [PROMISE] URL => Buffer.
         *
         * @method fromUrl
         * @param {String} url
         * @return {Function} `function(buffer)` `buffer.data` `buffer.mime`
         * @static
         */
        fromUrl: function(url) {
            var _this = this;

            return httpRequest._operations._getProxy(url)
                .then(httpRequest._operations._checkHeaders)
                .then(httpRequest._operations._readBody)
                .then(function(response) {
                    var buffer = response.body;
                    var mime = response.headers["content-type"].split(";")[0].toLowerCase();
                    return Q({ data: buffer, mime: mime });
                });
        },

        /**
         * [PROMISE] Data64Url => Buffer.
         *
         * @method fromData64Url
         * @param {String} data64Url
         * @return {Function} `function(buffer)` `buffer.data` `buffer.mime`
         * @static
         */
        fromData64Url: function(data64Url) {
            var buffer = new Buffer(data64Url.split(",")[1], "base64");
            var mime = data64Url.split(";")[0].split(":")[1];
            return Q({ data: buffer, mime: mime });
        },

        // ==== Extra

        /**
         * [PROMISE] Image => Data64Url.
         *
         * @method _imageToData64Url
         * @private
         * @param {Image} image
         * @param {String} mime
         * @return {Function} `function(data64Url)`
         * @static
         */
        _imageToData64Url: function(image, mime) {
            mime = mime || "application/octet-stream";

            var canvas = document.createElement("canvas");
            canvas.width = image.width;
            canvas.height = image.height;
            canvas.getContext("2d").drawImage(image, 0, 0);

            var data64Url = canvas.toDataURL(mime);
            return Q(data64Url);
        },

    }

});

module.exports = BufferConverter;
