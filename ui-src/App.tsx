import { useState, useEffect } from "react";
import { continents, TContinentCode } from "countries-list";
import { feature, merge } from "topojson-client";
import countries110m from "world-atlas/countries-110m.json";
import { Topology, GeometryCollection } from "topojson-specification";
import type { Feature } from "geojson";
import { getPathGenerator, getCountryContinentCode, getRelPathData, patchId, getGraticulePathData } from "./helpers";
import Select from "./Select";
import Button from "./Button";
import Control from "./Control";
import "./App.css";

const TOPO_JSON: any = { countries110m };

const projections = {
  azimuthal: [{
    name: "Azimuthal Equal-Area",
    value: "geoAzimuthalEqualArea"
  },{
    name: "Azimuthal Equidistant",
    value: "geoAzimuthalEquidistant"
  },{
    name: "Gnomonic",
    value: "geoGnomonic"
  },{
    name: "Orthographic",
    value: "geoOrthographic"
  },{
    name: "Stereographic",
    value: "geoStereographic"
  }],
  conic: [{
    name: "Conic Conformal",
    value: "geoConicConformal"
  },{
    name: "Conic Equal-Area",
    value: "geoConicEqualArea"
  },{
    name: "Conic Equidistant",
    value: "geoConicEquidistant"
  }],
  cylindrical: [{
    name: "Equirectangular",
    value: "geoEquirectangular"
  },{
    name: "Mercator",
    value: "geoMercator"
  },{
    name: "Transverse Mercator",
    value: "geoTransverseMercator"
  },{
    name: "Equal Earth",
    value: "geoEqualEarth"
  },{
    name: "Natural Earth 1",
    value: "geoNaturalEarth1"
  }]
}

const App = () => {
  const [dataSet, setDataSet] = useState("countries110m");
  const [countryFeatures, setCountryFeatures] = useState<Feature[]>([]);
  const [countryGeometries, setCountryGeometries] = useState<GeometryCollection[]>([]);
  const [includeCountryBorders, setIncludeCountryBorders] = useState<boolean>(true);
  const [continentPathData, setContinentPathData] = useState<{name: string; pathData: string}[]>([]);
  const [countryPathData, setCountryPathData] = useState<
    Record<string, { name: string; pathData: string }[]>
  >({});
  const [projectionType, setProjectionType] = useState<string>("geoMercator");
  const [includeGraticules, setIncludeGraticules] = useState<boolean>(true);
  const [graticulePathData, setGraticulePathData] = useState<string | null>(null);

  const getPatchedCountryFeatures = (json: Topology<{ countries: GeometryCollection }>) => {
    const countryFeatures = feature(json, json.objects.countries);
    return countryFeatures.features.map(patchId);
  };
  
  const getPatchedCountryGeometries = (json: Topology<{ countries: GeometryCollection }>) => {
    return json.objects.countries.geometries.map(patchId);
  };

  const getGeometriesByContinent = (continentCode?: string) =>
    countryGeometries.filter((geom) => 
      continentCode ? getCountryContinentCode(geom.id as string) === continentCode : true
    );

  const getContinentGeometryMap = () => {
    return Object.keys(continents).reduce((acc, code) => {
      acc[code] = {
        type: "Feature",
        properties: { name: continents[code as TContinentCode] },
        geometry: merge(TOPO_JSON[dataSet], getGeometriesByContinent(code) as any)
      };
      return acc;
    }, {} as Record<string, Feature>);
  };

  const getCountryFeaturesByContinent = (continentCode?: string) => {
    if (continentCode) {
      return countryFeatures.filter(f => 
        getCountryContinentCode(f.id as string) === continentCode
      );
    } else {
      return countryFeatures;
    }
  };

  const handleNewDataSet = (ds: any) => {
    const newDataSet = TOPO_JSON[ds];
    const newCountryFeatures = getPatchedCountryFeatures(newDataSet);
    const newCountryGeometries = getPatchedCountryGeometries(newDataSet);
    setCountryFeatures(newCountryFeatures);
    setCountryGeometries(newCountryGeometries);
    setDataSet(ds);
  };

  // Load plugin cache
  useEffect(() => {
    parent.postMessage({ pluginMessage: { type: "load-storage", key: "cache" } }, "*");
    window.onmessage = (event) => {
      const msg = event.data.pluginMessage;
      if (msg.type === "storage-loaded") {
        if (msg.key === "cache" && msg.value) {
          setProjectionType(msg.value.projectionType);
          setIncludeGraticules(msg.value.includeGraticules);
          setIncludeCountryBorders(msg.value.includeCountryBorders);
        }
      }
    };
  }, []);

  // Handle updating data set
  useEffect(() => {
    handleNewDataSet(dataSet);
  }, [dataSet]);

  // Handle updating path data
  useEffect(() => {
    if (!countryFeatures.length || !countryGeometries.length) return;
    const continentGeometryMap = getContinentGeometryMap();
    const projectionFeatures = Object.values(continentGeometryMap);
    const pathGenerator = getPathGenerator(projectionFeatures, projectionType);

    setContinentPathData(projectionFeatures.map((pf, i) => ({
      name: (pf.properties as any).name,
      pathData: getRelPathData(pathGenerator, projectionFeatures[i])
    })));

    if (includeGraticules) {
      const graticulePathData = getGraticulePathData(projectionType);
      setGraticulePathData(graticulePathData);
    }

    if (includeCountryBorders) {
      const continentCountryFeatures = getCountryFeaturesByContinent();

      // Group countries by continent name
      const groupedByContinent = continentCountryFeatures.reduce((acc, countryFeature) => {
        const continentCode = getCountryContinentCode(countryFeature.id as string);
        const continentName = continents[continentCode];
        const pathData = getRelPathData(pathGenerator, countryFeature) as string;
        // Only add countries with have valid pathData
        if (pathData) {
          if (!acc[continentName]) acc[continentName] = [];
          acc[continentName].push({
            name: (countryFeature.properties as any).name,
            pathData
          });
        }
        return acc;
      }, {} as Record<string, { name: string; pathData: string }[]>);

      // Sort each continent group alphabetically by country name
      for (const continentName in groupedByContinent) {
        groupedByContinent[continentName].sort((a, b) => a.name.localeCompare(b.name));
      }

      setCountryPathData(groupedByContinent);
    } else {
      setCountryPathData({});
    }
    parent.postMessage({
      pluginMessage: { type: "save-storage", key: "cache", value: {
        projectionType,
        includeGraticules,
        includeCountryBorders
      }},
    }, "*");
  }, [includeCountryBorders, includeGraticules, countryFeatures, countryGeometries, projectionType]);

  const handleSetIncludeCountryBorders = (e: React.ChangeEvent<HTMLInputElement>) => {
    setIncludeCountryBorders(e.target.checked);
  };

  const createGeoShape = () => {
    const pathData = continentPathData || countryPathData;
    if (pathData) {
      parent.postMessage(
        { 
          pluginMessage: { 
            type: "create-geo-globe", 
            pathData: {
              continentPathData,
              countryPathData
            }
          } 
        },
        "*"
      );
    }
  };

  return (
    <main className="c-app">
      <section className="c-app__body">
        <div className="c-app__logo">
          geo-globe
        </div>
        <Select
        label="Projection"
        value={projectionType}
        onChange={(e) => setProjectionType(e.target.value)}>
        {
          Object.keys(projections).map((key) => (
            <optgroup label={key}>
              {
                projections[key].map((p) => (
                  <option 
                    key={p.value}
                    value={p.value}>
                    {p.name}
                  </option>
                ))
              }
            </optgroup>
          ))
        }
      </Select>
      <Control
        as="input"
        type="checkbox"
        label="Include Graticule"
        checked={includeGraticules}
        onChange={(e) => setIncludeGraticules(e.target.checked)} />
        <Control
          as="input"
          type="checkbox"
          label="Include countries"
          checked={includeCountryBorders}
          onChange={handleSetIncludeCountryBorders} />
        <div className="c-app__geo-preview">
          <svg style={{fill: "none"}}>
            <path d={graticulePathData ? graticulePathData : ""} />
          </svg>
          <svg>
            {
              continentPathData.map((v) => (
                <path d={v.pathData} />
              ))
            }
          </svg>
          <svg>
            {Object.entries(countryPathData).map(([continentCode, countries]) => (
              <g key={continentCode}>
                {countries.map((v) => (
                  <path key={v.name} d={v.pathData} />
                ))}
              </g>
            ))}
          </svg>
        </div>
      </section>
      <footer className="c-app__footer">
        <Button 
          type="primary"
          onClick={createGeoShape}>
          Add to document
        </Button>
      </footer>
    </main>
  );
}

export default App;