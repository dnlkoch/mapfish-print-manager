import { getCenter } from 'ol/extent';
import OlSourceTileWMS from 'ol/source/TileWMS';
import OlSourceImageWMS from 'ol/source/ImageWMS';

import BaseMapFishPrintManager from './BaseMapFishPrintManager';
import MapFishPrintV2WMSSerializer from '../serializer/MapFishPrintV2WMSSerializer';
import MapFishPrintV2VectorSerializer from '../serializer/MapFishPrintV2VectorSerializer';
import Shared from '../util/Shared';
import Log from '../util/Logger';

/**
 * The MapFishPrintV2Manager.
 *
 * @class
 */
export class MapFishPrintV2Manager extends BaseMapFishPrintManager {

  /**
   * The capabilities endpoint of the print service.
   *
   * @type {String}
   */
  static INFO_JSON_ENDPOINT = 'info.json';

  /**
   * The layer serializers to use. May be overridden or extented to obtain
   * custom functionality.
   *
   * @type {Array}
   */
  serializers = [MapFishPrintV2WMSSerializer, MapFishPrintV2VectorSerializer];

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
    if (!this.url && this.capabilities) {
      return this.initManager(this.capabilities);
    } else if (this.url && !this.capabilities) {
      return this.loadCapabilities()
        .then(json => Promise.resolve(this.initManager(json)))
        .catch(error => Promise.reject(new Error(`Could not initialize `+
          `the manager: ${error.message}`)));
    }
  }

  /**
   * Initializes the manager instance. Typically called by subclasses via init().
   *
   * TODO Implement as interface (-> TS) and move to MapFishPrintV2Manager
   * TODO Check return type Boolean?
   * TODO Input should be from Type PrintCapabilities, Managers must parse accordingly.
   *
   * @param {Object} capabilities The capabilities to set.
   * @return {Boolean}
   */
  initManager(capabilities) {
    this.capabilities = capabilities;

    this._layouts = this.capabilities.layouts;
    this._outputFormats = this.capabilities.outputFormats;
    this._dpis = this.capabilities.dpis;
    this._scales = this.capabilities.scales;

    this.setLayout(this.getLayouts()[0].name);
    this.setOutputFormat(this.getOutputFormats()[0].name);
    this.setDpi(this.getDpis()[0].name);
    this.setScale(this.getClosestScaleToFitMap().name);

    this.initPrintExtentLayer();
    this.initPrintExtentFeature();
    this.initTransformInteraction();

    this._initiated = true;

    return this.isInitiated();
  }

  /**
   * Loads the print capabilities from the provided remote source.
   *
   * @return {Promise}
   */
  loadCapabilities() {
    return fetch(this.url + this.constructor.INFO_JSON_ENDPOINT, {
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
   * Calls the print servlet to create a output file in the requested format
   * and forces a download of the created output.
   *
   * Note: The manager has to been initialized prior this method's usage.
   *
   * @param {Boolean} forceDownload Whether to force a direct download of the
   *                                print result or to return the download url.
   * @return {Promise|undefined} If forceDownload is set to false, the download
   *                             url of the print result will be returned in a
   *                             Promise.
   */
  print(forceDownload) {
    if (!(this.isInitiated())) {
      Log.warn('The manager hasn\'t been initiated yet. Please call init() first.');
      return;
    }

    const payload = this.getPrintPayload();

    if (this.method === 'GET') {
      const url = `${this.capabilities.printURL}?spec=${encodeURIComponent(JSON.stringify(payload))}`;
      if (forceDownload) {
        this.download(url);
      } else {
        return url;
      }
    } else {
      return fetch(this.capabilities.createURL, {
        method: this.method,
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
          const url = json.getURL;
          if (forceDownload) {
            this.download(url);
          } else {
            return Promise.resolve(url);
          }
        })
        .catch(error => Promise.reject(`Error while creating the print document: ${error.message}`));
    }
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
      units: mapProjection.getUnits(),
      srs: mapProjection.getCode(),
      layout: this.getLayout().name,
      outputFormat: this.getOutputFormat().name,
      dpi: this.getDpi().value,
      layers: serializedLayers,
      pages: [{
        center: getCenter(extentFeatureGeometry.getExtent()),
        scale: this.getScale().value,
        rotation: this.calculateRotation() || 0
      }],
      legends: serializedLegends,
      ...this.customParams
    };

    return payload;
  }

  /**
   * Serializes/encodes the legend payload for the given layer.
   *
   * @param {ol.layer.Layer} layer The layer to serialize/encode the legend for.
   * @return {Object} The serialized/encoded legend.
   */
  serializeLegend(layer) {
    if (layer.getSource() instanceof OlSourceTileWMS ||
      layer.getSource() instanceof OlSourceImageWMS) {
      return {
        name: layer.get('name') || '',
        classes: [{
          name: '',
          icons: [Shared.getLegendGraphicUrl(layer)]
        }]
      };
    }
  }

}

export default MapFishPrintV2Manager;
