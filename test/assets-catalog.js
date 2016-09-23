"use strict";

var expect = require("expect.js");
var fs = require("fs");

var ObsidianAssetsCatalog = require("../lib/assets-catalog");

var catalog = require("./server/static/catalog.json");

describe("ObsidianAssetsCatalog", function() {

    describe("catalogs", function() {

        it("can import a catalog", function() {
            var assets = new ObsidianAssetsCatalog();
            assets.importAssetCatalog(catalog);

            expect(assets.assetExists("pack:pack/image")).to.be.ok();
            expect(assets.getAssetRecord("pack:pack/image")).to.eql({
                mime: "image/png",
                offset: null,
                length: 192,
                metadata: {
                    "all": "right"
                }
            });
        });

    });

});
