import BaseMapFishPrintManager from './BaseMapFishPrintManager';

/**
 * The MapFishPrintV3Manager.
 *
 * @class
 */
export class MapFishPrintV3Manager extends BaseMapFishPrintManager {

  /**
   * The capabilities endpoint of the print service.
   *
   * @type {String}
   */
  static APPS_JSON_ENDPOINT = 'apps.json';

  /**
   * The capabilities endpoint of the print service.
   *
   * @type {String}
   */
  static CAPABILITIES_JSON_ENDPOINT = 'capabilities.json';

  /**
   * The supported print applications by the print service.
   *
   * @type {Array}
   * @private
   */
  _printApps = [];

  /**
   * The currently selected print application.
   *
   * @type {Object}
   * @private
   */
  _printApp = {};

  /**
   * The constructor
   */
  constructor() {
    super(arguments);
  }

  /**
   * Initializes the manager.
   *
   * @return {Promise}
   */
  init() {
    return this.loadPrintApps()
      .then(printApps => {
        const printApp = this.getPrintApps()[0];
        return this.loadAppCapabilities(printApp);
      })
      .then(json => Promise.resolve(this.initManager(json))
      .catch(error => Promise.reject(new Error(`${error.message}`))));

    // .then(json => Promise.resolve(this.initManager(json)))
    //   .catch(error => Promise.reject(new Error(`Could not initialize `+
    //     `the manager: ${error.message}`)));
  }

  /**
   * Returns all available print applications.
   *
   * @private
   */
  loadPrintApps() {
    return fetch(`${this.url}${this.constructor.APPS_JSON_ENDPOINT}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...this.headers
      },
      credentials: this.credentialsMode
    })
      .then(response => this.validateResponse(response))
      .then(response => response.json())
      .then(json => {
        this._printApps = json;
        this.setPrintApp(this.getPrintApps()[0]);
        return Promise.resolve(json);
      })
      .catch(error => Promise.reject(new Error(`Error while fetching the ` +
        `print apps: ${error.message}`))
      );
  }

  /**
   * Loads the print capabilities from the provided remote source.
   *
   * @return {Promise}
   */
  loadAppCapabilities(printApp) {
    return fetch(`${this.url}${printApp}/${this.constructor.CAPABILITIES_JSON_ENDPOINT}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...this.headers
      },
      credentials: this.credentialsMode
    })
      .then(response => this.validateResponse(response))
      .then(response => response.json())
      .then(json => Promise.resolve(json))
      .catch(error => Promise.reject(new Error(`Error while fetching the ` +
        `print capabilities: ${error.message}`))
      );
  }

  /**
   * Returns all supported print applications.
   *
   * @return {Array} The supported print applications.
   */
  getPrintApps() {
    return this._printApps;
  };

  /**
   * Returns the currently selected print application.
   *
   * @return {String} The currently selected print application.
   */
  getPrintApp() {
    return this._printApp;
  }

  /**
   * Sets the print application to use.
   *
   * @param {String} printAppName The name of the application to use.
   */
  setPrintApp(printAppName) {
    const printApp = this.getPrintApps().find(pa => {
      return pa === printAppName;
    });

    if (!printApp) {
      // TODO Import Log
      Log.warn(`No print application named '${printAppName}' found.`);
      return;
    }

    this._printApp = printApp;

    this.dispatch('change:app', printApp);

    // TODO Reload print cabilities
    // return this.loadAppCapabilities(printApp)
    //   .then(json => Promise.resolve(json))
    //   .catch(error => Promise.reject(new Error(`${error.message}`))
    //   );
  }
}

export default MapFishPrintV3Manager;
