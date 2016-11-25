"use strict";

var ObsidianPackFile = require("obsidian-pack");
var httpRequest = require("obsidian-http-request");
var Class = require("abitbol");
var sha256 = require("sha.js")("sha256");
var uuid = require("uuid");
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
var ObsidianAssetsManager = Class.$extend({

    __init__: function() {
        this.$data.assetList = {};
        this.$data.packList = {};
    },

    /**
     * Get the list of assets.
     * In an asset, `as.XXX` will be non-null
     * if required at least once through `getAssetAsXXX`.
     *
     *     {
     *         mime,            // {String}
     *         source,          // {String}
     *         metadata,        // {Object}
     *         as: {
     *             buffer,      // {Buffer|null}
     *             image,       // {Image|null}
     *             blobUrl,     // {String|null}
     *             data64Url    // {String|null}
     *             blob         // {Blob|null}
     *         }
     *     }
     *
     * @property assetList
     * @type {Object}
     * @readOnly
     */
    getAssetList: function() {
        return this.$data.assetList;
    },

    /**
     * Get the list of packs.
     *
     * @property packList
     * @type {Object}
     * @readOnly
     */
    getPackList: function() {
        return this.$data.packList;
    },

    /**
     * Get the id corresponding to blob
     *
     * @method getAssetIdFromBlob
     * @param {Blob} blob
     * @return {String | null}
     */
    getAssetIdFromBlob: function(blob) {
        for (var id in this.$data.assetList) {
            if (this.$data.assetList[id].as.blob === blob) {
                return id;
            }
        }

        return null;
    },

    /**
     * Get the id corresponding to blob url
     *
     * @method getAssetIdFromBlobUrl
     * @param {String} blobUrl
     * @return {String | null}
     */
    getAssetIdFromBlobUrl: function(blobUrl) {
        for (var id in this.$data.assetList) {
            if (this.$data.assetList[id].as.blobUrl === blobUrl) {
                return id;
            }
        }

        return null;
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

        this.$data.assetList[options.id] = {
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
        this.$data.assetList[id].as.buffer = buffer;
        this.$data.assetList[id].source = "buffer:-";
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
        this.$data.assetList[id].as.image = image;
        this.$data.assetList[id].source = "image:-";
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
        var _this = this;
        options = options || {};
        options.id = "url:" + sha256.update(url, "utf8").digest("hex");

        var id = this.addAsset(options);
        return AssetsConverter.urlToBuffer(url)
            .then(function(object) {
                _this.$data.assetList[id].mime = object.mime || "application/octet-stream";
                _this.$data.assetList[id].as.buffer = object.buffer;
                _this.$data.assetList[id].source = "url:" + url;
                return id;
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
        this.$data.assetList[id].as.data64Url = data64Url;
        this.$data.assetList[id].source = "data64Url:-";
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
        this.$data.assetList[id].as.blob = blob;
        this.$data.assetList[id].source = (blob instanceof File) ? "file:" + blob.name : "blob:-";
        return Q(id);
    },

    /**
     * [PROMISE] Add an asset from a package.
     *
     * @method addAssetFromAssetPackage
     * @param {obsidian-pack.lib.obsidian-pack-file} pack
     * @param {String} packAssetId
     * @return {Function} `function(id)`
     */
    addAssetFromAssetPackage: function(pack, packAssetId) {
        var assetRecord = pack.getAssetRecord(packAssetId);
        var options = {
            id: "pack:" + pack.packName + "/" + packAssetId,
            mime: assetRecord.mime,
            metadata: assetRecord.metadata,
        };

        var id = this.addAsset(options);
        this.$data.assetList[id].as.buffer = pack.getAssetAsBuffer(packAssetId);
        this.$data.assetList[id].source = "pack:" + pack.packName;
        return Q(id);
    },

    // ===== Import

    /**
     * [PROMISE] Add a package.
     *
     * @method importAssetPackage
     * @param {obsidian-pack.lib.obsidian-pack-file} pack
     * @return {Function} `function(pack)`
     */
    importAssetPackage: function(pack) {
        this.$data.packList[pack.packName] = pack;
        return Q(pack);
    },


    /**
     * [PROMISE] Add a package from a buffer.
     *
     * @method importAssetPackageFromBuffer
     * @param {Buffer} buffer
     * @return {Function} `function(pack)`
     */
    importAssetPackageFromBuffer: function(buffer) {
        var pack = new ObsidianPackFile(buffer);
        return this.importAssetPackage(pack);
    },

    /**
     * [PROMISE] Add a package from an URL.
     *
     * @method importAssetPackageFromUrl
     * @param {String} url
     * @return {Function} `function(pack)`
     */
    importAssetPackageFromUrl: function(url) {
        var _this = this;
        return httpRequest.getRaw(url)
            .then(this.importAssetPackageFromBuffer);
    },

    /**
     * [PROMISE] Add a package from a data-64 URL.
     *
     * @method importAssetPackageFromData64Url
     * @param {String} data64Url
     * @return {Function} `function(pack)`
     */
    importAssetPackageFromData64Url: function(data64Url) {
        var pack = new ObsidianPackFile(data64Url);
        return this.importAssetPackage(pack);
    },

    /**
     * [PROMISE] Add a package from a blob.
     *
     * @method importAssetPackageFromBlob
     * @param {Blob} blob
     * @return {Function} `function(pack)`
     */
    importAssetPackageFromBlob: function(blob) {
        var _this = this;
        var packAsset = { as: { blob: blob } };
        return AssetsConverter._blobToBuffer(packAsset)
            .then(function(packAsset) {
                return _this.importAssetPackageFromBuffer(packAsset.as.buffer);
            });
    },

    // ===== Get

    /**
     * [PROMISE] Get an asset, ensuring it exists.
     *
     * @method getAsset
     * @param {String} id
     * @return {Function} `function(asset)`
     */
    getAsset: function(id) {
        var asset = this.$data.assetList[id];

        if (!asset) {
            var source = id.split(":")[0];
            if (!source) {
                throw Error("Asset '" + id + "' is missing the source");
            }

            if (source === "pack") {
                var packName = id.split(":")[1].split("/")[0];
                var pack = this.$data.packList[packName];
                if (!pack) {
                    throw Error("Asset package '" + packName + "' does not exist");
                }

                var packAssetId = id.split("/").slice(1).join("/");
                return this.addAssetFromAssetPackage(pack, packAssetId)
                    .then(this.getAsset);
            }

            throw Error("Asset '" + id + "' does not exist");
        }

        return Q(asset);
    },

    /**
     * [PROMISE] Get an asset as a buffer.
     *
     * @method getAssetAsBuffer
     * @param {String} id
     * @return {Function} `function(buffer)`
     */
    getAssetAsBuffer: function(id) {
        return this.getAsset(id)
            .then(AssetsConverter.toBuffer)
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
        return this.getAsset(id)
            .then(AssetsConverter.toImage)
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
        return this.getAsset(id)
            .then(AssetsConverter.toBlobUrl)
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
        return this.getAsset(id)
            .then(AssetsConverter.toData64Url)
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
        return this.getAsset(id)
            .then(AssetsConverter.toBlob)
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
        var asset = this.$data.assetList[id];

        if (!asset) {
            var source = id.split(":")[0];
            if (!source) {
                return false;
            }

            if (source === "pack") {
                var packName = id.split(":")[1].split("/")[0];
                var pack = this.$data.packList[packName];
                if (!pack) {
                    return false;
                }

                var packAssetId = id.split("/").slice(1).join("/");
                return pack.assetExists(packAssetId);
            }

            return false;
        }

        return true;
    },

    /**
     * Check whether the specified asset package has been loaded or not.
     *
     * @method assetPackageExists
     * @param {String} packName
     * @return {Boolean}
     */
    assetPackageExists: function(packName) {
        var pack = this.$data.packList[packName];
        return pack !== undefined;
    },

    /**
     * Remove the specified asset from the assetList.
     * Please note that this won't delete the data itself,
     * and won't remove the asset from the Project if it is stored inside.
     *
     * @method removeAsset
     * @param {String} id
     */
    removeAsset: function(id) {
        delete this.$data.assetList[id];
    },

    /**
     * Remove all the assets from the specified package.
     * Please note that this won't delete the data itself.
     *
     * @method removeAssetPackage
     * @param {String} packName
     */
    removeAssetPackage: function(packName) {
        var pack = this.$data.packList[packName];
        if (!pack) { return; }

        for (var i = 0; i < pack.assetList.length; ++i) {
            delete this.$data.assetList["pack:" + packName + "/" + pack.assetList[i]];
        }

        delete this.$data.packList[packName];
    }

});

module.exports = ObsidianAssetsManager;
