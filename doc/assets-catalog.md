# obsidian-assets-catalog

**ObsidianAssetsCatalog** features:

* can store package catalogs
* loads only used ones on the fly

## Usage

```javascript
var ObsidianAssetsCatalog = require("obsidian-assets-manager/lib/assets-catalog");
var assets = new ObsidianAssetsCatalog();

// Add catalogs
var id = assets.importAssetCatalogFromUrl("http://foo.com/catalog.json");

// Get the assets from with the packs referenced in the catalogs
var buffer = assets.getAssetAsBuffer("pack:pack-1/assetId");
```
