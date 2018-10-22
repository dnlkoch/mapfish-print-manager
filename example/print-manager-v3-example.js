import OlMap from 'ol/Map';
import OlView from 'ol/View';
import OlLayerTile from 'ol/layer/Tile';
import OlSourceTileWMS from 'ol/source/TileWMS';
import { fromLonLat } from 'ol/proj';

import { MapFishPrintV3Manager } from '../src/index';

const map = new OlMap({
  target: 'map',
  layers: [
    new OlLayerTile({
      source: new OlSourceTileWMS({
        url: 'http://ows.terrestris.de/osm/service',
        params: {
          'LAYERS': 'OSM-WMS'
        }
      })
    })
  ],
  view: new OlView({
    center: fromLonLat([7.11566, 50.40570]),
    zoom: 10
  })
});

const printProvider = new MapFishPrintV3Manager({
  url: 'http://localhost:9000/print',
  map: map
});

printProvider.init()
  .then(() => {
    fillPrintAppCombo();
    fillCombos();
    registerPrintHandler();
  });

/**
 *
 */
const onAppChange = event => {
  const value = event.target.value;
  printProvider.setPrintApp(value);
};

/**
 *
 */
const onLayoutChange = event => {
  const value = event.target.value;
  printProvider.setLayout(value);
};

/**
 *
 */
const onDpiChange = event => {
  const value = event.target.value;
  printProvider.setDpi(value);
};

/**
 *
 */
const onFormatChange = event => {
  const value = event.target.value;
  printProvider.setOutputFormat(value);
};

/**
 *
 */
const onScaleChange = event => {
  const value = event.target.value;
  printProvider.setScale(value);
};

/**
 *
 */
const registerPrintHandler = () => {
  const printBtn = document.querySelector('button#print');
  printBtn.onclick = onPrintClick;
};

/**
 *
 */
const onPrintClick = () => {
  printProvider.print();
};

/**
 *
 */
const fillPrintAppCombo = () => {
  const appSelect = document.querySelector('select#app-select');
  printProvider.getPrintApps().forEach(printApp => {
    const option = document.createElement('option');
    option.text = printApp;
    appSelect.add(option);
  });
  appSelect.value = printProvider.getPrintApp();
  appSelect.onchange = onAppChange;
};

/**
 *
 */
const fillCombos = () => {
  const layoutSelect = document.querySelector('select#layout-select');
  printProvider.getLayouts().forEach(layout => {
    const option = document.createElement('option');
    option.text = layout.name;
    layoutSelect.add(option);
  });
  layoutSelect.value = printProvider.getLayout().name;
  layoutSelect.onchange = onLayoutChange;

  const dpiSelect = document.querySelector('select#dpi-select');
  printProvider.getDpis().forEach(dpi => {
    const option = document.createElement('option');
    option.text = dpi.name;
    dpiSelect.add(option);
  });
  dpiSelect.value = printProvider.getDpi().name;
  dpiSelect.onchange = onDpiChange;

  const formatSelect = document.querySelector('select#format-select');
  printProvider.getOutputFormats().forEach(format => {
    const option = document.createElement('option');
    option.text = format.name;
    formatSelect.add(option);
  });
  formatSelect.value = printProvider.getOutputFormat().name;
  formatSelect.onchange = onFormatChange;

  const scaleSelect = document.querySelector('select#scale-select');
  printProvider.getScales().forEach(scale => {
    const option = document.createElement('option');
    option.text = scale.name;
    scaleSelect.add(option);
  });
  scaleSelect.value = printProvider.getScale().name;
  scaleSelect.onchange = onScaleChange;
};
