import { useRef, useState } from "react";

const INITIAL_VIEW = { x: -24, y: 34, zoom: 1 };

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function LinearTransformation({ data }) {
  const eigenvalues = data?.eigenvalues || [3, 2, 1];
  const vectorLengths = eigenvalues.map((value) =>
    clamp(88 + Math.abs(value) * 34, 104, 220),
  );
  const [view, setView] = useState(INITIAL_VIEW);
  const [isDragging, setIsDragging] = useState(false);
  const dragOrigin = useRef(null);

  const resetView = () => {
    setView(INITIAL_VIEW);
    setIsDragging(false);
    dragOrigin.current = null;
  };

  const handlePointerDown = (event) => {
    event.currentTarget.setPointerCapture(event.pointerId);
    dragOrigin.current = {
      pointerX: event.clientX,
      pointerY: event.clientY,
      rotationX: view.x,
      rotationY: view.y,
    };
    setIsDragging(true);
  };

  const handlePointerMove = (event) => {
    if (!dragOrigin.current) return;
    const deltaX = event.clientX - dragOrigin.current.pointerX;
    const deltaY = event.clientY - dragOrigin.current.pointerY;
    setView((current) => ({
      ...current,
      x: clamp(dragOrigin.current.rotationX - deltaY * 0.35, -72, 72),
      y: dragOrigin.current.rotationY + deltaX * 0.45,
    }));
  };

  const stopDragging = (event) => {
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    dragOrigin.current = null;
    setIsDragging(false);
  };

  const handleWheel = (event) => {
    event.preventDefault();
    setView((current) => ({
      ...current,
      zoom: clamp(current.zoom - event.deltaY * 0.001, 0.68, 1.48),
    }));
  };

  const handleKeyDown = (event) => {
    const actions = {
      ArrowUp: () => setView((current) => ({ ...current, x: clamp(current.x + 5, -72, 72) })),
      ArrowDown: () => setView((current) => ({ ...current, x: clamp(current.x - 5, -72, 72) })),
      ArrowLeft: () => setView((current) => ({ ...current, y: current.y - 5 })),
      ArrowRight: () => setView((current) => ({ ...current, y: current.y + 5 })),
      "+": () => setView((current) => ({ ...current, zoom: clamp(current.zoom + 0.08, 0.68, 1.48) })),
      "=": () => setView((current) => ({ ...current, zoom: clamp(current.zoom + 0.08, 0.68, 1.48) })),
      "-": () => setView((current) => ({ ...current, zoom: clamp(current.zoom - 0.08, 0.68, 1.48) })),
      r: resetView,
      R: resetView,
    };

    if (actions[event.key]) {
      event.preventDefault();
      actions[event.key]();
    }
  };

  return (
    <section
      className={`vector-scene ${isDragging ? "is-dragging" : ""}`}
      aria-label="Interactive three-dimensional linear transformation model"
      tabIndex="0"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={stopDragging}
      onPointerCancel={stopDragging}
      onWheel={handleWheel}
      onKeyDown={handleKeyDown}
    >
      <div className="scene-stars" aria-hidden="true" />
      <div className="scene-radar" aria-hidden="true" />

      <div
        className="scene-stage"
        aria-hidden="true"
        style={{
          "--rotation-x": `${view.x}deg`,
          "--rotation-y": `${view.y}deg`,
          "--scene-zoom": view.zoom,
        }}
      >
        <div className="space-grid" />
        <div className="orbit-ring orbit-ring-one" />
        <div className="orbit-ring orbit-ring-two" />

        <div className="transform-cube">
          <div className="cube-face cube-front" />
          <div className="cube-face cube-back" />
          <div className="cube-face cube-right" />
          <div className="cube-face cube-left" />
          <div className="cube-face cube-top" />
          <div className="cube-face cube-bottom" />
          <div className="cube-core" />
        </div>

        <div className="scene-axis scene-axis-x"><span>x₁</span></div>
        <div className="scene-axis scene-axis-y"><span>x₂</span></div>
        <div className="scene-axis scene-axis-z"><span>x₃</span></div>

        <div className="eigen-vector eigen-vector-one" style={{ width: vectorLengths[0] }}>
          <i />
          <span>λ₁ · {eigenvalues[0]}</span>
        </div>
        <div className="eigen-vector eigen-vector-two" style={{ width: vectorLengths[1] }}>
          <i />
          <span>λ₂ · {eigenvalues[1]}</span>
        </div>
        <div className="eigen-vector eigen-vector-three" style={{ width: vectorLengths[2] }}>
          <i />
          <span>λ₃ · {eigenvalues[2]}</span>
        </div>

        {Array.from({ length: 12 }, (_, index) => (
          <i className={`data-particle particle-${index + 1}`} key={index} />
        ))}
      </div>

      <div className="scene-hud" aria-hidden="true">
        <span>ROT X {Math.round(view.x)}°</span>
        <span>ROT Y {Math.round(view.y % 360)}°</span>
        <span>ZOOM {view.zoom.toFixed(2)}×</span>
      </div>
      <div className="scene-instructions">Drag to orbit · wheel to zoom</div>
      <button
        type="button"
        className="scene-reset"
        onPointerDown={(event) => event.stopPropagation()}
        onClick={resetView}
      >
        Reset view
      </button>
    </section>
  );
}

export default function VisualCanvas({ frame }) {
  if (!frame) return <div className="visual-empty">Awaiting visual frames.</div>;

  if (frame.frameType === "linear_transformation") {
    return <LinearTransformation data={frame.data} />;
  }

  if (frame.frameType === "plot_2d") {
    return (
      <div className="plot-2d" role="img" aria-label="Two-dimensional generated plot">
        <div className="plot-curve" />
      </div>
    );
  }

  return (
    <div className="visual-empty">
      Unsupported frame: <code>{frame.frameType || "unknown"}</code>
    </div>
  );
}
