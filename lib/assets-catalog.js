"use strict";

var Class = require("abitbol");

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
    },

    /**
     * The assets manager
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
        return this.$data.catalogList;
    },

    // ===== Import

    /**
     * Import a catalog to the catalogs list.
     *
     * @method addAsset
     * @param {Object} catalog
     */
    importAssetCatalog: function(catalog) {
        for (var packName in catalog.packages) {
            var pack = catalog.packages[packName];
            this.$data.packList[packName] = {};

            // @todo resolve url with rootUrl if relative path
            this.$data.packList[packName].url = pack.url;
            this.$data.packList[packName].assets = [];

            for (var assetId in pack.assets) {
                var asset = pack.assets[assetId];
                assetId = "pack:" + packName + "/" + assetId;
                this.$data.packList[packName].assets.push(assetId);
                this.$data.assetList[assetId] = asset;
            }
        }
    },

    // ===== Gettes

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
    }

});

module.exports = ObsidianAssetsCatalog;
