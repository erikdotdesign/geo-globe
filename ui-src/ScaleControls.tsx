import Control from "./Control";
import ResetSettingButton from "./ResetSettingButton";

const ScaleControls = ({
  scale,
  defaultScale,
  setScale
}:{
  scale: number;
  defaultScale: number;
  setScale: (scale: number) => void;
}) => (
  <div className="c-control-group">
    <Control
      as="input"
      type="range"
      label="Scale"
      min={defaultScale || 0}
      max="1000" 
      value={scale}
      right={<span>{(scale - defaultScale).toFixed(0)}</span>}
      rightReadOnly
      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setScale(e.target.valueAsNumber)} />
    <ResetSettingButton
      onClick={() => setScale(defaultScale)} />
  </div>
);

export default ScaleControls;