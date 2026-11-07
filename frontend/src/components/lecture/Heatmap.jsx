function ScatterPlot({ offset = 0 }) {
  const dots = Array.from({ length: 22 }, (_, index) => {
    const x = 7 + index * 4.2;
    const y = 18 + ((index * 7 + offset) % 13) + index * 1.7;
    return <circle key={index} cx={x} cy={Math.min(y, 78)} r="1.8" />;
  });

  return (
    <svg className="scatter-plot" viewBox="0 0 100 88" role="img" aria-label="Aggregate comprehension trend">
      <path d="M0 0V88H100" />
      <path className="guide" d="M0 44H100" />
      <g>{dots}</g>
    </svg>
  );
}

export default function Heatmap({
  rollingAverage,
  sampleCount,
  isLoading = false,
}) {
  if (isLoading) return <div className="panel-state">Calibrating telemetry…</div>;
  if (!sampleCount) return <div className="panel-state">No telemetry samples yet.</div>;

  return (
    <section className="module heatmap-module" aria-labelledby="heatmap-title">
      <header className="module-header">
        <div>
          <h2 id="heatmap-title">Student confusion scatter</h2>
          <p className="microcopy">{sampleCount} students / live telemetry</p>
        </div>
        <span className="status status-live">Updating / 2 s</span>
      </header>
      <div className="scatter-grid">
        {[1, 4, 7, 10].map((offset, index) => (
          <div className="scatter-cell" key={offset}>
            <span className="axis-label">Confusion</span>
            <ScatterPlot offset={offset} />
            {index > 1 && <span className="axis-label right">Uncertainty</span>}
          </div>
        ))}
      </div>
      <footer className="heatmap-legend microcopy">
        <span>Low</span>
        <span>Each point = 1 student</span>
        <span>{Math.round((1 - rollingAverage) * sampleCount)} students below 0.40</span>
      </footer>
    </section>
  );
}
