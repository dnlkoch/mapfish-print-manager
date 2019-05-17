import Shared from '../util/Shared';
import Log from '../util/Logger';

/**
 * The BaseSerializer.
 *
 * @class
 */
export class BaseSerializer {

  /**
   * The ol sources this serializer is capable of serializing.
   *
   * @type {Array}
   */
  static sourceCls = [];

  /**
   * Serializes/Encodes the given layer.
   *
   * @param {ol.layer.Layer} layer The layer to serialize/encode.
   * @return {Object} The serialized/encoded layer.
   */
  serialize(layer) {
    const serialized = {};
    const source = layer.getSource();
    const units = source.getProjection() ?
      source.getProjection().getUnits() :
      'm';

    if (layer.getMinResolution() > 0) {
      serialized.minScaleDenominator = Shared.getScaleForResolution(
        layer.getMinResolution(), units);
    }
    if (layer.getMaxResolution() !== Infinity) {
      serialized.maxScaleDenominator = Shared.getScaleForResolution(
        layer.getMaxResolution(), units);
    }

    return serialized;
  }

  /**
   * Validates if the given ol source is compatible with the serializer. Usally
   * called by subclasses.
   *
   * @param {ol.source.Source} source The source to validate.
   * @return {Boolean} Whether it is a valid source or not.
   */
  validateSource = source => {
    const isValidSource = this.constructor.sourceCls.some(cls => {
      return (source instanceof cls);
    });

    if (!isValidSource) {
      Log.warn('Cannot serialize the given source with this serializer');
    }

    return isValidSource;
  }
}

export default BaseSerializer;
