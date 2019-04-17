import get from 'lodash/get';
import {
  getCenter
} from 'ol/extent';

import BaseMapFishPrintManager from './BaseMapFishPrintManager';
import PrintCapabilities from '../capabilities/PrintCapabilities';
import MapFishPrintV3GeoJsonSerializer from '../serializer/MapFishPrintV3GeoJsonSerializer';
import MapFishPrintV3OSMSerializer from '../serializer/MapFishPrintV3OSMSerializer';
import MapFishPrintV3TiledWMSSerializer from '../serializer/MapFishPrintV3TiledWMSSerializer';
import MapFishPrintV3WMSSerializer from '../serializer/MapFishPrintV3WMSSerializer';
import Shared from '../util/Shared';
import Logger from '../util/Logger';

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
        this.setPrintApps(printApps);

        const defaultPrintApp = this.getPrintApps()[0];

        return this.setPrintApp(defaultPrintApp);
      })
      .catch(error => Promise.reject(new Error(`Could not initialize `+
        `the manager: ${error.message}`)));
  }

  /**
   *
   * @param {*} capabilities
   */
  parseCapabilities(capabilities) {
    const printCapabilities = new PrintCapabilities();

    print.app = capabilities.name;
    print.layouts = capabilities.layouts;
    print.outputFormats = capabilities.formats;

    return printCapabilities;
  }

  /**
   *
   * @param {*} capabilities
   */
  initManager(capabilities) {
    this.capabilities = capabilities;

    //const printCapabilities = this.parseCapabilities(capabilities);

    this._layouts = capabilities.layouts;
    this._outputFormats = capabilities.formats;

    // TODO Error handling if not found
    this.setLayout(this.getLayouts()[0].name);
    this.setOutputFormat(this.getOutputFormats()[0]);

    // const mapAttribute = this.getAttributeByName('map');

    // // TODO some defaults if not given
    // this._dpis = get(mapAttribute, 'clientInfo.dpiSuggestions');
    // this.setDpi(this.getDpis()[0]);

    // this.setPrintMapSize({
    //   width: get(mapAttribute, 'clientInfo.width'),
    //   height: get(mapAttribute, 'clientInfo.height')
    // });

    // TODO Get from print capabilities if defined.
    this._scales = [1000, 5000, 50000, 100000];
    this.setScale(this.getClosestScaleToFitMap());

    this.initPrintExtentLayer();
    this.initPrintExtentFeature();
    this.initTransformInteraction();

    this._initiated = true;
  }

  /**
   * TODO
   *
   * @param {*} attributeName
   * @param {*} [layoutName=this.getLayout().name]
   * @returns
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
   * TODO
   *
   * @param {*} layoutName
   * @return {Object}
   */
  getLayoutByName(layoutName) {
    const layouts = this.getLayouts();

    return layouts.find(layout => layout.name === layoutName);
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

        // TODO docuemnt
        this.printJobReference = ref;

        return this.pollUntilDone.call(this, statusURL, 1000, 5 * 1000)
          .then(downloadUrl => {
            this.printJobReference = null;

            if (forceDownload) {
              this.download(downloadUrl);
            } else {
              return Promise.resolve(downloadUrl);
            }
          })
          .catch(error => {
            this.printJobReference = null;
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
              // TODO check if this is working as expected
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
   * TODO
   *
   * Absolutely untested
   */
  cancelPrint(id) {
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
          // TODO Rotation seems to be off
          rotation: this.calculateRotation() || 0,
          scale: this.getScale()
          // TODO Add support for customizable map attribute params,
          // e.g. zoomToFeatures, see http://mapfish.github.io/mapfish-print-doc/attributes.html#!map
        }
        // "scalebar": {
        //     "projection": "EPSG:21781"
        // },
        // "title": "Sample Print"
      }
    };

    // const payload = {
    //   units: mapProjection.getUnits(),
    //   srs: mapProjection.getCode(),
    //   layout: this.getLayout().name,
    //   outputFormat: this.getOutputFormat().name,
    //   dpi: this.getDpi().value,
    //   layers: serializedLayers,
    //   pages: [{
    //     center: getCenter(extentFeatureGeometry.getExtent()),
    //     scale: this.getScale().value,
    //     rotation: this.calculateRotation() || 0
    //   }],
    //   legends: serializedLegends,
    //   ...this.customParams
    // };

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

    // TODO some defaults if not given
    this._dpis = get(mapAttribute, 'clientInfo.dpiSuggestions');
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
   *
   * @param {String} printAppName The name of the application to use.
   */
  setPrintApp(printAppName) {
    const printApp = this.getPrintApps().find(pa => pa === printAppName);

    if (!printApp) {
      Logger.warn(`No print application named '${printAppName}' found.`);
      return;
    }

    this._printApp = printApp;

    this.dispatch('change:app', printApp);

    // TODO Document this
    // TODO Implement cache for app capabilities, should be configurable (default = true)
    return this.loadAppCapabilities(printApp)
      .then(printCapabilities => {
        this.initManager(printCapabilities);
        return Promise.resolve(true);
      })
      .catch(error => Promise.reject(new Error(`${error.message}`)));
  }
}

export default MapFishPrintV3Manager;
