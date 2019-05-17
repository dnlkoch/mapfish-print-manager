/*eslint-env jest*/
import OlLayerImage from 'ol/layer/Image';
import OlLayerTile from 'ol/layer/Tile';
import OlSourceImageWMS from 'ol/source/ImageWMS';
import OlSourceOSM from 'ol/source/OSM';

import { MapFishPrintV3OSMSerializer } from '../../src/serializer/MapFishPrintV3OSMSerializer';

describe('MapFishPrintV3OSMSerializer', () => {
  let serializer;

  beforeEach(() => {
    serializer = new MapFishPrintV3OSMSerializer();
  });

  it('is defined', () => {
    expect(MapFishPrintV3OSMSerializer).not.toBeUndefined();
  });

  it('checks if the given layer can be serialized with it', () => {
    const layer = new OlLayerImage({
      source: new OlSourceImageWMS()
    });

    const serialized = serializer.serialize(layer);

    expect(serialized).toBeUndefined();
  });

  it('serializes a layer with an OSM source', () => {
    const layer = new OlLayerTile({
      source: new OlSourceOSM()
    });

    const serializedSimple = serializer.serialize(layer);

    expect(serializedSimple).toEqual({
      baseURL: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
      customParams: {},
      dpi: 72,
      failOnError: false,
      imageExtension: 'png',
      maxExtent: [-20037508.34, -20037508.34, 20037508.34, 20037508.34],
      name: layer.get('name'),
      opacity: layer.getOpacity(),
      rasterStyle: undefined,
      resolutionTolerance: 0,
      resolutions: [],
      tileSize: [256, 256],
      type: 'osm'
    });
  });

  it('accepts additional serializer opts', () => {
    const layer = new OlLayerTile({
      source: new OlSourceOSM()
    });

    const serializedSimple = serializer.serialize(layer, {
      tileSize: [512, 512],
      imageExtension: 'jpg'
    });

    expect(serializedSimple).toEqual({
      baseURL: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
      customParams: {},
      dpi: 72,
      failOnError: false,
      imageExtension: 'jpg',
      maxExtent: [-20037508.34, -20037508.34, 20037508.34, 20037508.34],
      name: layer.get('name'),
      opacity: layer.getOpacity(),
      rasterStyle: undefined,
      resolutionTolerance: 0,
      resolutions: [],
      tileSize: [512, 512],
      type: 'osm'
    });
  });
});
