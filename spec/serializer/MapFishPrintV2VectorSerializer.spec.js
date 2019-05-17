/*eslint-env jest*/
import OlLayerVector from 'ol/layer/Vector';
import OlLayerTile from 'ol/layer/Tile';
import OlSourceVector from 'ol/source/Vector';
import OlSourceOSM from 'ol/source/OSM';
import OlStyleStyle from 'ol/style/Style';
import OlStyleCircle from 'ol/style/Circle';
import OlStyleText from 'ol/style/Text';
import OlStyleStroke from 'ol/style/Stroke';
import OlStyleFill from 'ol/style/Fill';
import OlFeature from 'ol/Feature';
import OlGeomPoint from 'ol/geom/Point';
import OlGeomLineString from 'ol/geom/LineString';
import OlGeomPolygon from 'ol/geom/Polygon';

import { MapFishPrintV2VectorSerializer } from '../../src/serializer/MapFishPrintV2VectorSerializer';

describe('MapFishPrintV2VectorSerializer', () => {
  let serializer;
  // const featureCollection = {
  //   type: 'FeatureCollection',
  //   features: [{
  //     type: 'Feature',
  //     geometry: {
  //       type: 'GeometryCollection',
  //       geometries: []
  //     },
  //     properties: null
  //   }, {
  //     type: 'Feature',
  //     geometry: {
  //       type: 'LineString',
  //       coordinates: [
  //         [829441.483329503, 6708996.211118049],
  //         [829451.0379580386, 6708925.745732599],
  //         [829485.6734864804, 6708956.798275339],
  //         [829447.4549723378, 6708967.547232443],
  //         [829485.6734864804, 6708986.656489514],
  //         [829439.0946723691, 6708998.599775183]
  //       ]
  //     },
  //     properties: null
  //   }, {
  //     type: 'Feature',
  //     geometry: {
  //       type: 'LineString',
  //       coordinates: [
  //         [829496.422443583, 6709002.182760884],
  //         [829525.08632919, 6708930.523046866],
  //         [829543.0012576942, 6709003.377089451]
  //       ]
  //     },
  //     properties: null
  //   }, {
  //     type: 'Feature',
  //     geometry: {
  //       type: 'LineString',
  //       coordinates: [
  //         [829564.4991718995, 6709005.765746585],
  //         [829572.8594718681, 6708942.466332536],
  //         [829600.3290289082, 6708971.130218143],
  //         [829570.4708147342, 6708979.490518112],
  //         [829603.912014609, 6709004.571418018],
  //         [829563.3048433325, 6709006.960075151]
  //       ]
  //     },
  //     properties: null
  //   }, {
  //     type: 'Feature',
  //     geometry: {
  //       type: 'Point',
  //       coordinates: [829410.4307867622, 6709027.2636607895]
  //     },
  //     properties: null
  //   }, {
  //     type: 'Feature',
  //     geometry: {
  //       type: 'Point',
  //       coordinates: [829617.0496288455, 6709058.316203531]
  //     },
  //     properties: null
  //   }, {
  //     type: 'Feature',
  //     geometry: {
  //       type: 'Point',
  //       coordinates: [829441.483329503, 6708733.458833319]
  //     },
  //     properties: null
  //   }, {
  //     type: 'Feature',
  //     geometry: {
  //       type: 'Point',
  //       coordinates: [829666.0171000907, 6708754.9567475235]
  //     },
  //     properties: null
  //   }, {
  //     type: 'Feature',
  //     geometry: {
  //       type: 'Polygon',
  //       coordinates: [
  //         [
  //           [829437.9003438022, 6708897.081846992],
  //           [829628.9929145151, 6708925.745732599],
  //           [829632.3676430384, 6708903.0225605415],
  //           [829646.9078430195, 6708805.118547336],
  //           [829453.4266151725, 6708777.648990296],
  //           [829437.9003438022, 6708897.081846992]
  //         ]
  //       ]
  //     },
  //     properties: null
  //   }, {
  //     type: 'Feature',
  //     geometry: {
  //       type: 'GeometryCollection',
  //       geometries: []
  //     },
  //     properties: null
  //   }]
  // };

  beforeEach(() => {
    serializer = new MapFishPrintV2VectorSerializer();
  });

  it('is defined', () => {
    expect(MapFishPrintV2VectorSerializer).not.toBeUndefined();
  });

  it('checks if the given layer can be serialized with it', () => {
    const layer = new OlLayerTile({
      source: new OlSourceOSM()
    });

    const serialized = serializer.serialize(layer);

    expect(serialized).toBeUndefined();
  });

  // TODO add test for labeled geometry
  it('serializes a layer with an Vector source', () => {
    const style = new OlStyleStyle({
      image: new OlStyleCircle({
        radius: 5,
        fill: new OlStyleFill({
          color: 'black'
        }),
        stroke: new OlStyleStroke({
          color: 'gray'
        })
      }),
      fill: new OlStyleFill({
        color: 'rgba(255, 255, 255, 0.6)'
      }),
      stroke: new OlStyleStroke({
        color: '#319FD3',
        width: 1
      }),
      text: new OlStyleText({
        font: '12px Calibri,sans-serif',
        fill: new OlStyleFill({
          color: '#000'
        }),
        stroke: new OlStyleStroke({
          color: '#fff',
          width: 3
        })
      })
    });
    const pointFeature1 = new OlFeature({
      geometry: new OlGeomPoint(
        [829410.4307867622, 6709027.2636607895]
      ),
    });
    const pointFeature2 = new OlFeature({
      geometry: new OlGeomPoint(
        [829499.4307867622, 6709097.2636607895]
      ),
    });
    const lineFeature = new OlFeature({
      geometry: new OlGeomLineString([
        [829496.422443583, 6709002.182760884],
        [829525.08632919, 6708930.523046866],
        [829543.0012576942, 6709003.377089451]
      ])
    });
    const polygonFeature = new OlFeature({
      geometry: new OlGeomPolygon([[
        [829437.9003438022, 6708897.081846992],
        [829628.9929145151, 6708925.745732599],
        [829632.3676430384, 6708903.0225605415],
        [829646.9078430195, 6708805.118547336],
        [829453.4266151725, 6708777.648990296],
        [829437.9003438022, 6708897.081846992]
      ]])
    });
    const source = new OlSourceVector({
      features: [
        pointFeature1,
        pointFeature2,
        lineFeature,
        polygonFeature
      ]
    });
    const layerName = 'Vector Layer';
    const layer = new OlLayerVector({
      source: source,
      style: style,
      name: layerName
    });

    const serialized = serializer.serialize(layer, 1909);

    expect(serialized).toEqual({
      type: 'Vector',
      styles: {
        // Point
        0: {
          strokeColor: '#808080',
          strokeOpacity: 1,
          fillColor: '#000000',
          fillOpacity: 1,
          pointRadius: 5,
          rotation: 0,
          graphicName: 'circle'
        },
        // LineString
        1: {
          strokeColor: '#319fd3',
          strokeOpacity: 1,
          strokeWidth: 1
        },
        // Polygon
        2: {
          strokeColor: '#319fd3',
          strokeOpacity: 1,
          strokeWidth: 1,
          fillColor: '#ffffff',
          fillOpacity: 0.6
        }
      },
      styleProperty: '_style',
      geoJson: {
        type: 'FeatureCollection',
        features: [{
          type: 'Feature',
          properties: {
            _style: 0
          },
          geometry: {
            type: 'Point',
            coordinates: pointFeature1.getGeometry().getCoordinates()
          }
        }, {
          type: 'Feature',
          properties: {
            _style: 0
          },
          geometry: {
            type: 'Point',
            coordinates: pointFeature2.getGeometry().getCoordinates()
          }
        }, {
          type: 'Feature',
          properties: {
            _style: 1
          },
          geometry: {
            type: 'LineString',
            coordinates: lineFeature.getGeometry().getCoordinates()
          }
        }, {
          type: 'Feature',
          properties: {
            _style: 2
          },
          geometry: {
            type: 'Polygon',
            coordinates: polygonFeature.getGeometry().getCoordinates()
          }
        }]
      },
      name: layerName,
      opacity: 1
    });
  });

});
