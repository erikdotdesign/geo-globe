import * as d3Geo from "d3-geo";
import type { FeatureCollection, Feature } from "geojson";
import { GeoPath, geoGraticule, geoPath } from "d3-geo";
import isoCountries from "i18n-iso-countries";
import { getCountryData, TCountryCode } from "countries-list";

export const getPathGenerator = (
  features: Feature | Feature[],
  projectionType: any
) => {
  const normalizedFeatures = Array.isArray(features) ? features : [features];
  const collection: FeatureCollection = {
    type: "FeatureCollection",
    features: normalizedFeatures,
  };
  const projection = d3Geo[projectionType]().fitSize([302, 302], collection);
  return d3Geo.geoPath(projection);
};

export const getGraticulePathData = (projectionType: any) => {
  const graticule = geoGraticule();

  // Create a projection *without* fitSize, with fixed scale and translate
  const projection = d3Geo[projectionType]()
    .scale(150)               // example scale; adjust to your svg size
    .translate([151, 151]);   // half of your 302x302 SVG size

  const pathGenerator = geoPath(projection);

  return pathGenerator(graticule());
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
