import { useEffect, useState } from "react";

export default function Slider({
  min = 0,
  max = 10,
  value,
  onRelease,
  disabled = false,
}) {
  const [draftValue, setDraftValue] = useState(value);

  useEffect(() => setDraftValue(value), [value]);

  const submit = () => onRelease?.(Number(draftValue));
  const percentage = ((draftValue - min) / (max - min)) * 100;

  return (
    <div className="telemetry-slider">
      <input
        aria-label="Current lecture comprehension"
        type="range"
        min={min}
        max={max}
        step="1"
        value={draftValue}
        disabled={disabled}
        onChange={(event) => setDraftValue(Number(event.target.value))}
        onMouseUp={submit}
        onTouchEnd={submit}
        onKeyUp={(event) => {
          if (["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) submit();
        }}
        style={{ "--slider-progress": `${percentage}%` }}
      />
      <div className="slider-labels microcopy">
        <span>Uncertain</span>
        <span>Following</span>
        <span>Confident</span>
      </div>
    </div>
  );
}
