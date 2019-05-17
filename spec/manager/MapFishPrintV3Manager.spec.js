/*eslint-env jest*/
import OlMap from 'ol/Map';
import OlView from 'ol/View';

import { MapFishPrintV3Manager } from '../../src/manager/MapFishPrintV3Manager';

import printAppsMockResponse from '../../assets/v3/apps.json';
import  printCapabilitiesMockResponse from '../../assets/v3/capabilities.json';

describe('MapFishPrintV3Manager', () => {

  const testMap = new OlMap({
    layers: [],
    view: new OlView({
      center: [0, 0],
      zoom: 2
    })
  });

  it('is defined', () => {
    expect(MapFishPrintV3Manager).not.toBeUndefined();
  });

  it('loads the print capabilities from a remote source', () => {
    fetch.mockResponses([
      JSON.stringify(printAppsMockResponse)
    ], [
      JSON.stringify(printCapabilitiesMockResponse)
    ]);

    const manager = new MapFishPrintV3Manager({
      map: testMap,
      url: 'https://mock:8080/print/pdf/'
    });

    return manager.init()
      .then(resp => {
        expect(resp).toBeTruthy();
        fetch.resetMocks();
      });
  });

  it('loads the print capabilities from a local source', () => {
    const manager = new MapFishPrintV3Manager({
      map: testMap,
      capabilities: printCapabilitiesMockResponse
    });

    expect(manager.init()).toBeTruthy();
  });

  it('renders the print extent', () => {
    const manager = new MapFishPrintV3Manager({
      map: testMap,
      capabilities: printCapabilitiesMockResponse
    });
    manager.init();

    expect(testMap.getLayers().getArray().length).toEqual(1);
    expect(testMap.getLayers().getArray()[0].getSource().getFeatures().length).toEqual(1);
  });


  it('loads available print apps', () => {
    fetch.mockResponses([
      JSON.stringify(printCapabilitiesMockResponse)
    ], [
      JSON.stringify(printAppsMockResponse)
    ]);
    const manager = new MapFishPrintV3Manager({
      map: testMap,
      url: 'https://mock:8080/print/pdf/'
    });
    manager.init();

    return manager.loadPrintApps()
      .then(resp => {
        expect(resp).toEqual(printAppsMockResponse);
        fetch.resetMocks();
      });
  });

  it('loads capabilities for chosen app', () => {
    fetch.mockResponses([
      JSON.stringify(printAppsMockResponse)
    ], [
      JSON.stringify(printCapabilitiesMockResponse)
    ]);
    const manager = new MapFishPrintV3Manager({
      map: testMap,
      url: 'https://mock:8080/print/pdf/'
    });
    manager.init();

    const printApp = 'default';

    return manager.loadAppCapabilities(printApp)
      .then(resp => {
        expect(resp.app).toBe(printCapabilitiesMockResponse.app);
        fetch.resetMocks();
      });
  });
});
