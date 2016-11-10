# Obsidian Assets Manager

[![Build Status](https://travis-ci.org/wanadev/obsidian-assets-manager.svg?branch=master)](https://travis-ci.org/wanadev/obsidian-assets-manager)
[![NPM Version](http://img.shields.io/npm/v/obsidian-assets-manager.svg?style=flat)](https://www.npmjs.com/package/obsidian-assets-manager)
[![License](http://img.shields.io/npm/l/obsidian-assets-manager.svg?style=flat)](https://github.com/wanadev/obsidian-assets-manager/blob/master/LICENSE)
[![Dependencies](https://img.shields.io/david/wanadev/obsidian-assets-manager.svg?maxAge=2592000)]()
[![Dev Dependencies](https://img.shields.io/david/dev/wanadev/obsidian-assets-manager.svg?maxAge=2592000)]()


Documentation:

* [https://github.com/wanadev/obsidian-assets-manager/tree/master/doc](https://github.com/wanadev/obsidian-assets-manager/tree/master/doc)


## CLI Tool: catalog generator

`obsidian-catalog` extracts data from Obsidian Pack files and generates an Obsidian Catalog file.

    Usage: obsidian-catalog [options] <packFiles>

    Options:
      --output, -o        Output file (print to stdout if not defined)      [string]
      --pretty-print, -p  Makes the output JSON human-readable             [boolean]
      --version, -v       Show version number                              [boolean]
      --help, -h          Show help                                        [boolean]

Examples:

    $ obsidian-catalog assets1.opak assets2.opak
    $ obsidian-catalog -o catalog.json assets.opak


## Changelog

* **1.3.1**:
    * updated to sha.js@2.4.7
* **1.3.0**:
    * added a function to get an asset id from its blob url
* **1.2.0**:
    * replaced `js-sha1` lib by `sha.js`
* **1.1.0**:
    * added `obsidian-catalog` CLI tool
* **1.0.1**:
    * updated to `obsidian-pack` 1.0.0
    * small fixes
* **1.0.0**:
    * assets manager
    * assets catalog
