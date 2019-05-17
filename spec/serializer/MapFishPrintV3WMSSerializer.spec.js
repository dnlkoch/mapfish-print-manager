/*eslint-env jest*/
import OlLayerImage from 'ol/layer/Image';
import OlLayerTile from 'ol/layer/Tile';
import OlSourceImageWMS from 'ol/source/ImageWMS';
import OlSourceOSM from 'ol/source/OSM';

import { MapFishPrintV3WMSSerializer } from '../../src/serializer/MapFishPrintV3WMSSerializer';

describe('MapFishPrintV3WMSSerializer', () => {
  let serializer;

  beforeEach(() => {
    serializer = new MapFishPrintV3WMSSerializer();
  });

  it('is defined', () => {
    expect(MapFishPrintV3WMSSerializer).not.toBeUndefined();
  });

  it('checks if the given layer can be serialized with it', () => {
    const layer = new OlLayerTile({
      source: new OlSourceOSM()
    });

    const serialized = serializer.serialize(layer);

    expect(serialized).toBeUndefined();
  });

  it('serializes a layer with an ImageWMS source', () => {
    const layerUrl = 'https://bvb.de/geoserver/wms';
    const layerName = 'shinji:kagawa';
    const layer = new OlLayerImage({
      extent: [-13884991, 2870341, -7455066, 6338219],
      source: new OlSourceImageWMS({
        url: layerUrl,
        params: {
          LAYERS: layerName
        }
      }),
      name: 'Shinji',
    });

    const serializedSimple = serializer.serialize(layer);

    expect(serializedSimple).toEqual({
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
      type: 'wms'
    });

    const customParams = {
      CUSTOM_PARAM_1: 'BVB',
      CUSTOM_PARAM_2: '09'
    };
    layer.getSource().updateParams(customParams);

    const serializedCustomParams = serializer.serialize(layer);

    expect(serializedCustomParams).toEqual({
      baseURL: layerUrl,
      customParams: customParams,
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
      type: 'wms'
    });

    const customFormat = {
      FORMAT: 'image/png8'
    };
    layer.getSource().updateParams(customFormat);

    const serializedFormat = serializer.serialize(layer);

    expect(serializedFormat).toEqual({
      baseURL: layerUrl,
      customParams: customParams,
      failOnError: false,
      imageFormat: customFormat.FORMAT,
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
      type: 'wms'
    });

    const customStyles = {
      STYLES: 'SUEDKURVE'
    };
    layer.getSource().updateParams(customStyles);

    const serializedCustomStyles = serializer.serialize(layer);

    expect(serializedCustomStyles).toEqual({
      baseURL: layerUrl,
      customParams: customParams,
      failOnError: false,
      imageFormat: customFormat.FORMAT,
      layers: [layerName],
      mergeableParams: [],
      method: 'GET',
      name: 'Shinji',
      opacity: 1,
      rasterStyle: undefined,
      serverType: undefined,
      styles: [customStyles.STYLES],
      useNativeAngle: false,
      version: '1.1.0',
      type: 'wms'
    });
  });

  it('accepts additional serializer opts', () => {
    const layerUrl = 'https://bvb.de/geoserver/wms';
    const layerName = 'shinji:kagawa';
    const layer = new OlLayerImage({
      extent: [-13884991, 2870341, -7455066, 6338219],
      source: new OlSourceImageWMS({
        url: layerUrl,
        params: {
          LAYERS: layerName
        }
      }),
      name: 'Shinji',
    });

    const serialized = serializer.serialize(layer, {
      failOnError: true,
      serverType: 'GEOSERVER'
    });

    expect(serialized).toEqual({
      baseURL: layerUrl,
      customParams: {},
      failOnError: true,
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
      type: 'wms'
    });
  });
});
