import OlSourceImageWMS from 'ol/source/ImageWMS';
import OlSourceTileWMS from 'ol/source/TileWMS';

import BaseSerializer from './BaseSerializer';

/**
 * The MapFishPrintV2WMSSerializer.
 *
 * @class
 */
export class MapFishPrintV2WMSSerializer extends BaseSerializer {

  /**
   * The WMS layer type identificator.
   *
   * @type {String}
   */
  static TYPE_WMS = 'WMS';

  /**
   * The ol sources this serializer is capable of serializing.
   *
   * @type {Array}
   */
  static sourceCls = [
    OlSourceImageWMS,
    OlSourceTileWMS
  ];

  /**
   * The constructor
   */
  constructor() {
    super(arguments);
  }

  /**
   * Serializes/Encodes the given layer.
   *
   * @param {ol.layer.Layer} layer The layer to serialize/encode.
   * @return {Object} The serialized/encoded layer.
   */
  serialize(layer) {
    const source = layer.getSource();

    if (!this.validateSource(source)) {
      return;
    }

    const layers = source.getParams().LAYERS;
    const layersArray = layers ? layers.split(',') : [''];
    const styles = source.getParams().STYLES;
    const stylesArray = styles ? styles.split(',') : [''];

    const {
      LAYERS,
      STYLES,
      VERSION,
      WIDTH,
      HEIGHT,
      FORMAT,
      BBOX,
      CRS,
      SRS,
      ...customParams
    } = source.getParams();

    const serialized = {
      ...super.serialize(layer, source),
      ...{
        baseURL: source instanceof OlSourceImageWMS ? source.getUrl() : source.getUrls()[0],
        customParams: customParams,
        format: source.getParams().FORMAT || 'image/png',
        layers: layersArray,
        opacity: layer.getOpacity(),
        singleTile: source instanceof OlSourceImageWMS,
        styles: stylesArray,
        type: this.constructor.TYPE_WMS
      }
    };

    return serialized;
  }
}

export default MapFishPrintV2WMSSerializer;
