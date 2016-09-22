"use strict";

var uuid = require("uuid");
var Class = require("abitbol");
var Q = require("q");

var AssetsConverter = require("./assets-converter");

/**
 * Assets manager.
 *
 * Holds the database to all assets, and reference them by a unique id.
 *
 * @class obsidian-assets-manager.lib.assets-manager
 * @constructor
 */
var AssetsManager = Class.$extend({

    __init__: function() {
        this.$data.assetsList = {};
    },

    /**
     * Get the list of assets.
     * In an asset, `as.XXX` will be non-null
     * if required at least once through `getAssetAsXXX`.
     *
     *     {
     *         mime,            // {String}
     *         metadata,        // {Object}
     *         as: {
     *             buffer,      // {Buffer|null}
     *             image,       // {Image|null}
     *             urm,         // {String|null}
     *             blobUrl,     // {String|null}
     *             data64Url    // {String|null}
     *             blob         // {Blob|null}
     *         }
     *     }
     *
     * @property assetsList
     * @type {Object[]}
     * @readOnly
     */
    getAssetsList: function() {
        return this.$data.assetsList;
    },

    // ===== Add

    /**
     * Create a new asset.
     *
     * @method addAsset
     * @param {Object} [options]
     *        @param {String} [options.id]
     *        @param {String} [options.mime]
     *        @param {Object} [options.metadata]
     * @return {String} `id`
     */
    addAsset: function(options) {
        options = options || {};
        options.id = options.id || uuid.v4();

        if (this.assetExists(options.id)) {
            this.removeAsset(options.id);
        }

        this.$data.assetsList[options.id] = {
            mime: options.mime,
            metadata: options.metadata,
            as: {
                buffer: null,
                image: null,
                blobUrl: null,
                data64Url: null,
                blob: null
            }
        };

        return options.id;
    },

    /**
     * [PROMISE] Add an asset from a buffer.
     *
     * @method addAssetFromBuffer
     * @param {Buffer} buffer
     * @param {Object} [options]
     *        @param {String} [options.id]
     *        @param {String} [options.mime]
     *        @param {Object} [options.metadata]
     * @return {Function} `function(id)`
     */
    addAssetFromBuffer: function(buffer, options) {
        options = options || {};
        options.mime = options.mime || "application/octet-stream";

        var id = this.addAsset(options);
        this.$data.assetsList[id].as.buffer = buffer;
        return Q(id);
    },

    /**
     * [PROMISE] Add an asset from an image.
     *
     * @method addAssetFromImage
     * @param {Image} image
     * @param {Object} [options]
     *        @param {String} [options.id]
     *        @param {String} [options.mime]
     *        @param {Object} [options.metadata]
     * @return {Function} `function(id)`
     */
    addAssetFromImage: function(image, options) {
        options = options || {};
        options.mime = options.mime || "image/png";

        var id = this.addAsset(options);
        this.$data.assetsList[id].as.image = image;
        return Q(id);
    },

    /**
     * [PROMISE] Add an asset from an URL.
     *
     * @method addAssetFromUrl
     * @param {String} url
     * @param {Object} [options]
     *        @param {String} [options.id]
     *        @param {String} [options.mime]
     *        @param {Object} [options.metadata]
     * @return {Function} `function(id)`
     */
    addAssetFromUrl: function(url, options) {
        var id = this.addAsset(options);
        this.$data.assetsList[id].as.blobUrl = url;
        return AssetsConverter._blobUrlToBuffer(this.$data.assetsList[id])
            .then(function(asset) {
                asset.mime = asset.mime || "application/octet-stream";
                asset.as.blobUrl = null;
                return Q(id);
            });
    },

    /**
     * [PROMISE] Add an asset from a data-64 URL.
     *
     * @method addAssetFromData64Url
     * @param {String} data64Url
     * @param {Object} [options]
     *        @param {String} [options.id]
     *        @param {String} [options.mime]
     *        @param {Object} [options.metadata]
     * @return {Function} `function(id)`
     */
    addAssetFromData64Url: function(data64Url, options) {
        options = options || {};
        options.mime = options.mime || data64Url.split(";")[0].split(":")[1] || "application/octet-stream";

        var id = this.addAsset(options);
        this.$data.assetsList[id].as.data64Url = data64Url;
        return Q(id);
    },

    /**
     * [PROMISE] Add an asset from a blob.
     *
     * @method addAssetFromBlob
     * @param {Blob} blob
     * @param {Object} [options]
     *        @param {String} [options.id]
     *        @param {String} [options.mime]
     *        @param {Object} [options.metadata]
     * @return {Function} `function(id)`
     */
    addAssetFromBlob: function(blob, options) {
        options = options || {};
        options.mime = options.mime || blob.type || "application/octet-stream";

        var id = this.addAsset(options);
        this.$data.assetsList[id].as.blob = blob;
        return Q(id);
    },

    // ===== Import

    /**
     * [PROMISE] Add a package from a buffer.
     *
     * @method importAssetPackageFromBuffer
     * @param {String} buffer
     * @return {Function} `function(index)`
     */
    importAssetPackageFromBuffer: function(buffer) {
        throw Error("Not implemented yet");
    },

    /**
     * [PROMISE] Add a package from an URL.
     *
     * @method importAssetPackageFromUrl
     * @param {String} url
     * @return {Function} `function(index)`
     */
    importAssetPackageFromUrl: function(url) {
        throw Error("Not implemented yet");
    },

    /**
     * [PROMISE] Add a package from a data-64 URL.
     *
     * @method importAssetPackageFromData64Url
     * @param {String} data64Url
     * @return {Function} `function(index)`
     */
    importAssetPackageFromData64Url: function(data64Url) {
        throw Error("Not implemented yet");
    },

    /**
     * [PROMISE] Add a package from a blob.
     *
     * @method importAssetPackageFromBlob
     * @param {String} blob
     * @return {Function} `function(index)`
     */
    importAssetPackageFromBlob: function(blob) {
        throw Error("Not implemented yet");
    },

    // ===== Get

    /**
     * [PROMISE] Get an asset as a buffer.
     *
     * @method getAssetAsBuffer
     * @param {String} id
     * @return {Function} `function(buffer)`
     */
    getAssetAsBuffer: function(id) {
        var asset = this.$data.assetsList[id];
        if (!asset) {
            throw Error("Asset '" + id + "' does not exist");
        }

        return AssetsConverter.toBuffer(asset)
            .then(function(asset) {
                return Q(asset.as.buffer);
            });
    },

    /**
     * [PROMISE] Get an asset as an image.
     *
     * @method getAssetAsImage
     * @param {String} id
     * @return {Function} `function(image)`
     */
    getAssetAsImage: function(id) {
        var asset = this.$data.assetsList[id];
        if (!asset) {
            throw Error("Asset '" + id + "' does not exist");
        }

        return AssetsConverter.toImage(asset)
            .then(function(asset) {
                return Q(asset.as.image);
            });
    },

    /**
     * [PROMISE] Get an asset as a blob URL.
     *
     * @method getAssetAsBlobUrl
     * @param {String} id
     * @return {Function} `function(url)`
     */
    getAssetAsBlobUrl: function(id) {
        var asset = this.$data.assetsList[id];
        if (!asset) {
            throw Error("Asset '" + id + "' does not exist");
        }

        return AssetsConverter.toBlobUrl(asset)
            .then(function(asset) {
                return Q(asset.as.blobUrl);
            });
    },

    /**
     * [PROMISE] Get an asset as a data-64 URL.
     *
     * @method getAssetAsData64Url
     * @param {String} id
     * @return {Function} `function(data64Url)`
     */
    getAssetAsData64Url: function(id) {
        var asset = this.$data.assetsList[id];
        if (!asset) {
            throw Error("Asset '" + id + "' does not exist");
        }

        return AssetsConverter.toData64Url(asset)
            .then(function(asset) {
                return Q(asset.as.data64Url);
            });
    },

    /**
     * [PROMISE] Get an asset as a blob.
     *
     * @method getAssetAsBlob
     * @param {String} id
     * @return {Function} `function(blob)`
     */
    getAssetAsBlob: function(id) {
        var asset = this.$data.assetsList[id];
        if (!asset) {
            throw Error("Asset '" + id + "' does not exist");
        }

        return AssetsConverter.toBlob(asset)
            .then(function(asset) {
                return Q(asset.as.blob);
            });
    },

    // ===== Project

    /**
     * [PROMISE] Store the specified asset directly within the project.
     * Use this to store dynamic content from the user.
     *
     * @method embedAssetToProject
     * @param {String} id
     * @return {Function} `function(newId)`
     */
    embedAssetToProject: function(id) {
        throw Error("Not implemented yet");
    },

    /**
     * Remove the specified asset from the Project.
     *
     * @method removeAssetFromProject
     * @param {String} id
     */
    removeAssetFromProject: function(id) {
        throw Error("Not implemented yet");
    },

    // ===== Utilities

    /**
     * Check whether the specified asset exists or not.
     *
     * @method assetExists
     * @param {String} id
     * @return {Boolean}
     */
    assetExists: function(id) {
        var asset = this.$data.assetsList[id];
        return asset !== undefined;
    },

    /**
     * Check whether the specified asset package has been loaded or not.
     *
     * @method assetPackageLoaded
     * @param {String} packname
     * @return {Boolean}
     */
    assetPackageLoaded: function(packname) {
        throw Error("Not implemented yet");
    },

    /**
     * Remove the specified asset from the assetsList.
     * Please note that this won't delete the data itself,
     * and won't remove the asset from the Project if it is stored inside.
     *
     * @method removeAsset
     * @param {String} id
     */
    removeAsset: function(id) {
        delete this.$data.assetsList[id];
    },

    /**
     * Remove all the assets from the specified package.
     * Please note that this won't delete the data itself.
     *
     * @method removeAssetPackage
     * @param {String} packname
     */
    removeAssetPackage: function(packname) {
        throw Error("Not implemented yet");
    }

});

module.exports = AssetsManager;
