import { DataSet } from "./types";
import Select from "./Select";

const DataSetSelector = ({
  dataSet,
  setDataSet
}: {
  dataSet: DataSet;
  setDataSet: (dataSet: DataSet) => void;
}) => {

  const dataSets: { name: string; value: DataSet }[] = [{
    name: `Low (1:110m scale)`,
    value: "countries110m"
  },{
    name: `High (1:50m scale)`,
    value: "countries50m"
  }];

  return (
    <Select
      label="Detail"
      value={dataSet}
      onChange={(e) => setDataSet(e.target.value as DataSet)}>
      {
        dataSets.map((d) => (
          <option 
            key={d.value}
            value={d.value}>
            {d.name}
          </option>
        ))
      }
    </Select>
  );
}

export default DataSetSelector;