import { useState, useEffect } from "react";
import { continents, TContinentCode } from "countries-list";
import { feature, merge } from "topojson-client";
import { GeoPath } from "d3-geo";
import countries110m from "world-atlas/countries-110m.json";
import countries50m from "world-atlas/countries-50m.json";
import { Topology, GeometryCollection } from "topojson-specification";
import type { Feature } from "geojson";
import { ProjectionType, DataSet } from "./types";
import { getPathGenerator, getCountryContinentCode, getRelPathData, patchId, getGraticulePathData } from "./helpers";
import Button from "./Button";
import Control from "./Control";
import ProjectionSelector from "./ProjectionSelector";
import DataSetSelector from "./DataSetSelector";
import ScaleControls from "./ScaleControls";
import RotateControls from "./RotateControls";
import GeoPreview from "./GeoPreview";
import "./App.css";

const TOPO_JSON: any = { countries110m, countries50m };

const App = () => {
  const [projectionType, setProjectionType] = useState<ProjectionType>("geoMercator");
  const [scale, setScale] = useState<number>(120);
  const [rotate, setRotate] = useState<[number, number, number]>([0.1, 0, 0]);
  const [defaultScaleMap, setDefaultScaleMap] = useState<Record<string, number>>({});
  const [dataSet, setDataSet] = useState<DataSet>("countries110m");
  const [countryFeatures, setCountryFeatures] = useState<Feature[]>([]);
  const [countryGeometries, setCountryGeometries] = useState<GeometryCollection[]>([]);
  const [includeGraticules, setIncludeGraticules] = useState<boolean>(true);
  const [includeOutline, setIncludeOutline] = useState<boolean>(true);
  const [includeCountryBorders, setIncludeCountryBorders] = useState<boolean>(true);
  const [continentPathData, setContinentPathData] = useState<{name: string; pathData: string}[]>([]);
  const [countryPathData, setCountryPathData] = useState<
    Record<string, { name: string; pathData: string }[]>
  >({});
  const [graticulePathData, setGraticulePathData] = useState<string | null>(null);
  const [outlinePathData, setOutlinePathData] = useState<string | null>(null);

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

  const handleCountryPathData = (pathGenerator: GeoPath) => {
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
  };

  const handleGraticulePathData = (pathGenerator: GeoPath) => {
    if (includeGraticules) {
      const graticulePathData = getGraticulePathData(pathGenerator);
      setGraticulePathData(graticulePathData);
    } else {
      setGraticulePathData(null);
    }
  };

  const handleOutlinePathData = (pathGenerator: GeoPath) => {
    if (includeOutline) {
      setOutlinePathData(pathGenerator({ type: "Sphere" }));
    } else {
      setOutlinePathData(null);
    }
  };

  const handleDefaultScale = (scaleMap: any) => {
    setDefaultScaleMap(scaleMap);
    if (scale < scaleMap[projectionType]) {
      setScale(scaleMap[projectionType]);
    }
  };

  const handlePathData = () => {
    if (!countryFeatures.length || !countryGeometries.length) return;
    const continentGeometryMap = getContinentGeometryMap();
    const projectionFeatures = Object.values(continentGeometryMap);
    const { pathGenerator, scaleMap } = getPathGenerator(projectionFeatures, projectionType, defaultScaleMap, { scale, rotate });

    setContinentPathData(projectionFeatures.map((pf, i) => ({
      name: (pf.properties as any).name,
      pathData: getRelPathData(pathGenerator, projectionFeatures[i])
    })).filter(e => e.pathData));

    handleDefaultScale(scaleMap);
    handleGraticulePathData(pathGenerator);
    handleCountryPathData(pathGenerator);
    handleOutlinePathData(pathGenerator);
  };

  // Load plugin cache
  useEffect(() => {
    parent.postMessage({ pluginMessage: { type: "load-storage", key: "cache" } }, "*");
    window.onmessage = (event) => {
      const msg = event.data.pluginMessage;
      if (msg.type === "storage-loaded") {
        if (msg.key === "cache" && msg.value) {
          setProjectionType(msg.value.projectionType);
          setDataSet(msg.value.dataSet);
          setScale(msg.value.scale);
          setRotate(msg.value.rotate);
          setIncludeGraticules(msg.value.includeGraticules);
          setIncludeOutline(msg.value.includeOutline);
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
    handlePathData();
    parent.postMessage({
      pluginMessage: { type: "save-storage", key: "cache", value: {
        projectionType,
        dataSet,
        scale,
        rotate,
        includeGraticules,
        includeOutline,
        includeCountryBorders
      }},
    }, "*");
  }, [
    includeCountryBorders, includeGraticules, includeOutline, 
    countryFeatures, countryGeometries, projectionType, 
    scale, rotate, dataSet
  ]);

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
        <div className="c-control-group">
          <ProjectionSelector
            projectionType={projectionType}
            setProjectionType={setProjectionType} />
          <DataSetSelector
            dataSet={dataSet}
            setDataSet={handleNewDataSet} />
        </div>
        <ScaleControls
          scale={scale}
          defaultScale={defaultScaleMap[projectionType]}
          setScale={setScale} />
        <RotateControls
          rotate={rotate}
          setRotate={setRotate} />
        <GeoPreview
          graticulePathData={graticulePathData}
          continentPathData={continentPathData}
          countryPathData={countryPathData}
          outlinePathData={outlinePathData} />
        <Control
          as="input"
          type="checkbox"
          label="Include countries"
          checked={includeCountryBorders}
          onChange={handleSetIncludeCountryBorders} />
        <Control
          as="input"
          type="checkbox"
          label="Include Graticules"
          checked={includeGraticules}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setIncludeGraticules(e.target.checked)} />
        <Control
          as="input"
          type="checkbox"
          label="Include Outline"
          checked={includeOutline}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setIncludeOutline(e.target.checked)} />
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