function LinearTransformation({ data }) {
  const eigenvalues = data?.eigenvalues || [3, 2, 1];
  return (
    <div className="vector-scene" role="img" aria-label="Three-dimensional linear transformation model">
      <div className="grid-plane" />
      <div className="axis axis-x"><span>x₁</span></div>
      <div className="axis axis-y"><span>x₂</span></div>
      <div className="axis axis-z"><span>x₃</span></div>
      <div className="vector vector-one"><span>λ₁ = {eigenvalues[0]}</span></div>
      <div className="vector vector-two"><span>λ₂ = {eigenvalues[1]}</span></div>
      <div className="vector vector-three"><span>λ₃ = {eigenvalues[2]}</span></div>
      <div className="transform-box" />
    </div>
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
