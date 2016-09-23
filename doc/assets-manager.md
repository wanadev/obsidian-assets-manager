# obsidian-assets-manager

**ObsidianAssetsManager** features:

* can store assets from any source (blob/buffer/image/data64Url/url)
* can get the stored assets to any type (blob/buffer/image/data64Url/blobUrl)

## Usage

```javascript
var ObsidianAssetsManager = require("obsidian-assets-manager/lib/assets-manager");
var assets = new ObsidianAssetsManager();

// Add and get assets
var id = assets.addAssetFromImage(image);
var blobUrl = assets.getAssetAsBlobUrl(id);

// Add and get assets from ObsidianPackFile
var pack = assets.importAssetPackageFromBuffer(packBuffer);
var buffer = assets.getAssetAsBuffer("pack:" + pack.packName + "/assetId");
```
