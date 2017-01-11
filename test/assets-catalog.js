"use strict";

var expect = require("expect.js");
var fs = require("fs");

var ObsidianAssetsCatalog = require("../lib/assets-catalog");

var catalog = require("./server/static/catalog.json");

var imageBuffer = new Buffer([
    0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d,
    0x49, 0x48, 0x44, 0x52, 0x00, 0x00, 0x00, 0x10, 0x00, 0x00, 0x00, 0x10,
    0x02, 0x03, 0x00, 0x00, 0x00, 0x62, 0x9d, 0x17, 0xf2, 0x00, 0x00, 0x00,
    0x09, 0x50, 0x4c, 0x54, 0x45, 0x00, 0x00, 0x00, 0xff, 0x00, 0x00, 0xff,
    0xff, 0xff, 0x67, 0x19, 0x64, 0x1e, 0x00, 0x00, 0x00, 0x01, 0x62, 0x4b,
    0x47, 0x44, 0x00, 0x88, 0x05, 0x1d, 0x48, 0x00, 0x00, 0x00, 0x09, 0x70,
    0x48, 0x59, 0x73, 0x00, 0x00, 0x0e, 0xc4, 0x00, 0x00, 0x0e, 0xc4, 0x01,
    0x95, 0x2b, 0x0e, 0x1b, 0x00, 0x00, 0x00, 0x07, 0x74, 0x49, 0x4d, 0x45,
    0x07, 0xdf, 0x0b, 0x12, 0x0d, 0x0b, 0x17, 0xca, 0x83, 0x65, 0x00, 0x00,
    0x00, 0x00, 0x3d, 0x49, 0x44, 0x41, 0x54, 0x08, 0x1d, 0x0d, 0xc1, 0xc1,
    0x0d, 0x00, 0x21, 0x0c, 0x03, 0xc1, 0x2d, 0x07, 0xd1, 0x0f, 0xfd, 0x9c,
    0xf2, 0x8a, 0x5c, 0x05, 0xf2, 0x0b, 0xa5, 0xca, 0xf3, 0x0c, 0x27, 0x98,
    0xe0, 0xf3, 0x15, 0x6e, 0x15, 0x2e, 0x0b, 0xeb, 0x09, 0xdf, 0x32, 0x13,
    0x4c, 0x50, 0x7a, 0x43, 0xeb, 0x0d, 0xa5, 0xb5, 0xe9, 0x6e, 0x51, 0x5a,
    0x9b, 0x09, 0x4e, 0xfc, 0x91, 0x4d, 0x22, 0x7f, 0x72, 0xcc, 0xb0, 0x7f,
    0x00, 0x00, 0x00, 0x00, 0x49, 0x45, 0x4e, 0x44, 0xae, 0x42, 0x60, 0x82
]);

var httpRequest = require("obsidian-http-request");

describe("ObsidianAssetsCatalog", function() {

    describe("catalogs", function() {

        it("can import a catalog", function() {
            var assets = new ObsidianAssetsCatalog();
            assets.rootUrl = "files/";

            return assets.importAssetCatalog(catalog)
                .then(function(catalogName) {
                    expect(catalogName).to.equal("catalog");
                });
        });

        it("can manage catalog's packs", function() {
            var assets = new ObsidianAssetsCatalog();
            assets.rootUrl = "files/";

            return assets.importAssetCatalog(catalog)
                .then(function(catalogName) {
                    expect(assets.assetLoaded("pack:pack/image")).not.to.be.ok();
                    expect(assets.assetExists("pack:pack/image")).to.be.ok();
                    expect(assets.getAssetRecord("pack:pack/image")).to.eql({
                        mime: "image/png",
                        offset: null,
                        length: 192,
                        metadata: {
                            "all": "right"
                        }
                    });

                    return assets.getAssetAsBuffer("pack:pack/image");
                })
                .then(function(assetBuffer) {
                    expect(assetBuffer).to.eql(imageBuffer);
                    return assets.getAssetAsImage("pack:pack/image");
                })
                .then(function(assetImage) {
                    expect(assetImage).to.be.ok();
                    return assets.getAssetAsBlobUrl("pack:pack/image");
                })
                .then(function(assetBlobUrl) {
                    expect(assetBlobUrl).to.be.ok();
                    return assets.getAssetAsBlob("pack:pack/image");
                })
                .then(function(assetBlob) {
                    expect(assetBlob).to.be.ok();
                });
        });

        it("can manage catalog's standalone assets", function() {
            var assets = new ObsidianAssetsCatalog();
            assets.rootUrl = "files/";

            return assets.importAssetCatalog(catalog)
                .then(function(catalogName) {
                    expect(assets.assetLoaded("standalone")).not.to.be.ok();
                    expect(assets.assetExists("standalone")).to.be.ok();
                    expect(assets.getAssetRecord("standalone")).to.eql({
                        "url": "image.png",
                        "length": 192,
                        "mime": "image/png",
                        "metadata": {}
                    });

                    return assets.getAssetAsBuffer("standalone");
                })
                .then(function(assetBuffer) {
                    expect(assetBuffer).to.eql(imageBuffer);
                    return assets.getAssetAsImage("standalone");
                })
                .then(function(assetImage) {
                    expect(assetImage).to.be.ok();
                    return assets.getAssetAsBlobUrl("standalone");
                })
                .then(function(assetBlobUrl) {
                    expect(assetBlobUrl).to.be.ok();
                    return assets.getAssetAsBlob("standalone");
                })
                .then(function(assetBlob) {
                    expect(assetBlob).to.be.ok();
                });
        });

        it("can import a catalog from a Url", function() {
            var assets = new ObsidianAssetsCatalog();
            assets.rootUrl = "files/";

            return assets.importAssetCatalogFromUrl("catalog.json")
                .then(function(catalogName) {
                    expect(catalogName).to.equal("catalog");
                    expect(assets.assetLoaded("pack:pack/image")).not.to.be.ok();
                    expect(assets.assetExists("pack:pack/image")).to.be.ok();
                    expect(assets.getAssetRecord("pack:pack/image")).to.eql({
                        mime: "image/png",
                        offset: null,
                        length: 192,
                        metadata: {
                            "all": "right"
                        }
                    });

                    return assets.getAssetAsBuffer("pack:pack/image");
                })
                .then(function(assetBuffer) {
                    expect(assetBuffer).to.eql(imageBuffer);
                });
        });

    });

});
