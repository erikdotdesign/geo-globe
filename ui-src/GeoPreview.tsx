import './GeoPreview.css';

const GeoPreview = ({
  graticulePathData,
  continentPathData,
  countryPathData,
  outlinePathData
}:{
  graticulePathData: string | null;
  continentPathData: { name: string; pathData: string }[];
  countryPathData: Record<string, { name: string; pathData: string }[]>;
  outlinePathData: string | null;
}) => (
  <div className="c-geo-preview">
    <svg className="c-geo-preview__overlay c-geo-preview__overlay--graticules">
      <path d={graticulePathData ? graticulePathData : ""} />
    </svg>
    <svg className="c-geo-preview__overlay c-geo-preview__overlay--features">
      {continentPathData.map((v) => (
        <path d={v.pathData} />
      ))}
    </svg>
    <svg className="c-geo-preview__overlay c-geo-preview__overlay--features">
      {Object.entries(countryPathData).map(([continentCode, countries]) => (
        <g key={continentCode}>
          {countries.map((v) => (
            <path key={v.name} d={v.pathData} />
          ))}
        </g>
      ))}
    </svg>
    <svg className="c-geo-preview__overlay c-geo-preview__overlay--outline">
      <path d={outlinePathData ? outlinePathData : ""} />
    </svg>
  </div>
);

export default GeoPreview;