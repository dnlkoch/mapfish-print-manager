/*eslint-env jest*/
import OlLayerImage from 'ol/layer/Image';
import OlLayerTile from 'ol/layer/Tile';
import OlSourceImageWMS from 'ol/source/ImageWMS';
import OlSourceTileWMS from 'ol/source/TileWMS';
import OlSourceOSM from 'ol/source/OSM';

import { MapFishPrintV2WMSSerializer } from '../../src/serializer/MapFishPrintV2WMSSerializer';

describe('MapFishPrintV2WMSSerializer', () => {
  let serializer;

  beforeEach(() => {
    serializer = new MapFishPrintV2WMSSerializer();
  });

  it('is defined', () => {
    expect(MapFishPrintV2WMSSerializer).not.toBeUndefined();
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
      })
    });

    const serializedSimple = serializer.serialize(layer);

    expect(serializedSimple).toEqual({
      baseURL: layerUrl,
      customParams: {},
      format: 'image/png',
      layers: [layerName],
      opacity: 1,
      singleTile: true,
      styles: [''],
      type: 'WMS'
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
      format: 'image/png',
      layers: [layerName],
      opacity: 1,
      singleTile: true,
      styles: [''],
      type: 'WMS'
    });

    const customFormat = {
      FORMAT: 'image/png8'
    };
    layer.getSource().updateParams(customFormat);

    const serializedFormat = serializer.serialize(layer);

    expect(serializedFormat).toEqual({
      baseURL: layerUrl,
      customParams: customParams,
      format: customFormat.FORMAT,
      layers: [layerName],
      opacity: 1,
      singleTile: true,
      styles: [''],
      type: 'WMS'
    });

    const customStyles = {
      STYLES: 'SUEDKURVE'
    };
    layer.getSource().updateParams(customStyles);

    const serializedCustomStyles = serializer.serialize(layer);

    expect(serializedCustomStyles).toEqual({
      baseURL: layerUrl,
      customParams: customParams,
      format: customFormat.FORMAT,
      layers: [layerName],
      opacity: 1,
      singleTile: true,
      styles: [customStyles.STYLES],
      type: 'WMS'
    });

    const maxResolution = 1909;
    layer.setMaxResolution(maxResolution);

    const serializedMaxResolution = serializer.serialize(layer);

    expect(serializedMaxResolution).toEqual({
      baseURL: layerUrl,
      customParams: customParams,
      format: customFormat.FORMAT,
      layers: [layerName],
      opacity: 1,
      singleTile: true,
      styles: [customStyles.STYLES],
      type: 'WMS',
      maxScaleDenominator: 6817843.507142856,
    });

    const minResolution = 1909;
    layer.setMinResolution(minResolution);

    const serializedMinResolution = serializer.serialize(layer);

    expect(serializedMinResolution).toEqual({
      baseURL: layerUrl,
      customParams: customParams,
      format: customFormat.FORMAT,
      layers: [layerName],
      opacity: 1,
      singleTile: true,
      styles: [customStyles.STYLES],
      type: 'WMS',
      maxScaleDenominator: 6817843.507142856,
      minScaleDenominator: 6817843.507142856
    });
  });

  it('serializes a layer with an TileWMS source', () => {
    const layerUrl = 'https://bvb.de/geoserver/wms';
    const layerName = 'shinji:kagawa';
    const layer = new OlLayerTile({
      extent: [-13884991, 2870341, -7455066, 6338219],
      source: new OlSourceTileWMS({
        url: layerUrl,
        params: {
          LAYERS: layerName
        }
      })
    });

    const serializedSimple = serializer.serialize(layer);

    expect(serializedSimple).toEqual({
      baseURL: layerUrl,
      customParams: {},
      format: 'image/png',
      layers: [layerName],
      opacity: 1,
      singleTile: false,
      styles: [''],
      type: 'WMS'
    });
  });

});
