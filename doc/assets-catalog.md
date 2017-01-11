# obsidian-assets-catalog

**ObsidianAssetsCatalog** features:

* can store package catalogs
* loads only used ones on the fly

## Catalog example

A catalog is a JSON file like:

```json
{
    "info": {
        "name": "my-catalog-name",
        "version": 0
    },
    "packages": {
        "pack-1": {
            "url": "pack1.opak",
            "assets": {
                "asset0": {
                    "offset": null,
                    "length": 192,
                    "mime": "image/png",
                    "metadata": {
                        "what": "ever"
                    }
                }
            }
        }
    },
    "assets": {
        "asset1": {
            "url": "image.jpg",
            "length": 256,
            "mime": "image/jpeg",
            "metadata": {}
        }
    }
}
```

It can store both pack (with detailed information of what's inside)
and stand-alone assets.

Please note that the *info* section is currently not used in any way.

## Usage

```javascript
var ObsidianAssetsCatalog = require("obsidian-assets-manager/lib/assets-catalog");
var assets = new ObsidianAssetsCatalog();

// Add catalogs
var id = assets.importAssetCatalogFromUrl("http://foo.com/catalog.json");

// Get the assets from with the packs referenced in the catalogs
var buffer0 = assets.getAssetAsBuffer("pack:pack-1/asset0");
var buffer1 = assets.getAssetAsBuffer("asset1");
```
