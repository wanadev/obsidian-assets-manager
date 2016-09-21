"use strict";

var expect = require("expect.js");
var Q = require("q");

var AssetsManager = require("../lib/assets-manager");
var helpers = require("../lib/helpers");

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

var imageData64 = "data:image/png;base64,";
imageData64 += "iVBORw0KGgoAAAANSUhEUgAAABAAAAAQAgMAAABinRfyAAAACVBMVEUAAAD/AAD//";
imageData64 += "/9nGWQeAAAAAWJLR0QAiAUdSAAAAAlwSFlzAAAOxAAADsQBlSsOGwAAAAd0SU1FB9";
imageData64 += "8LEg0LF8qDZQAAAAA9SURBVAgdDcHBDQAhDAPBLQfRD/2c8opcBfILpcrzDCeY4PM";
imageData64 += "VbhUuC+sJ3zITTFB6Q+sNpbXpblFamwlO/JFNIn9yzLB/AAAAAElFTkSuQmCC";

var imageBlob = helpers.createBlob([imageBuffer], {type: "image/png"});

var FILES_URL = location.protocol + "//" + location.host + "/files/";

describe("AssetsManager", function() {

    describe("assets", function() {

        it("can add and get assets from buffer", function() {
            var assets = new AssetsManager();
            return assets.addAssetFromBuffer(imageBuffer)
                .then(function(id) {
                    expect(assets.$data.assetsList[id].mime).to.be("application/octet-stream");
                    return assets.getAssetAsBuffer(id);
                })
                .then(function(assetBuffer) {
                    expect(assetBuffer).to.be(imageBuffer);
                    return assets.addAssetFromBuffer(imageBuffer, {id: "asset1"});
                })
                .then(function(id) {
                    expect(id).to.be("asset1");
                    expect(assets.$data.assetsList[id].mime).to.be("application/octet-stream");
                    expect(assets.$data.assetsList[id].as.buffer).to.be(imageBuffer);
                });
        });

        it("can add and get assets from image", function() {
            var assets = new AssetsManager();
            var image = new Image();

            return Q.Promise(function(resolve, reject) {
                    image.onerror = reject;
                    image.onload = function(event) {
                        resolve(assets.addAssetFromImage(image));
                    };

                    image.src = imageData64;
                })
                .then(function(id) {
                    expect(assets.$data.assetsList[id].mime).to.equal("image/png");
                    return assets.getAssetAsImage(id);
                })
                .then(function(assetImage) {
                    expect(assetImage).to.be(image);
                });
        });

        it("can add assets from a URL", function() {
            var assets = new AssetsManager();

            return assets.addAssetFromUrl(FILES_URL + "image.png")
                .then(function(id) {
                    expect(assets.$data.assetsList[id].mime).to.equal("image/png");
                });
        });

        it("can add and get assets from a data-64 URL", function() {
            var assets = new AssetsManager();

            return assets.addAssetFromData64Url(imageData64)
                .then(function(id) {
                    expect(assets.$data.assetsList[id].mime).to.equal("image/png");
                    return assets.getAssetAsData64Url(id);
                })
                .then(function(assetBuffer) {
                    expect(assetBuffer).to.be.eql(imageData64);
                });
        });

        it("can add and get assets from a blob", function() {
            var assets = new AssetsManager();

            return assets.addAssetFromBlob(imageBlob)
                .then(function(id) {
                    expect(id).to.be.a("string");
                    expect(assets.$data.assetsList[id].mime).to.equal("image/png");
                    expect(assets.$data.assetsList[id].as.buffer).to.eql(imageBuffer);
                    return assets.getAssetAsBlob(id);
                })
                .then(function(assetBlob) {
                    expect(assetBlob).to.be(imageBlob);
                });
        });

    });

});
