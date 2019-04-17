import OlSourceTileWMS from 'ol/source/TileWMS';

import defaultsDeep from 'lodash/defaultsDeep';

import MapFishPrintV3WMSSerializer from './MapFishPrintV3WMSSerializer';

/**
 * The MapFishPrintV3TiledWMSSerializer.
 *
 * @class
 */
export class MapFishPrintV3TiledWMSSerializer extends MapFishPrintV3WMSSerializer {

  /**
   * The WMS layer type identificator.
   *
   * @type {String}
   */
  static TYPE_WMS = 'tiledwms';

  /**
   * The ol sources this serializer is capable of serializing.
   *
   * @type {Array}
   */
  static sourceCls = [
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
   * @param {Object} opts Additional properties to pass to the serialized
   *   layer object that can't be obtained by the layer itself. It can also be
   *   used to override all generated layer values, e.g. the image format.
   * @return {Object} The serialized/encoded layer.
   */
  serialize(layer, opts = {}) {
    defaultsDeep(opts, {
      tileSize: [512, 512]
    });

    const source = layer.getSource();

    if (!this.validateSource(source)) {
      return;
    }

    const serialized = {
      ...super.serialize(layer, opts),
      ...{
        type: this.constructor.TYPE_WMS
      },
      ...opts
    };

    return serialized;
  }
}

export default MapFishPrintV3TiledWMSSerializer;
