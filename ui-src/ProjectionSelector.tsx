import { ProjectionCategory, ProjectionType } from "./types";
import { capitalize } from "./helpers";
import Select from "./Select";

const ProjectionSelector = ({
  projectionType,
  setProjectionType
}: {
  projectionType: ProjectionType;
  setProjectionType: (projectionType: ProjectionType) => void;
}) => {

  const projections: Record<ProjectionCategory, { name: string, value: ProjectionType }[]> = {
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
  };

  return (
    <Select
      label="Projection"
      value={projectionType}
      onChange={(e) => setProjectionType(e.target.value as ProjectionType)}>
      {
        Object.keys(projections).map((key) => (
          <optgroup label={capitalize(key)}>
            {
              (projections[key as ProjectionCategory]).map((p) => (
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
  );
}

export default ProjectionSelector;