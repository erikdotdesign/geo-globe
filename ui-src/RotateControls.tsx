import Control from "./Control";
import ResetSettingButton from "./ResetSettingButton";

const RotateControls = ({
  rotate,
  setRotate
}:{
  rotate: [number, number, number];
  setRotate: (rotate: [number, number, number]) => void;
}) => (
  <>
    <div className="c-control-group">
      <Control
        as="input"
        type="range"
        label="Rotate Lambda"
        min="-180" 
        max="180" 
        value={rotate[0]}
        right={<span>{rotate[0].toFixed(0)}</span>}
        rightReadOnly
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setRotate([e.target.valueAsNumber, rotate[1], rotate[2]])} />
      <ResetSettingButton
        onClick={() => setRotate([0, rotate[1], rotate[2]])} />
    </div>
    <div className="c-control-group">
      <Control
        as="input"
        type="range"
        label="Rotate Phi"
        min="-180" 
        max="180" 
        value={rotate[1]}
        right={<span>{rotate[1].toFixed(0)}</span>}
        rightReadOnly
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setRotate([rotate[0], e.target.valueAsNumber, rotate[2]])} />
      <ResetSettingButton
        onClick={() => setRotate([rotate[0], 0, rotate[2]])} />
    </div>
  </>
);

export default RotateControls;