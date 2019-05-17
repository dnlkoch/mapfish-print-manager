/*eslint-env jest*/
import OlLayerImage from 'ol/layer/Image';
import OlLayerVector from 'ol/layer/Vector';
import OlSourceImageWMS from 'ol/source/ImageWMS';
import OlSourceVector from 'ol/source/Vector';
import OlFeature from 'ol/Feature';
import OlGeomPoint from 'ol/geom/Point';
import OlGeomLineString from 'ol/geom/LineString';
import OlGeomPolygon from 'ol/geom/Polygon';

import { MapFishPrintV3GeoJsonSerializer } from '../../src/serializer/MapFishPrintV3GeoJsonSerializer';

describe('MapFishPrintV3GeoJsonSerializer', () => {
  let serializer;

  beforeEach(() => {
    serializer = new MapFishPrintV3GeoJsonSerializer();
  });

  it('is defined', () => {
    expect(MapFishPrintV3GeoJsonSerializer).not.toBeUndefined();
  });

  it('checks if the given layer can be serialized with it', () => {
    const layer = new OlLayerImage({
      source: new OlSourceImageWMS()
    });

    const serialized = serializer.serialize(layer);

    expect(serialized).toBeUndefined();
  });

  it('serializes a layer with a Vector source (no features)', () => {
    const layer = new OlLayerVector({
      source: new OlSourceVector()
    });

    const serializedSimple = serializer.serialize(layer);

    expect(serializedSimple).toEqual({
      geoJson: {
        type: 'FeatureCollection',
        features: []
      },
      name: layer.get('name') || 'Vector Layer',
      opacity: layer.getOpacity(),
      style: {},
      type: 'geojson'
    });
  });

  it('serializes a layer with a Vector source (including features)', () => {
    const layer = new OlLayerVector({
      source: new OlSourceVector({
        features: [
          new OlFeature({
            geometry: new OlGeomPoint([0, 0])
          }),
          new OlFeature({
            geometry: new OlGeomLineString([[0, 0], [1, 1]])
          }),
          new OlFeature({
            geometry: new OlGeomPolygon([[[0, 0], [1, 1], [0, 0]]])
          })
        ]
      })
    });

    const serializedSimple = serializer.serialize(layer);

    expect(serializedSimple).toEqual({
      geoJson: {
        type: 'FeatureCollection',
        features: [{
          type: 'Feature',
          geometry: {
            type: 'Point',
            coordinates: [0, 0]
          },
          properties: {
          }
        }, {
          type: 'Feature',
          geometry: {
            type: 'LineString',
            coordinates: [[0, 0], [1, 1]]
          },
          properties: {
          }
        }, {
          type: 'Feature',
          geometry: {
            type: 'Polygon',
            coordinates: [[[0, 0], [1, 1], [0, 0]]]
          },
          properties: {
          }
        }]
      },
      name: layer.get('name') || 'Vector Layer',
      opacity: layer.getOpacity(),
      style: {},
      type: 'geojson'
    });
  });

  it('accepts additional serializer opts', () => {

  });
});
