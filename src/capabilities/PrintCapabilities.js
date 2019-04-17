/**
 * The PrintCapabilities.
 *
 * @class
 */
export class PrintCapabilities {

  /**
   * The name of the print application.
   *
   * @type {Array}
   * @private
   */
  app = null;

  /**
   * The supported layouts by the print service.
   *
   * @type {Array}
   * @private
   */
  layouts = [];

  /**
   * The supported output formats by the print service.
   *
   * @type {Array}
   * @private
   */
  outputFormats = [];

}

export default PrintCapabilities;
