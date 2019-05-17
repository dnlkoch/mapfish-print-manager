[![Build Status](https://travis-ci.com/terrestris/mapfish-print-manager.svg?branch=master)](https://travis-ci.com/terrestris/mapfish-print-manager) [![Greenkeeper badge](https://badges.greenkeeper.io/terrestris/mapfish-print-manager.svg)](https://greenkeeper.io/)

# Mapfish Print Manager

An interface manager to easily communicate with the MapFish Print module via
an ol based webapplication.

Note: Currently the MapFish Print version 2 is supported only.

# Installation

If you're using ol in version 5 (or higher) just run:

```
npm i --save @terrestris/mapfish-print-manager
```

For version 4 one might use the manager in version 1:

```
npm i --save @terrestris/mapfish-print-manager@1
```

# Usage

```
// Import the manager.
import { MapFishPrintV2Manager } from '@terrestris/mapfish-print-manager';

// Construct the manager with a remote print servlet and an `ol.Map` instance
// (required).
const printManager = new MapFishPrintV2Manager({
  url: 'https://10.10.10.10/print/',
  map: olMap
});

// Initialize the manager. It will return a resolved `Promise` as soon as the
// capabilities are loaded from the given ressource, e.g. https://10.10.10.10/print/info.json.
printManager.init()
  .then(() => {
    // Prepare the print layout via the extent feature on the map and/or the
    // usage of the setters like `printManager.setLayout()` and call
    // `printManager.print()` to create the print document.
  });
```

# API

## MapFishPrintV2Manager

### Constructor

`new MapFishPrintV2Manager(opts)`

### Properties

| Property        | Type            | Required | Default | Description |
|-----------------|-----------------|----------|---------|-------------|
| map             | ol.Map          | Yes      | `null` | The map this PrintManager is bound to.|
| url             | String          | No       | `null` | Base url of the print service.|
| capabilities    | Object          | No       | `null` | The capabilities of the print service. Either filled automatically out of the the given print service or given manually.|
| method          | String          | No       | `POST` | Method to use when sending print requests to the servlet. Either `POST` or `GET` (case-sensitive).|
| headers         | Object          | No       | `{}` | Additional headers to be send to the print servlet.|
| credentialsMode | String          | No       | `same-origin` |The authentication credentials mode.|
| customParams    | Object          | No       | `{}` |Key-value pairs of custom data to be sent to the print service. This is e.g. useful for complex layout definitions on the server side that require additional parameters.|
| extentLayer     | ol.layer.Vector | No       | `null` |The layer to show the actual print extent on. If not provided, a default one will be created.|
| maskColor       | String          | No       | `rgba(130, 130, 130, 0.5)` | The color to apply to the mask around the extent feature. Will be applied to the default extentLayer only. If you don't want the mask to be shown on the map, provide a custom extentLayer.|
| transformOpts   | Object          | No       | `{}` | Custom options to apply to the transform interaction. See http://viglino.github.io/ol-ext/doc/doc-pages/ol.interaction.Transform.html for valid options.|
| layerFilter     | Function        | No       | `() => true` |A filter function that will be called before the print call. Should return a Boolean whether to serialize a layer for print or not.|
| serializers     | Array           | No       | `[MapFishPrintV2WMSSerializer, VectorSerializer]` |The layer serializers to use. May be overridden or extented to obtain custom functionality.|

### Methods

#### `init()`

Initializes the manager.

**Returns:**

| Type | Description |
|------|-------------|
| `Promise` |  |

#### `getLayout()`

Returns the currently selected layout.

**Returns:**

| Type | Description |
|------|-------------|
| `Object` | The the currently selected layout. |

#### `setLayout(name)`

Sets the layout to use. Updates the print extent accordingly.

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| name | String | The name of the layout to use. |

#### `getOutputFormat()`

Returns the currently selected output format.

**Returns:**

| Type | Description |
|------|-------------|
| `Object` | The the currently selected output format. |

#### `setOutputFormat(name)`

Sets the output format to use.

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| name | String | The name of the output format to use. |

#### `getDpi()`

Returns the currently selected dpi.

**Returns:**

| Type | Description |
|------|-------------|
| `Object` | The the currently selected dpi. |

#### `setDpi(name)`

Sets the dpi to use.

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| name | String | The name of the dpi to use. |

#### `getScale()`

Returns the currently selected scale.

**Returns:**

| Type | Description |
|------|-------------|
| `Object` | The the currently selected scale. |

#### `setScale(name)`

Sets the scale to use. Updates the print extent accordingly.

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| name | String | The name of the scale to use. |

#### `getLayouts()`

Returns all supported layouts.

**Returns:**

| Type | Description |
|------|-------------|
| `Array` | The supported layouts. |

#### `getOutputFormats()`

Returns all supported output formats.

**Returns:**

| Type | Description |
|------|-------------|
| `Array` | The supported output formats. |

#### `getDpis()`

Returns all supported dpis.

**Returns:**

| Type | Description |
|------|-------------|
| `Array` | The supported dpis. |

#### `getScales()`

Returns all supported scales.

**Returns:**

| Type | Description |
|------|-------------|
| `Array` | The supported scales. |

#### `isInitiated()`

Whether this manager has been initiatilized or not.

**Returns:**

| Type | Description |
|------|-------------|
| `Boolean` | Whether this manager has been initiated or not. |

#### `shutdownManager()`

Shuts down the manager.

#### `print(forceDownload)`

Calls the print servlet to create a output file in the requested format and forces a download of the created output. Note: The manager has to been initialized prior this method's usage.

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| forceDownload | Boolean | Whether to force a direct download of the print result or to return the download url. |

**Returns:**

| Type | Description |
|------|-------------|
| `Promise` `undefined` | If forceDownload is set to false, the download url of the print result will be returned in a Promise. |

#### `download(String url)`

Opens the given URL in a new browser tab to download the given response (if header are set correctly).

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| url | String |  The url to open. |
