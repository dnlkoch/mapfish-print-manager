import OlSourceVector from 'ol/source/Vector';
import OlFormatGeoJSON from 'ol/format/GeoJSON';
import OlStyleStyle from 'ol/style/Style';
import OlStyleRegularShape from 'ol/style/RegularShape';
import { fromCircle } from 'ol/geom/Polygon';
import OlFeature from 'ol/Feature';
import OlStyleIcon from 'ol/style/Icon';
import OlStyleCircle from 'ol/style/Circle';
import OlStyleImage from 'ol/style/Image';
import OlStyleText from 'ol/style/Text';
import OlStyleStroke from 'ol/style/Stroke';
import OlStyleFill from 'ol/style/Fill';
import get from 'lodash/get';
import pickBy from 'lodash/pickBy';
import parseColor from 'parse-color';
import parseFont from 'parse-css-font';

import BaseSerializer from './BaseSerializer';

/**
 * The MapFishPrintV2VectorSerializer.
 *
 * @class
 */
export class MapFishPrintV2VectorSerializer extends BaseSerializer {

  /**
   * The vector layer type identificator.
   *
   * @type {String}
   */
  static TYPE_VECTOR = 'Vector';

  /**
   * The circle geometry type name.
   *
   * @type {String}
   */
  static CIRCLE_GEOMETRY_TYPE = 'Circle';

  /**
   * The property to get the style dictionary key from.
   *
   * @type {String}
   */
  static FEAT_STYLE_PROPERTY = '_style';

  /**
   * The ol sources this serializer is capable of serializing.
   *
   * @type {Array}
   */
  static sourceCls = [
    OlSourceVector
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
   * @param {Number} viewResolution The resolution to calculate the styles for.
   * @return {Object} The serialized/encoded layer.
   */
  serialize(layer, viewResolution) {
    const source = layer.getSource();

    if (!this.validateSource(source)) {
      return;
    }

    const features = source.getFeatures();
    const format = new OlFormatGeoJSON();
    const serializedFeatures = [];
    const serializedStyles = {};
    const serializedStylesDict = {};
    let styleName;
    let styleId = 0;

    features.forEach(feature => {
      const geometry = feature.getGeometry();
      const geometryType = geometry.getType();
      let serializedFeature;

      // as GeoJSON format doesn't support circle geometries, we need to
      // transform circles to polygons.
      if (geometryType === this.constructor.CIRCLE_GEOMETRY_TYPE) {
        const style = feature.getStyle();
        const polyFeature = new OlFeature(fromCircle(geometry));
        polyFeature.setStyle(style);
        feature = polyFeature;
      }
      serializedFeature = format.writeFeatureObject(feature);

      let styles;
      let styleFunction = feature.getStyleFunction();

      if (styleFunction) {
        styles = styleFunction.call(feature, viewResolution);
      } else {
        styleFunction = layer.getStyleFunction();
        if (styleFunction) {
          styles = styleFunction.call(layer, feature, viewResolution);
        }
      }

      // assumption below: styles is an array of OlStyleStyle
      if (styles instanceof OlStyleStyle) {
        styles = [styles];
      }

      if (styles) {
        serializedFeatures.push(serializedFeature);

        styles.forEach(style => {
          const styleObject = this.writeStyle(style, geometryType);
          const serializedStyle = JSON.stringify(styleObject);
          const dictStyle = serializedStylesDict[serializedStyle];

          if (dictStyle >= 0) {
            styleName = dictStyle;
          } else {
            serializedStylesDict[serializedStyle] = styleName = styleId++;
            serializedStyles[styleName] = styleObject;
          }
          if (!serializedFeature.properties) {
            serializedFeature.properties = {};
          }
          serializedFeature.properties[this.constructor.FEAT_STYLE_PROPERTY] = styleName;
        });
      }
    });

    const serialized = {
      ...super.serialize(layer, source),
      ...{
        name: layer.get('name') || 'Vector Layer',
        opacity: layer.getOpacity(),
        geoJson: {
          type: 'FeatureCollection',
          features: serializedFeatures
        },
        styles: serializedStyles,
        styleProperty: this.constructor.FEAT_STYLE_PROPERTY,
        type: this.constructor.TYPE_VECTOR
      }
    };

    return serialized;
  }

  /**
   * Returns a plain object matching the passed `ol.style.Style` instance.
   *
   * @param {ol.style.Style} olStyle An ol.style.Style instance.
   * @return {Object} A plain object matching the passed `ol.style.Style`
   *                  instance.
   */
  writeStyle = (olStyle, geomType) => {
    if (!(olStyle instanceof OlStyleStyle)) {
      return undefined;
    }

    const fillStyle = this.writeFillStyle(olStyle.getFill());
    const imageStyle = this.writeImageStyle(olStyle.getImage());
    const strokeStyle = this.writeStrokeStyle(olStyle.getStroke());
    const textStyle = this.writeTextStyle(olStyle.getText());

    let style = {};
    switch (geomType) {
      case 'Point':
      case 'MultiPoint':
        style = {
          strokeColor: parseColor(get(imageStyle, 'stroke.color')).hex,
          strokeOpacity: get(parseColor(get(imageStyle, 'stroke.color')), 'rgba[3]'),
          strokeWidth: get(imageStyle, 'stroke.width'),
          strokeLinecap: get(imageStyle, 'stroke.lineCap'),
          strokeDashstyle: get(imageStyle, 'stroke.lineDash'),
          fillColor: parseColor(get(imageStyle, 'fill.color')).hex,
          fillOpacity: get(parseColor(get(imageStyle, 'fill.color')), 'rgba[3]'),
          pointRadius: imageStyle.radius,
          externalGraphic: imageStyle.src,
          graphicWidth: get(imageStyle, 'size[0]'),
          graphicHeight: get(imageStyle, 'size[1]'),
          graphicOpacity: imageStyle instanceof OlStyleIcon ? imageStyle.opacity : undefined,
          // TODO not available in ol3?
          graphicXOffset: undefined,
          // TODO not available in ol3?
          graphicYOffset: undefined,
          rotation: imageStyle.rotation,
          // TODO Support full list of graphics: 'circle', 'square', 'star', 'x',
          // 'cross' and 'triangle'
          graphicName: 'circle'
        };
        break;
      case 'LineString':
      case 'MultiLineString':
        style = {
          strokeColor: parseColor(strokeStyle.color).hex,
          strokeOpacity: get(parseColor(strokeStyle.color), 'rgba[3]'),
          strokeWidth: strokeStyle.width,
          strokeLinecap: strokeStyle.lineCap,
          strokeDashstyle: strokeStyle.lineDash
        };
        break;
      case 'Polygon':
      case 'MultiPolygon':
      case 'Circle':
        style = {
          strokeColor: parseColor(strokeStyle.color).hex,
          strokeOpacity: get(parseColor(strokeStyle.color), 'rgba[3]'),
          strokeWidth: strokeStyle.width,
          strokeLinecap: strokeStyle.lineCap,
          strokeDashstyle: strokeStyle.lineDash,
          fillColor: parseColor(fillStyle.color).hex,
          fillOpacity: get(parseColor(fillStyle.color), 'rgba[3]')
        };
        break;
      default:
        // TODO some fallback style?!
        style = {

        };
    }

    if (textStyle && textStyle.text) {
      const parsedFont = parseFont(textStyle.font);
      style = {...style, ...{
        label: textStyle.text,
        fontFamily: parsedFont.family.join(','),
        fontSize: parsedFont.size,
        fontWeight: parsedFont.weight,
        fontStyle: parsedFont.style,
        fontColor: parseColor(get(textStyle, 'fill.color')).hex,
        fontOpacity: get(parseColor(get(textStyle, 'fill.color')), 'rgba[3]')
      }};
    }

    return pickBy(style, v => v !== undefined);
  }

  /**
   * Returns a plain object matching the passed ol.style.Image instance.
   *
   * Works with `ol.style.Circle`, `ol.style.Icon` and
   * `ol.style.RegularShape`
   *
   * @param {ol.style.Image} olImageStyle An ol.style.Image instance.
   * @return {Object} A plain object matching the passed `ol.style.Image`
   *                  instance.
   */
  writeImageStyle = olImageStyle => {
    if (!(olImageStyle instanceof OlStyleImage)) {
      return {};
    }

    if (olImageStyle instanceof OlStyleCircle) {
      return this.writeCircleStyle(olImageStyle);
    }

    if (olImageStyle instanceof OlStyleIcon) {
      return this.writeIconStyle(olImageStyle);
    }

    if (olImageStyle instanceof OlStyleRegularShape) {
      return this.writeRegularShapeStyle(olImageStyle);
    }
  }

  /**
   * Returns a plain object matching the passed ol.style.Circle instance.
   *
   * @param {ol.style.Circle} olCircleStyle An ol.style.Circle instance.
   * @return {Object} A plain object matching the passed `ol.style.Circle`
   *                  instance.
   */
  writeCircleStyle = olCircleStyle => {
    if (!(olCircleStyle instanceof OlStyleCircle)) {
      return {};
    }

    return {
      fill: this.writeFillStyle(olCircleStyle.getFill()),
      image: this.writeImageStyle(olCircleStyle.getImage()),
      opacity: olCircleStyle.getOpacity(),
      radius: olCircleStyle.getRadius(),
      rotateWithView: olCircleStyle.getRotateWithView(),
      rotation: olCircleStyle.getRotation(),
      scale: olCircleStyle.getScale(),
      snapToPixel: olCircleStyle.getSnapToPixel(),
      stroke: this.writeStrokeStyle(olCircleStyle.getStroke())
    };
  }

  /**
   * Returns a plain object matching the passed ol.style.Icon instance.
   *
   * @param {ol.style.Icon} olIconStyle An ol.style.Icon instance.
   * @return {Object} A plain object matching the passed `ol.style.Icon`
   *                  instance.
   */
  writeIconStyle = olIconStyle => {
    if (!(olIconStyle instanceof OlStyleIcon)) {
      return {};
    }

    return {
      anchor: olIconStyle.getAnchor(),
      // getAnchor() returns the anchor in pixel values always, hence
      // we need to set the anchorUnits respectively
      anchorXUnits: 'pixels',
      anchorYUnits: 'pixels',
      anchorOrigin: olIconStyle.getOrigin(),
      opacity: olIconStyle.getOpacity(),
      rotateWithView: olIconStyle.getRotateWithView(),
      rotation: olIconStyle.getRotation(),
      scale: olIconStyle.getScale(),
      size: olIconStyle.getSize(),
      snapToPixel: olIconStyle.getSnapToPixel(),
      src: olIconStyle.getSrc()
    };
  }

  /**
   * Returns a plain object matching the passed ol.style.RegularShape
   * instance.
   *
   * @param {ol.style.RegularShape} olRegularShape An ol.style.RegularShape
   *                                               instance.
   * @return {Object} A plain object matching the passed `ol.style.RegularShape`
   *                  instance.
   */
  writeRegularShapeStyle = olRegularShape => {
    if (!(olRegularShape instanceof OlStyleRegularShape)) {
      return {};
    }

    return {
      angle: olRegularShape.getAngle(),
      fill: this.writeFillStyle(olRegularShape.getFill()),
      opacity: olRegularShape.getOpacity(),
      points: olRegularShape.getPoints(),
      radius: olRegularShape.getRadius(),
      radius2: olRegularShape.getRadius2(),
      rotateWithView: olRegularShape.getRotateWithView(),
      rotation: olRegularShape.getRotation(),
      scale: olRegularShape.getScale(),
      snapToPixel: olRegularShape.getSnapToPixel(),
      stroke: this.writeStrokeStyle(olRegularShape.getStroke())
    };
  }

  /**
   * Returns a plain object matching the passed ol.style.Fill instance.
   *
   * @param {ol.style.Fill} olFillStyle An ol.style.Fill instance.
   * @return {Object} A plain object matching the passed `ol.style.Fill`
   *                  instance.
   */
  writeFillStyle = olFillStyle => {
    if (!(olFillStyle instanceof OlStyleFill)) {
      return {};
    }

    return {
      color: olFillStyle.getColor()
    };
  }

  /**
   * Returns a plain object matching the passed ol.style.Stroke instance.
   *
   * @param {ol.style.Stroke} olStrokeStyle An ol.style.Stroke instance.
   * @return {Object} A plain object matching the passed `ol.style.Stroke`
   *                  instance.
   */
  writeStrokeStyle = olStrokeStyle => {
    if (!(olStrokeStyle instanceof OlStyleStroke)) {
      return {};
    }

    return {
      color: olStrokeStyle.getColor(),
      lineCap: olStrokeStyle.getLineCap(),
      lineJoin: olStrokeStyle.getLineJoin(),
      // If not set, getLineDash will return null.
      lineDash: olStrokeStyle.getLineDash() || undefined,
      lineDashOffeset: olStrokeStyle.getLineDashOffset(),
      miterLimit: olStrokeStyle.getMiterLimit(),
      width: olStrokeStyle.getWidth()
    };
  }

  /**
   * Returns a plain object matching the passed ol.style.Text instance.
   *
   * @param {ol.style.Text} olTextStyle An ol.style.Text instance.
   * @return {Object} A plain object matching the passed `ol.style.Text`
   *                  instance.
   */
  writeTextStyle = olTextStyle => {
    if (!(olTextStyle instanceof OlStyleText)) {
      return {};
    }

    return {
      fill: this.writeFillStyle(olTextStyle.getFill()),
      font: olTextStyle.getFont(),
      offsetX: olTextStyle.getOffsetX(),
      offsetY: olTextStyle.getOffsetY(),
      rotation: olTextStyle.getRotation(),
      scale: olTextStyle.getScale(),
      stroke: this.writeStrokeStyle(olTextStyle.getStroke()),
      text: olTextStyle.getText(),
      textAlign: olTextStyle.getTextAlign(),
      textBaseline: olTextStyle.getTextBaseline()
    };
  }

}

export default MapFishPrintV2VectorSerializer;
