/*eslint-env jest*/
import OlLayerTile from 'ol/layer/Tile';
import OlSourceTileWMS from 'ol/source/TileWMS';
import OlSourceOSM from 'ol/source/OSM';

import { MapFishPrintV3TiledWMSSerializer } from '../../src/serializer/MapFishPrintV3TiledWMSSerializer';

describe('MapFishPrintV3TiledWMSSerializer', () => {
  let serializer;

  beforeEach(() => {
    serializer = new MapFishPrintV3TiledWMSSerializer();
  });

  it('is defined', () => {
    expect(MapFishPrintV3TiledWMSSerializer).not.toBeUndefined();
  });

  it('checks if the given layer can be serialized with it', () => {
    const layer = new OlLayerTile({
      source: new OlSourceOSM()
    });

    const serialized = serializer.serialize(layer);

    expect(serialized).toBeUndefined();
  });

  it('serializes a layer with a TileWMS source', () => {
    const layerUrl = 'https://bvb.de/geoserver/wms';
    const layerName = 'shinji:kagawa';
    const layer = new OlLayerTile({
      extent: [-13884991, 2870341, -7455066, 6338219],
      source: new OlSourceTileWMS({
        url: layerUrl,
        params: {
          LAYERS: layerName
        }
      }),
      name: 'Shinji'
    });

    const serialized = serializer.serialize(layer);

    expect(serialized).toEqual({
      baseURL: layerUrl,
      customParams: {},
      failOnError: false,
      imageFormat: 'image/png',
      layers: [layerName],
      mergeableParams: [],
      method: 'GET',
      name: 'Shinji',
      opacity: 1,
      rasterStyle: undefined,
      serverType: undefined,
      styles: [''],
      useNativeAngle: false,
      version: '1.1.0',
      tileSize: [512, 512],
      type: 'tiledwms'
    });
  });

  it('accepts additional serializer opts', () => {
    const layerUrl = 'https://bvb.de/geoserver/wms';
    const layerName = 'shinji:kagawa';
    const layer = new OlLayerTile({
      extent: [-13884991, 2870341, -7455066, 6338219],
      source: new OlSourceTileWMS({
        url: layerUrl,
        params: {
          LAYERS: layerName
        }
      }),
      name: 'Shinji'
    });

    const serialized = serializer.serialize(layer, {
      tileSize: [256, 256],
      serverType: 'GEOSERVER'
    });

    expect(serialized).toEqual({
      baseURL: layerUrl,
      customParams: {},
      failOnError: false,
      imageFormat: 'image/png',
      layers: [layerName],
      mergeableParams: [],
      method: 'GET',
      name: 'Shinji',
      opacity: 1,
      rasterStyle: undefined,
      serverType: 'GEOSERVER',
      styles: [''],
      useNativeAngle: false,
      version: '1.1.0',
      tileSize: [256, 256],
      type: 'tiledwms'
    });
  });
});
