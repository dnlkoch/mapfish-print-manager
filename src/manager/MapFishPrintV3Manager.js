import get from 'lodash/get';
import {
  getCenter
} from 'ol/extent';

import BaseMapFishPrintManager from './BaseMapFishPrintManager';
import MapFishPrintV3GeoJsonSerializer from '../serializer/MapFishPrintV3GeoJsonSerializer';
import MapFishPrintV3OSMSerializer from '../serializer/MapFishPrintV3OSMSerializer';
import MapFishPrintV3TiledWMSSerializer from '../serializer/MapFishPrintV3TiledWMSSerializer';
import MapFishPrintV3WMSSerializer from '../serializer/MapFishPrintV3WMSSerializer';
import Shared from '../util/Shared';
import Logger from '../util/Logger';
import scales from '../config/scales';

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
   * The layer serializers to use. May be overridden or extented to obtain
   * custom functionality.
   *
   * @type {Array}
   */
  serializers = [
    MapFishPrintV3GeoJsonSerializer,
    MapFishPrintV3OSMSerializer,
    MapFishPrintV3TiledWMSSerializer,
    MapFishPrintV3WMSSerializer,
  ];

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
   * ID of currently started print job. Will be used while polling will be
   * performed.
   *
   * @type {String}
   * @private
   */
  _printJobReference = null;

  /**
   * Default timeout in ms after which print job polling will be canceled.
   *
   * @type {Number}
   */
  timeout = 5000;

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
    if (this.url && !this.capabilities) {
      return this.loadPrintApps()
        .then(printApps => {
          this.setPrintApps(printApps);

          const defaultPrintApp = this.getPrintApps()[0];

          return this.setPrintApp(defaultPrintApp);
        })
        .catch(error => Promise.reject(new Error(`Could not initialize `+
          `the manager: ${error.message}`)));
    } else if (!this.url && this.capabilities) {
      return this.initManager(this.capabilities);
    }
  }

  /**
   *
   * @param {*} capabilities
   */
  initManager(capabilities) {
    this.capabilities = capabilities;

    this._layouts = capabilities.layouts;
    this._outputFormats = capabilities.formats;

    this.setLayout(this.getLayouts()[0].name);
    this.setOutputFormat(this.getOutputFormats()[0]);

    // mapfish3 doesn't provide scales via capabilities, so we get them from
    // initialized manager if set or set some most common used values here
    // manually as fallback
    if (this.customPrintScales) {
      this._scales = this.customPrintScales;
    } else {
      this._scales = scales;
    }
    this.setScale(this.getClosestScaleToFitMap());

    this.initPrintExtentLayer();
    this.initPrintExtentFeature();
    this.initTransformInteraction();

    this._initiated = true;

    return this.isInitiated();
  }

  /**
   * Returns attribute value contained in currently chosen layout by its name.
   *
   * @param {String} attributeName The attribute name (key) to be searched.
   * @param {String} layoutName Name of currently chosen layout.
   *
   * @return {*} Obtained attribute value.
   */
  getAttributeByName(attributeName, layoutName = this.getLayout().name) {
    const layout = this.getLayoutByName(layoutName);
    const layoutAttributes = layout.attributes;

    const attribute = layoutAttributes.find(layoutAttribute => {
      return layoutAttribute.name === attributeName;
    });

    return attribute;
  }

  /**
   * Returns an object containing configuration for layout based on its name
   *
   * @param {String} layoutName Layout name.
   *
   * @return {Object} Layout configuration object.
   */
  getLayoutByName(layoutName) {
    const layouts = this.getLayouts();

    return layouts.find(layout => layout.name === layoutName);
  }

  /**
   * Returns all available print applications.
   *
   * @return {Promise} Promise containing available print apps.
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
      .then(json => Promise.resolve(json))
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
    const capEndpoint = this.constructor.CAPABILITIES_JSON_ENDPOINT;
    const url = `${this.url}${printApp}/${capEndpoint}`;
    return fetch(url, {
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
   *
   * @returns
   */
  print(forceDownload) {
    if (!(this.isInitiated())) {
      Logger.warn('The manager hasn\'t been initiated yet. Please call init() first.');
      return;
    }

    const payload = this.getPrintPayload();

    const createPrintJobUrl = `${this.url}${this.getPrintApp()}/report.${this.getOutputFormat()}`;

    return fetch(createPrintJobUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...this.headers
      },
      credentials: this.credentialsMode,
      body: JSON.stringify(payload)
    })
      .then(response => this.validateResponse(response))
      .then(response => response.json())
      .then(json => {
        const {
          ref,
          statusURL
        } = json;

        // get absolute url of print status and download to ensure we will be
        // redirected correctly while printing
        const matches = this.url.match(/[^/](\/[^/].*)/);
        let baseHost = '';
        if (matches && matches[1]) {
          const idx = this.url.indexOf(matches[1]);
          baseHost = this.url.substring(0, idx);
        }

        this._printJobReference = ref;

        return this.pollUntilDone.call(this, baseHost + statusURL, 1000, this.timeout)
          .then(downloadUrl => {
            this._printJobReference = null;

            if (forceDownload) {
              this.download(baseHost + downloadUrl);
            } else {
              return Promise.resolve(baseHost + downloadUrl);
            }
          })
          .catch(error => {
            this._printJobReference = null;
            Logger.error(error);
          });
      })
      .catch(error => Promise.reject(`Error while creating the print job: ${error.message}`));
  }

  /**
   *
   *
   * @param {*} url
   * @param {*} interval
   * @param {*} timeout
   * @returns
   */
  pollUntilDone(url, interval, timeout) {
    let start = Date.now();

    /**
     *
     */
    function run() {
      return fetch(url, {
        method: 'GET',
        headers: {
          ...this.headers
        },
        credentials: this.credentialsMode
      })
        .then(response => this.validateResponse(response))
        .then(response => response.json())
        .then(json => {
          const status = json.status;

          if (status === 'finished') {
            return Promise.resolve(json.downloadURL);
          } else if (status === 'error') {
            return Promise.reject(new Error(`There was an error executing the job: ${json.error}`));
          } else if (status === 'cancelled') {
            return Promise.reject(new Error('The job was cancelled.'));
          } else if (['waiting', 'running'].includes(status)) {
            if (timeout !== 0 && Date.now() - start > timeout) {
              return Promise.reject(new Error('timeout error on pollUntilDone'));
            } else {
              return new Promise(resolve => {
                setTimeout(resolve, interval);
              }).then(run.bind(this));
            }
          }
        });
    }

    return run.call(this);
  }

  /**
   * Cancels current print job by id.
   *
   * @param {String} id Print id to cancel.
   *
   * @return {Promise}
   *
   */
  cancelPrint(id) {
    if (!id) {
      return;
    }
    const cancelPrintJobUrl = `${this.url}cancel/${id}`;

    return fetch(cancelPrintJobUrl, {
      method: 'DELETE',
      headers: {
        ...this.headers
      },
      credentials: this.credentialsMode
    })
      .then(response => this.validateResponse(response))
      .then(() => Promise.resolve())
      .catch(() => Promise.reject());
  }

  /**
   * Collects the payload that is required for the print call to the print
   * servlet.
   *
   * @return {Object} The print payload.
   */
  getPrintPayload() {
    const mapView = this.map.getView();
    const mapProjection = mapView.getProjection();
    const mapLayers = Shared.getMapLayers(this.map);
    const extentFeatureGeometry = this._extentFeature.getGeometry();

    const serializedLayers = mapLayers
      .filter(this.filterPrintableLayer.bind(this))
      .reduce((acc, layer) => {
        const serializedLayer = this.serializeLayer(layer);
        if (serializedLayer) {
          acc.push(serializedLayer);
        }
        return acc;
      }, []);

    const serializedLegends = mapLayers
      .filter(this.filterPrintableLegend.bind(this))
      .reduce((acc, layer) => {
        const serializedLegend = this.serializeLegend(layer);
        if (serializedLegend) {
          acc.push(serializedLegend);
        }
        return acc;
      }, []);

    const payload = {
      layout: this.getLayout().name,
      attributes: {
        map: {
          center: getCenter(extentFeatureGeometry.getExtent()),
          dpi: this.getDpi(),
          layers: serializedLayers,
          projection: mapProjection.getCode(),
          rotation: this.calculateRotation() || 0,
          scale: this.getScale()
          // TODO Add support for customizable map attribute params,
          // e.g. zoomToFeatures, see http://mapfish.github.io/mapfish-print-doc/attributes.html#!map
        },
        legend: {
          classes: serializedLegends
        },
        ...this.customParams
      }
    };
    return payload;
  }

  /**
   * Returns all supported print applications.
   *
   * @return {Array} The supported print applications.
   */
  getPrintApps() {
    return this._printApps;
  }

  /**
   * Sets the supported print applications.
   *
   * @param {Array} printApps The supported print applications to set.
   */
  setPrintApps(printApps) {
    this._printApps = printApps;
  }

  /**
   * Returns the currently selected print application.
   *
   * @return {String} The currently selected print application.
   */
  getPrintApp() {
    return this._printApp;
  }

  /**
   * Sets the layout to use. Updates the print extent accordingly.
   *
   * @param {String} name The name of the layout to use.
   */
  setLayout(name) {
    const layout = this.getLayouts().find(layout => layout.name === name);

    if (!layout) {
      Logger.warn(`No layout named '${name}' found.`);
      return;
    }

    this._layout = layout;

    const mapAttribute = this.getAttributeByName('map');

    this._dpis = get(mapAttribute, 'clientInfo.dpiSuggestions');
    // set some defaults if not provided via capabilities
    if (!this._dpis) {
      this._dpis = [72, 150];
    }
    this.setDpi(this.getDpis()[0]);

    this.setPrintMapSize({
      width: get(mapAttribute, 'clientInfo.width'),
      height: get(mapAttribute, 'clientInfo.height')
    });

    this.updatePrintExtent();

    this.dispatch('change:layout', layout);
  }

  /**
   * Sets the print application to use.
   * For each print app the appropriate capabilities will be load and the
   * manager will be initialized afterwards.
   *
   * @param {String} printAppName The name of the application to use.
   */
  setPrintApp = printAppName => {
    const printApp = this.getPrintApps().find(pa => pa === printAppName);

    if (!printApp) {
      Logger.warn(`No print application named '${printAppName}' found.`);
      return;
    }

    this._printApp = printApp;

    this.dispatch('change:app', printApp);

    // reinit print manager with capabilities from set app
    return this.loadAppCapabilities(printApp)
      .then(printCapabilities => {
        this.initManager(printCapabilities);
        return Promise.resolve(true);
      })
      .catch(error => Promise.reject(new Error(`${error.message}`)));
  }

  /**
   * Sets the dpi to use.
   *
   * @param {number|string} value The value of the dpi to use.
   */
  setDpi = value => {
    value = parseFloat(value);

    const dpi = this.getDpis().find(dpi => dpi === value);

    if (!dpi) {
      Logger.warn(`No dpi '${value}' found.`);
      return;
    }

    this._dpi = dpi;

    this.dispatch('change:dpi', dpi);
  }
}

export default MapFishPrintV3Manager;
