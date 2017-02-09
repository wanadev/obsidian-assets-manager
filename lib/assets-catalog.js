"use strict";

var httpRequest = require("obsidian-http-request");
var Class = require("abitbol");
var url = require("url");
var Q = require("q");

var AssetsConverter= require("./assets-converter");
var ObsidianAssetsManager = require("./assets-manager");

/**
 * Assets catalog.
 *
 * @class obsidian-assets-manager.lib.assets-catalog
 * @constructor
 * @param {obsidian-assets-manager.lib.assets-manager} [manager]
 */
var ObsidianAssetsCatalog = Class.$extend({

    __init__: function(manager) {
        if (manager && !(manager instanceof ObsidianAssetsManager)) {
            throw Error("NotAnObsidianAssetsManager");
        }

        this.$data.manager = manager || new ObsidianAssetsManager();
        this.$data.packList = {};
        this.$data.assetList = {};
        this.$data.rootUrl = location.protocol + "//" + location.host + "/";
    },

    /**
     * The root url to resolve relative paths.
     *
     * @property rootUrl
     * @type {String}
     * @readOnly
     */
    getRootUrl: function() {
        return this.$data._rootUrl;
    },

    setRootUrl: function(rootUrl) {
        this.$data.rootUrl = url.resolve(this.$data.rootUrl, rootUrl);
    },

    /**
     * The assets manager.
     *
     * @property manager
     * @type {obsidian-assets-manager.lib.assets-manager}
     * @readOnly
     */
    getManager: function() {
        return this.$data.manager;
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
     * Get the list of assets.
     *
     * @property assetList
     * @type {Object}
     * @readOnly
     */
    getAssetList: function() {
        return this.$data.assetList;
    },

    // ===== Import

    /**
     * [PROMISE] Import a catalog to the catalogs list.
     *
     * @method importAssetCatalog
     * @param {Object} catalog
     * @return {Function} `function(catalogName)` if name is defined in the info section
     */
    importAssetCatalog: function(catalog) {
        for (var packName in catalog.packages) {
            var pack = catalog.packages[packName];
            this.$data.packList[packName] = {
                url: pack.url,
                assets: []
            };

            for (var assetId in pack.assets) {
                var asset = pack.assets[assetId];
                assetId = "pack:" + packName + "/" + assetId;
                this.$data.packList[packName].assets.push(assetId);
                this.$data.assetList[assetId] = asset;
            }
        }

        // Stand-alone assets
        for (var standaloneAssetId in catalog.assets) {
            var standaloneAsset = catalog.assets[standaloneAssetId];
            this.$data.assetList[standaloneAssetId] = standaloneAsset;
        }
        
        return catalog.info ? Q(catalog.info.name) : Q();
    },

    /**
     * [PROMISE] Import a catalog from a Url to the catalogs list.
     *
     * @method importAssetCatalogFromUrl
     * @param {String} catalogUrl
     * @return {Function} `function(catalogName)`
     */
    importAssetCatalogFromUrl: function(catalogUrl) {
        var _this = this;
        return httpRequest.getJson(url.resolve(this.$data.rootUrl, catalogUrl))
            .then(this.importAssetCatalog);
    },

    // ===== Getters

    /**
     * [PROMISE] Ensure the asset is loaded in the asset manager.
     *
     * @method loadAsset
     * @param {String} id
     * @return {String}
     */
    loadAsset: function(id) {
        if (this.assetLoaded(id)) {
            return Q(id);
        }

        var asset = this.$data.assetList[id];
        if (!asset) {
            throw Error("Asset '" + id + "' does not exist");
        }

        var source = id.split(":")[0];

        // No source, it's a standalone asset
        if (source === id) {
            var assetUrl = url.resolve(this.$data.rootUrl, asset.url);
            return this.$data.manager.addAssetFromUrl(assetUrl, {
                id: id,
                mime: asset.mime,
                metadata: asset.metadata
            });
        }

        // It's from a pack
        else if (source === "pack") {
            var packName = id.split(":")[1].split("/")[0];
            var pack = this.$data.packList[packName];

            if (!pack) {
                throw Error("Pack '" + packName + "' does not exist");
            }

            var packUrl = url.resolve(this.$data.rootUrl, pack.url);
            return this.$data.manager.importAssetPackageFromUrl(packUrl)
                .then(function(pack) {
                    if (pack.packName !== packName) {
                        throw new Error("Pack name '" + packName + "' in catalog is different from the one in the package itself '" + pack.packName + "'");
                    }
                    return Q(id);
                });
        }

        throw Error("Asset '" + id + "' does not exist");
    },

    /**
     * [PROMISE] Get an asset as a buffer.
     *
     * @method getAssetAsBuffer
     * @param {String} id
     * @return {Function} `function(buffer)`
     */
    getAssetAsBuffer: function(id) {
        return this.loadAsset(id)
            .then(this.$data.manager.getAssetAsBuffer);
    },

    /**
     * [PROMISE] Get an asset as an image.
     *
     * @method getAssetAsImage
     * @param {String} id
     * @return {Function} `function(image)`
     */
    getAssetAsImage: function(id) {
        return this.loadAsset(id)
            .then(this.$data.manager.getAssetAsImage);
    },

    /**
     * [PROMISE] Get an asset as a blob URL.
     *
     * @method getAssetAsBlobUrl
     * @param {String} id
     * @return {Function} `function(url)`
     */
    getAssetAsBlobUrl: function(id) {
        return this.loadAsset(id)
            .then(this.$data.manager.getAssetAsBlobUrl);
    },

    /**
     * [PROMISE] Get an asset as a data-64 URL.
     *
     * @method getAssetAsData64Url
     * @param {String} id
     * @return {Function} `function(data64Url)`
     */
    getAssetAsData64Url: function(id) {
        return this.loadAsset(id)
            .then(this.$data.manager.getAssetAsData64Url);
    },

    /**
     * [PROMISE] Get an asset as a blob.
     *
     * @method getAssetAsBlob
     * @param {String} id
     * @return {Function} `function(blob)`
     */
    getAssetAsBlob: function(id) {
        return this.loadAsset(id)
            .then(this.$data.manager.getAssetAsBlob);
    },

    /**
     * Get the record of a asset.
     *
     *     record: {
     *         mime,    // {String}
     *         offset,  // {Number}
     *         length,  // {Number}
     *         metadata // {Object}
     *     };
     *
     * @param {String} id
     * @return {Object}
     */
    getAssetRecord: function(id) {
        return this.$data.assetList[id];
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
        return asset !== undefined;
    },

    /**
     * Check whether the specified asset has been loaded or not.
     *
     * @method assetLoaded
     * @param {String} id
     * @return {Boolean}
     */
    assetLoaded: function(id) {
        return this.$data.manager.assetExists(id);
    }

});

module.exports = ObsidianAssetsCatalog;
