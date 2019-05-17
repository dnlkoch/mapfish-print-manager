import OlSourceImageWMS from 'ol/source/ImageWMS';

import defaultsDeep from 'lodash/defaultsDeep';

import BaseSerializer from './BaseSerializer';

/**
 * The MapFishPrintV3WMSSerializer.
 *
 * @class
 */
export class MapFishPrintV3WMSSerializer extends BaseSerializer {

  /**
   * The WMS layer type identificator.
   *
   * @type {String}
   */
  static TYPE_WMS = 'wms';

  /**
   * The ol sources this serializer is capable of serializing.
   *
   * @type {Array}
   */
  static sourceCls = [
    OlSourceImageWMS
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
   * @param {Object} opts Additional properties to pass to the serialized
   *   layer object that can't be obtained by the layer itself. It can also be
   *   used to override all generated layer values, e.g. the image format.
   * @return {Object} The serialized/encoded layer.
   */
  serialize(layer, opts = {}) {
    defaultsDeep(opts, {
      failOnError: false,
      mergeableParams: [],
      method: 'GET',
      rasterStyle: undefined,
      // One of MAPSERVER, GEOSERVER, QGISSERVER
      serverType: undefined,
      useNativeAngle: false
    });

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
      ...super.serialize(layer, opts),
      ...{
        baseURL: source instanceof OlSourceImageWMS ? source.getUrl() : source.getUrls()[0],
        customParams,
        imageFormat: source.getParams().FORMAT || 'image/png',
        layers: layersArray,
        name: layer.get('name'),
        opacity: layer.getOpacity(),
        styles: stylesArray,
        version: source.getParams().VERSION || '1.1.0',
        type: this.constructor.TYPE_WMS
      },
      ...opts
    };

    return serialized;
  }
}

export default MapFishPrintV3WMSSerializer;
