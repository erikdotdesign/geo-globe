
export type ProjectionCategory = "azimuthal" | "conic" | "cylindrical";
export type AzimuthalProjection = "geoAzimuthalEqualArea" | "geoAzimuthalEquidistant" | "geoGnomonic" | "geoOrthographic" | "geoStereographic";
export type ConicProjection = "geoConicConformal" | "geoConicEqualArea" | "geoConicEquidistant" | "geoAlbers";
export type CylindricalProjection = "geoEquirectangular" | "geoMercator" | "geoTransverseMercator" | "geoEqualEarth" | "geoNaturalEarth1";
export type ProjectionType = AzimuthalProjection | ConicProjection | CylindricalProjection;

export type DataSet = "countries110m" | "countries50m";