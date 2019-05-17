/*eslint-env jest*/
import OlMap from 'ol/Map';
import OlView from 'ol/View';
import OlInteractionDragRotateAndZoom from 'ol/interaction/DragRotateAndZoom';
import OlLayerVector from 'ol/layer/Vector';
import OlLayerImage from 'ol/layer/Image';
import OlLayerTile from 'ol/layer/Tile';
import OlSourceImageWMS from 'ol/source/ImageWMS';
import OlSourceTileWMS from 'ol/source/TileWMS';
import OlSourceVector from 'ol/source/Vector';

import { Shared } from '../../src/util/Shared';

describe('Shared', () => {
  let map;

  beforeEach(() => {
    map = new OlMap({
      layers: [
        new OlLayerVector({
          source: new OlSourceVector()
        })
      ],
      view: new OlView({
        center: [0, 0],
        zoom: 10
      })
    });
  });

  describe('#getInteractionsByName', () => {
    it('is defined', () => {
      expect(Shared.getInteractionsByName).toBeDefined();
    });

    it('returns the requested interactions by name', () => {
      const dragInteractionName = 'Drag Queen';
      const dragInteraction = new OlInteractionDragRotateAndZoom();
      dragInteraction.set('name', dragInteractionName);
      map.addInteraction(dragInteraction);

      let returnedInteractions = Shared.getInteractionsByName(
        map, dragInteractionName);

      expect(returnedInteractions).toHaveLength(1);

      const anotherDragInteraction = new OlInteractionDragRotateAndZoom();
      anotherDragInteraction.set('name', dragInteractionName);
      map.addInteraction(anotherDragInteraction);

      returnedInteractions = Shared.getInteractionsByName(
        map, dragInteractionName);

      expect(returnedInteractions).toHaveLength(2);
    });

    it('returns an empty array if no interaction candidates could be found', () => {
      const dragInteractionName = 'Drag Queen';
      const dragInteraction = new OlInteractionDragRotateAndZoom();
      dragInteraction.set('name', dragInteractionName);
      map.addInteraction(dragInteraction);

      const returnedInteractions = Shared.getInteractionsByName(
        map, `${dragInteractionName} NOT AVAILABLE`);

      expect(returnedInteractions).toHaveLength(0);
    });
  });

  describe('#getLayersByName', () => {
    it('is defined', () => {
      expect(Shared.getLayersByName).toBeDefined();
    });

    it('returns an empty array if no layer candidates could be found', () => {
      const layerName = 'Peter';
      const layer = new OlLayerVector({
        name: layerName
      });
      map.addLayer(layer);
      const got = Shared.getLayersByName(map, layerName);

      expect(got).toHaveLength(1);
      expect(got[0]).toBe(layer);
    });

    it('returns undefined if the layer could not be found', () => {
      const layerName = 'OSM-WMS';
      const got = Shared.getLayersByName(map, layerName);

      expect(got).toHaveLength(0);
    });
  });

  describe('#getLegendGraphicUrl', () => {
    it('is defined', () => {
      expect(Shared.getLegendGraphicUrl).toBeDefined();
    });

    it('returns a valid GetLegendGraphic url for the given (ol.layer.Image and ol.layer.Tile) layer', () => {
      const expected = 'http://bvb.de/maps?LAYER=SHINJI%3AKAGAWA&VERSION=1.3.0&SERVICE=WMS&REQUEST=GetLegendGraphic&FORMAT=image%2Fpng';

      const imageLayer = new OlLayerImage({
        source: new OlSourceImageWMS({
          url: 'http://bvb.de/maps',
          params: {
            LAYERS: 'SHINJI:KAGAWA'
          }
        })
      });

      expect(Shared.getLegendGraphicUrl(imageLayer)).toEqual(expected);

      const tileLayer = new OlLayerTile({
        source: new OlSourceTileWMS({
          url: 'http://bvb.de/maps',
          params: {
            LAYERS: 'SHINJI:KAGAWA'
          }
        })
      });

      expect(Shared.getLegendGraphicUrl(tileLayer)).toEqual(expected);

      const vectorLayer = new OlLayerVector({
        source: new OlSourceVector()
      });

      expect(Shared.getLegendGraphicUrl(vectorLayer)).toEqual(undefined);
    });

    it('handles the given request parameters correctly', () => {
      const expected = 'http://bvb.de/maps?LAYER=SHINJI%3AKAGAWA&VERSION=1.1.0&SERVICE=WMS&REQUEST=GetLegendGraphic&FORMAT=image%2Fjpg&LANGUAGE=DE';

      const layer = new OlLayerTile({
        source: new OlSourceTileWMS({
          url: 'http://bvb.de/maps',
          params: {
            // Override the default version 1.3.0.
            VERSION: '1.1.0',
            // Override the default format.
            FORMAT: 'image/jpg',
            // GetLegendGraphic supports a single layer only. Ignore any other.
            LAYERS: 'SHINJI:KAGAWA,PETER:STOEGER',
            // Additional non-default parameter.
            LANGUAGE: 'DE'
          }
        })
      });

      expect(Shared.getLegendGraphicUrl(layer)).toEqual(expected);
    });

    it('adds custom print parameters (customPrintLegendParams) to the url if available', () => {
      const expected = 'http://bvb.de/maps?LAYER=SHINJI%3AKAGAWA&VERSION=1.3.0&SERVICE=WMS&REQUEST=GetLegendGraphic&FORMAT=image%2Fpng&SCALE=5000';

      const layer = new OlLayerTile({
        source: new OlSourceTileWMS({
          url: 'http://bvb.de/maps',
          params: {
            LAYERS: 'SHINJI:KAGAWA'
          }
        }),
        customPrintLegendParams: {
          SCALE: 5000
        }
      });

      expect(Shared.getLegendGraphicUrl(layer)).toEqual(expected);
    });
  });

  describe('#getScaleForResolution', () => {
    it('is defined', () => {
      expect(Shared.getScaleForResolution).toBeDefined();
    });

    it('calculates the appropriate scale for a given resolution', () => {
      expect(Shared.getScaleForResolution(100, 'm')).toEqual(357142.1428571427);
      expect(Shared.getScaleForResolution(100, 'degrees')).toEqual(39712375676.76163);
    });
  });
});
