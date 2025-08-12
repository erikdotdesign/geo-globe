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
import ResetSettingButton from "./ResetSettingButton";
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
  },{
    name: "Albers",
    value: "geoAlbers"
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
  const [outlinePathData, setOutlinePathData] = useState<string | null>(null);
  const [scale, setScale] = useState<number>(120);
  const [rotate, setRotate] = useState<[number, number, number]>([0.1, 0, 0]);
  const [defaultScaleMap, setDefaultScaleMap] = useState<Record<string, number>>({});

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
          setScale(msg.value.scale);
          setRotate(msg.value.rotate);
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

  const handlePathData = () => {
    if (!countryFeatures.length || !countryGeometries.length) return;
    const continentGeometryMap = getContinentGeometryMap();
    const projectionFeatures = Object.values(continentGeometryMap);
    const { pathGenerator, scaleMap } = getPathGenerator(projectionFeatures, projectionType, defaultScaleMap, { scale, rotate });

    setOutlinePathData(pathGenerator({ type: "Sphere" }));
    setDefaultScaleMap(scaleMap);

    if (scale < scaleMap[projectionType]) {
      setScale(scaleMap[projectionType]);
    }

    setContinentPathData(projectionFeatures.map((pf, i) => ({
      name: (pf.properties as any).name,
      pathData: getRelPathData(pathGenerator, projectionFeatures[i])
    })).filter(e => e.pathData));

    if (includeGraticules) {
      const graticulePathData = getGraticulePathData(pathGenerator);
      setGraticulePathData(graticulePathData);
    } else {
      setGraticulePathData(null);
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
  }

  // Handle updating path data
  useEffect(() => {
    handlePathData();
    parent.postMessage({
      pluginMessage: { type: "save-storage", key: "cache", value: {
        projectionType,
        scale,
        rotate,
        includeGraticules,
        includeCountryBorders
      }},
    }, "*");
  }, [includeCountryBorders, includeGraticules, countryFeatures, countryGeometries, projectionType, scale, rotate]);

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
              graticulePathData,
              continentPathData,
              countryPathData,
              outlinePathData
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
        <div className="c-control-group">
          <Control
            as="input"
            type="range"
            label="Scale"
            min={defaultScaleMap[projectionType] || 0}
            max="1000" 
            value={scale}
            right={<span>{(Number(scale) - Number(defaultScaleMap[projectionType])).toFixed(0)}</span>}
            rightReadOnly
            onChange={(e) => setScale(e.target.value)} />
          <ResetSettingButton
            onClick={() => setScale(defaultScaleMap[projectionType])} />
        </div>
        <div className="c-control-group">
          <Control
            as="input"
            type="range"
            label="Rotate Lambda"
            min="-180" 
            max="180" 
            value={rotate[0]}
            right={<span>{rotate[0]}</span>}
            rightReadOnly
            onChange={(e) => setRotate([e.target.value, rotate[1], rotate[2]])} />
          <ResetSettingButton
            onClick={() => setRotate([0, rotate[1], rotate[2]])} />
        </div>
        <div className="c-control-group">
          <Control
            as="input"
            type="range"
            label="Rotate Pha"
            min="-180" 
            max="180" 
            value={rotate[1]}
            right={<span>{rotate[1]}</span>}
            rightReadOnly
            onChange={(e) => setRotate([rotate[0], e.target.value, rotate[2]])} />
          <ResetSettingButton
            onClick={() => setRotate([rotate[0], 0, rotate[2]])} />
        </div>
        {/* <Control
          as="input"
          type="range"
          label="Rotate Gamma"
          min="-180" 
          max="180" 
          value={rotate[2]}
          onChange={(e) => setRotate([rotate[0], rotate[1], e.target.value])} /> */}
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
          <svg style={{fill: "none"}}>
            <path d={outlinePathData ? outlinePathData : ""} />
          </svg>
        </div>
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