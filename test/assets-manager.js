"use strict";

var ObsidianPackFile = require("obsidian-pack");
var expect = require("expect.js");
var Sha1 = require("sha.js").sha1;
var Q = require("q");

var ObsidianAssetsManager = require("../lib/assets-manager");
var AssetsConverter = require("../lib/assets-converter");

var FILES_Url = location.protocol + "//" + location.host + "/files/";

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

var imageData64Url = "data:image/png;base64,";
imageData64Url += "iVBORw0KGgoAAAANSUhEUgAAABAAAAAQAgMAAABinRfyAAAACVBMVEUAAAD/AAD//";
imageData64Url += "/9nGWQeAAAAAWJLR0QAiAUdSAAAAAlwSFlzAAAOxAAADsQBlSsOGwAAAAd0SU1FB9";
imageData64Url += "8LEg0LF8qDZQAAAAA9SURBVAgdDcHBDQAhDAPBLQfRD/2c8opcBfILpcrzDCeY4PM";
imageData64Url += "VbhUuC+sJ3zITTFB6Q+sNpbXpblFamwlO/JFNIn9yzLB/AAAAAElFTkSuQmCC";

var imageUrl = FILES_Url + "image.png";
var imageBlob;

var pack = new ObsidianPackFile();
pack.packName = "pack";
pack.addAssetFromBuffer(imageBuffer, "image", { mime: "image/png", metadata: { all: "right" } });

var packBuffer = pack.exportAsBuffer();
var packData64Url = pack.exportAsData64Url();
var packUrl = FILES_Url + "pack.opak";
var packBlob;

describe("ObsidianAssetsManager", function() {

    before(function() {
        var packAsset = { mime: ObsidianPackFile.MIMETYPE, as: { buffer: packBuffer } };
        var asset = { mime: "image/png", as: { buffer: imageBuffer } };

        return AssetsConverter._bufferToBlob(asset)
            .then(function(asset) {
                imageBlob = asset.as.blob;
                return AssetsConverter._bufferToBlob(packAsset);
            })
            .then(function(packAsset) {
                packBlob = packAsset.as.blob;
                return AssetsConverter._blobToBlobUrl(packAsset);
            })
            .then(function(packAsset) {
                packBlob = packAsset.as.blob;
            });
    });

    describe("assets", function() {

        it("can add and remove assets", function() {
            var assets = new ObsidianAssetsManager();
            return assets.addAssetFromBuffer(imageBuffer)
                .then(function(id) {
                    expect(assets.assetExists(id)).to.be.ok();
                    assets.removeAsset(id);
                    expect(assets.assetExists(id)).not.to.be.ok();
                });
        });

        it("can add and get assets from buffer", function() {
            var assets = new ObsidianAssetsManager();
            return assets.addAssetFromBuffer(imageBuffer)
                .then(function(id) {
                    expect(assets.$data.assetList[id].source).to.match(/^buffer:/);
                    expect(assets.$data.assetList[id].mime).to.be("application/octet-stream");
                    return assets.getAssetAsBuffer(id);
                })
                .then(function(assetBuffer) {
                    expect(assetBuffer).to.be(imageBuffer);
                    return assets.addAssetFromBuffer(imageBuffer, { id: "asset1", mime: "image/png" });
                })
                .then(function(id) {
                    expect(id).to.be("asset1");
                    expect(assets.$data.assetList[id].mime).to.be("image/png");
                    expect(assets.$data.assetList[id].as.buffer).to.be(imageBuffer);
                });
        });

        it("can add and get assets from image", function() {
            var assets = new ObsidianAssetsManager();
            var image = new Image();

            return Q.Promise(function(resolve, reject) {
                    image.onerror = reject;
                    image.onload = function(event) {
                        resolve(assets.addAssetFromImage(image));
                    };

                    image.src = imageData64Url;
                })
                .then(function(id) {
                    expect(assets.$data.assetList[id].source).to.match(/^image:/);
                    expect(assets.$data.assetList[id].mime).to.equal("image/png");
                    return assets.getAssetAsImage(id);
                })
                .then(function(assetImage) {
                    expect(assetImage).to.be(image);
                });
        });

        it("can add assets from a Url", function() {
            var assets = new ObsidianAssetsManager();

            return assets.addAssetFromUrl(imageUrl)
                .then(function(id) {
                    expect(id).to.equal("url:" + new Sha1().update(imageUrl, "utf8").digest("hex"));
                    expect(assets.$data.assetList[id].source).to.match(/^url:/);
                    expect(assets.$data.assetList[id].mime).to.equal("image/png");
                });
        });

        it("can add and get assets from a data64Url", function() {
            var assets = new ObsidianAssetsManager();

            return assets.addAssetFromData64Url(imageData64Url)
                .then(function(id) {
                    expect(assets.$data.assetList[id].source).to.match(/^data64Url:/);
                    expect(assets.$data.assetList[id].mime).to.equal("image/png");
                    return assets.getAssetAsData64Url(id);
                })
                .then(function(assetData64Url) {
                    expect(assetData64Url).to.be.eql(imageData64Url);
                });
        });

        it("can add and get assets from a blob", function() {
            var assets = new ObsidianAssetsManager();

            return assets.addAssetFromBlob(imageBlob)
                .then(function(id) {
                    expect(id).to.be.a("string");
                    expect(assets.$data.assetList[id].source).to.match(/^blob:/);
                    expect(assets.$data.assetList[id].mime).to.equal("image/png");
                    return assets.getAssetAsBlob(id);
                })
                .then(function(assetBlob) {
                    expect(assetBlob).to.be(imageBlob);
                });
        });

        it("can convert to any type from buffer", function() {
            var assets = new ObsidianAssetsManager();

            return assets.addAssetFromBuffer(imageBuffer, { id: "asset", mime: "image/png" })
                .then(function() { return assets.getAssetAsBlob("asset"); })
                .then(function(assetBlob) {
                    expect(assetBlob).to.be.ok();
                    expect(assetBlob).to.be.a(Blob);
                    return assets.getAssetAsBlobUrl("asset");
                })
                .then(function(assetBlobUrl) {
                    expect(assetBlobUrl).to.be.ok();
                    expect(assetBlobUrl).to.be.a("string");
                    return assets.getAssetAsData64Url("asset");
                })
                .then(function(assetData64Url) {
                    expect(assetData64Url).to.equal(imageData64Url);
                    return assets.getAssetAsImage("asset");
                })
                .then(function(assetImage) {
                    expect(assetImage).to.be.ok();
                    expect(assetImage).to.be.an(Image);
                });
        });

    });

    describe("packages", function() {

        it("can import and remove package", function() {
            var assets = new ObsidianAssetsManager();
            return assets.importAssetPackageFromBuffer(packBuffer)
                .then(function(pack) {
                    expect(assets.assetPackageExists("pack")).to.be.ok();
                    expect(assets.assetExists("pack:pack/image")).to.be.ok();
                    assets.removeAssetPackage("pack");
                    expect(assets.assetPackageExists("pack")).not.to.be.ok();
                    expect(assets.assetExists("pack:pack/image")).not.to.be.ok();
                });
        });

        it("can import package from a buffer", function() {
            var assets = new ObsidianAssetsManager();

            return assets.importAssetPackageFromBuffer(packBuffer)
                .then(function(pack) {
                    return assets.getAssetAsBuffer("pack:pack/image");
                })
                .then(function(assetBuffer) {
                    expect(assets.$data.assetList["pack:pack/image"].metadata.all).to.equal("right");
                    expect(assetBuffer).to.be.eql(imageBuffer);
                });
        });

        it("can import package from a data64Url", function() {
            var assets = new ObsidianAssetsManager();

            return assets.importAssetPackageFromData64Url(packData64Url)
                .then(function(pack) {
                    return assets.getAssetAsBuffer("pack:pack/image");
                })
                .then(function(assetBuffer) {
                    expect(assets.$data.assetList["pack:pack/image"].metadata.all).to.equal("right");
                    expect(assetBuffer).to.be.eql(imageBuffer);
                });
        });

        it("can import package from a Url", function() {
            var assets = new ObsidianAssetsManager();

            return assets.importAssetPackageFromUrl(packUrl)
                .then(function(pack) {
                    return assets.getAssetAsBuffer("pack:pack/image");
                })
                .then(function(assetBuffer) {
                    expect(assets.$data.assetList["pack:pack/image"].metadata.all).to.equal("right");
                    expect(assetBuffer).to.be.eql(imageBuffer);
                });
        });

        it("can import package from a blob", function() {
            var assets = new ObsidianAssetsManager();

            return assets.importAssetPackageFromBlob(packBlob)
                .then(function(pack) {
                    return assets.getAssetAsBuffer("pack:pack/image");
                })
                .then(function(assetBuffer) {
                    expect(assets.$data.assetList["pack:pack/image"].metadata.all).to.equal("right");
                    expect(assetBuffer).to.be.eql(imageBuffer);
                });
        });

    });

});
