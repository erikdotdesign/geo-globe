import * as d3Geo from "d3-geo";
import type { FeatureCollection, Feature } from "geojson";
import { GeoPath, geoGraticule, geoPath, geoGraticule10 } from "d3-geo";
import isoCountries from "i18n-iso-countries";
import { getCountryData, TCountryCode } from "countries-list";

export const getPathGenerator = (
  features: Feature | Feature[],
  projectionType: any,
  defaultScaleMap: Record<string, number>,
  params: {
    scale?: number;            // optional: if undefined, use default fitted scale
    rotate?: [number, number, number];
    size?: [number, number];
  } = {
    rotate: [0.1, 0, 0],
    size: [302, 302]
  }
) => {
  const size = params.size || [302, 302];
  const normalizedFeatures = Array.isArray(features) ? features : [features];

  // Combine your features with the graticule feature for fitting
  const graticuleFeature = geoGraticule10();
  const combinedFeatures = {
    type: "FeatureCollection",
    features: [...normalizedFeatures, graticuleFeature]
  };

  const projection = d3Geo[projectionType]();

  // Fit projection to combined features (including graticules)
  const padding = getProjectionPadding(projectionType);
  const paddedSize: [number, number] = [size[0] - padding * 2, size[1] - padding * 2];
  projection.fitSize(paddedSize, combinedFeatures);

  // Store default scale if not set
  if (!(projectionType in defaultScaleMap)) {
    defaultScaleMap[projectionType] = projection.scale();
  }

  // Use provided scale or default scale
  projection.scale(params.scale ?? defaultScaleMap[projectionType]);

  // Center & translate and rotate
  projection
    .center([0, 0])
    .translate([size[0] / 2, size[1] / 2])
    .rotate(params.rotate ?? [0, 0, 0])
    .clipExtent([[0, 0], size]);

  const pathGenerator = geoPath(projection);

  return {
    pathGenerator,
    scaleMap: defaultScaleMap
  };
};

export const getProjectionPadding = (projectionType: string) => {
  switch(projectionType) {
    case "geoAzimuthalEquidistant":
      return 32
    case "geoAzimuthalEqualArea":
      return 12;
    case "geoGnomonic":
      return 8;
    case "geoOrthographic":
      return 2;
    case "geoStereographic":
      return 28;
    case "geoConicEquidistant":
      return 2;
    case "geoAlbers":
      return 6;
    case "geoEqualEarth":
      return 4;
    case "geoNaturalEarth1":
      return 3;
    default:
      return 0;
  }
};

export const getRelPathData = (
  pathGenerator: GeoPath,
  features: Feature | Feature[]
): string => {
  const normalizedFeatures = Array.isArray(features) ? features : [features];
  const featureCollection: FeatureCollection = {
    type: "FeatureCollection",
    features: normalizedFeatures
  };
  return pathGenerator(featureCollection) as string;
};

export const getGraticulePathData = (
  pathGenerator: GeoPath
) => {
  const graticule = geoGraticule();
  return pathGenerator(graticule());
};

export const capitalize = (str: string): string => {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

export const getCountryContinentCode = (id: string) => {
  const customCountryContinentMap: Record<string, string> = {
    XK: "EU",
    XN: "AS",
    XS: "AF",
    XZ: "AS",
    XI: "EU",
    AX: "OC"
  };
  const alpha2 = isoCountries.numericToAlpha2(id) as TCountryCode;
  return getCountryData(alpha2).continent || customCountryContinentMap[id];
};

export const patchId = (obj: any) => {
  if (!obj.id) {
    switch (obj.properties.name) {
      case "Kosovo": obj.id = "XK"; break;
      case "Somaliland": obj.id = "XS"; break;
      case "N. Cyprus": obj.id = "XN"; break;
      case "Siachen Glacier": obj.id = "XZ"; break;
      case "Indian Ocean Ter.": obj.id = "XI"; break;
    }
  } else if (obj.properties.name === "Ashmore and Cartier Is.") {
    obj.id = "AX";
  }
  return obj;
};
