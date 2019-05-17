/*eslint-env jest*/
import OlMap from 'ol/Map';
import OlLayerImage from 'ol/layer/Image';
import OlSourceImageWMS from 'ol/source/ImageWMS';
import OlView from 'ol/View';

import { MapFishPrintV2Manager } from '../../src/index';

import mockResponse from '../../assets/info.json';

describe('MapFishPrintV2Manager', () => {

  const testMap = new OlMap({
    layers: [],
    view: new OlView({
      center: [0, 0],
      zoom: 2
    })
  });

  it('is defined', () => {
    expect(MapFishPrintV2Manager).not.toBeUndefined();
  });

  it('loads the print capabilities from a remote source', () => {
    fetch.mockResponse(JSON.stringify(mockResponse));

    const manager = new MapFishPrintV2Manager({
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
    const manager = new MapFishPrintV2Manager({
      map: testMap,
      capabilities: mockResponse
    });

    expect(manager.init()).toBeTruthy();
  });

  it('renders the print extent', () => {
    const manager = new MapFishPrintV2Manager({
      map: testMap,
      capabilities: mockResponse
    });
    manager.init();

    expect(testMap.getLayers().getArray().length).toEqual(1);
    expect(testMap.getLayers().getArray()[0].getSource().getFeatures().length).toEqual(1);
  });

  it('returns the print download url', () => {
    const map = new OlMap({
      layers: [
        new OlLayerImage({
          extent: [-13884991, 2870341, -7455066, 6338219],
          source: new OlSourceImageWMS({
            url: 'https://bvb.de',
            params: {
              LAYERS: 'SHINJI:KAGAWA',
              FORMAT: 'image/png8'
            }
          })
        })
      ],
      view: new OlView({
        center: [0, 0],
        zoom: 2
      })
    });
    const manager = new MapFishPrintV2Manager({
      method: 'POST',
      map: map,
      capabilities: mockResponse
    });
    const getURLMock = 'http://localhost:4321/print/pdf/919288886008494300.png.printout';
    manager.init();

    fetch.mockResponse(JSON.stringify({
      getURL: getURLMock
    }));

    return manager.print()
      .then(payload => {
        expect(payload).toEqual(getURLMock);
        fetch.resetMocks();
      });
  });

});
