import OlLayerGroup from 'ol/layer/Group';
import OlSourceTileWMS from 'ol/source/TileWMS';
import OlSourceImageWMS from 'ol/source/ImageWMS';
import { METERS_PER_UNIT } from 'ol/proj/Units';

/**
 * Some shared static utility methods.
 *
 * @class
 */
export class Shared {

  /**
   * Returns all map interactions with the given name.
   *
   * @param {ol.Map} map The map to get the interactions from.
   * @param {String} name The name to filter with.
   * @return {Array} The matching candidates.
   */
  static getInteractionsByName = (map, name) => {
    const interactions = map.getInteractions().getArray();
    return interactions.filter(interaction => interaction.get('name') === name);
  }

  /**
   * Returns all map layers with the given name.
   *
   * @param {ol.Map} map The map to get the layers from.
   * @param {String} name The name to filter with.
   * @return {Array} The matching candidates.
   */
  static getLayersByName = (map, name) => {
    const layers = Shared.getMapLayers(map);
    return layers.filter(layer => layer.get('name') === name);
  }

  /**
   * Returns all layers from the given map.
   *
   * @param {ol.Map|ol.layer.Group} collection The map or layergroup to get the
   *                                           layers from.
   * @return {Array} The layers.
   */
  static getMapLayers = collection => {
    const layers = collection.getLayers().getArray();
    const mapLayers = [];

    layers.forEach(layer => {
      if (layer instanceof OlLayerGroup) {
        Shared.getMapLayers(layer).forEach(l => {
          mapLayers.push(l);
        });
      }
      mapLayers.push(layer);
    });

    return mapLayers;
  }

  /**
   * Generates the GetLegendGraphic url for the given layer.
   *
   * @param {ol.layer.Layer} layer The layer to generate the GetLegendGraphic for.
   * @return {String} The GetLegendGraphic url.
   */
  static getLegendGraphicUrl = layer => {
    if (layer.getSource() instanceof OlSourceTileWMS ||
      layer.getSource() instanceof OlSourceImageWMS) {
      const customParams = layer.get('customPrintLegendParams');
      const source = layer.getSource();
      const {
        LAYERS,
        VERSION,
        FORMAT,
        ...passThroughParams
      } = source.getParams();
      const url = source instanceof OlSourceImageWMS ?
        source.getUrl() :
        source.getUrls()[0];
      const params = {
        LAYER: LAYERS.split(',')[0],
        VERSION: VERSION || '1.3.0',
        SERVICE: 'WMS',
        REQUEST: 'GetLegendGraphic',
        FORMAT: FORMAT || 'image/png',
        ...customParams,
        ...passThroughParams
      };
      const queryParams = Object.keys(params).map(key => {
        return `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`;
      }).join('&');

      return `${url}?${queryParams}`;
    }
  }

  /**
   * Returns the appropriate scale for the given resolution and units.
   *
   * @param {Number} resolution The resolution to calculate the scale for.
   * @param {String} units The units the resolution is based on, typically
   *                       either 'm' or 'degrees'.
   * @return {Number} The appropriate scale.
   */
  static getScaleForResolution = (resolution, units) => {
    const dpi = 25.4 / 0.28;
    const mpu = METERS_PER_UNIT[units];
    const inchesPerMeter = 39.37;

    return parseFloat(resolution) * mpu * inchesPerMeter * dpi;
  }
}

export default Shared;
