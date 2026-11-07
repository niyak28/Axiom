import { useEffect, useMemo, useRef, useState } from "react";

const VIEWBOX = { width: 720, height: 260 };
const PLOT = { left: 42, right: 704, top: 28, bottom: 218 };

function clamp(value, min = 0, max = 1) {
  return Math.min(Math.max(value, min), max);
}

function createIllustrativePoints(sampleCount, demoTick) {
  const count = Math.max(1, Math.min(sampleCount, 120));
  return Array.from({ length: count }, (_, index) => {
    const progress = count === 1 ? 0 : index / (count - 1);
    const phase = Math.sin(index * 0.39 + demoTick * 0.72) * 0.12;
    const fineNoise = Math.sin(index * 1.71 + demoTick * 0.23) * 0.055;
    const lectureShift =
      progress < 0.27 ? 0.08 : progress < 0.58 ? 0.27 : progress < 0.82 ? 0.43 : 0.62;
    const pulse =
      demoTick > 0 && index > count - 18
        ? Math.sin((index - count + 18) * 0.65 + demoTick) * 0.16
        : 0;
    const confusion = clamp(lectureShift + phase + fineNoise + pulse, 0.03, 0.97);
    const x = PLOT.left + progress * (PLOT.right - PLOT.left);
    const y = PLOT.top + confusion * (PLOT.bottom - PLOT.top);

    return {
      id: index + 1,
      confusion,
      confidence: 1 - confusion,
      x,
      y,
      isRecent: index >= count - 30,
    };
  });
}

function buildTrendPath(points) {
  return points
    .map((point, index) => {
      const windowStart = Math.max(0, index - 5);
      const values = points.slice(windowStart, index + 1);
      const average =
        values.reduce((sum, item) => sum + item.confusion, 0) / values.length;
      const y = PLOT.top + average * (PLOT.bottom - PLOT.top);
      return `${index === 0 ? "M" : "L"} ${point.x.toFixed(1)} ${y.toFixed(1)}`;
    })
    .join(" ");
}

export default function Heatmap({
  rollingAverage,
  sampleCount,
  demoTick = 0,
  isLoading = false,
}) {
  const [filter, setFilter] = useState("all");
  const [showTrend, setShowTrend] = useState(true);
  const [hoveredPoint, setHoveredPoint] = useState(null);
  const [pinnedPoint, setPinnedPoint] = useState(null);
  const previousAverage = useRef(rollingAverage);

  const points = useMemo(
    () => createIllustrativePoints(sampleCount, demoTick),
    [sampleCount, demoTick],
  );
  const trendPath = useMemo(() => buildTrendPath(points), [points]);
  const activePoint = hoveredPoint || pinnedPoint;
  const averageConfusion = clamp(1 - rollingAverage);
  const averageY = PLOT.top + averageConfusion * (PLOT.bottom - PLOT.top);
  const belowThreshold = Math.round(sampleCount * (1 - rollingAverage) * 0.4);
  const highFrictionCount = points.filter((point) => point.confusion >= 0.6).length;
  const comprehensionDelta = rollingAverage - previousAverage.current;
  const movement =
    Math.abs(comprehensionDelta) < 0.005
      ? "Holding steady"
      : `${comprehensionDelta > 0 ? "↑" : "↓"} ${Math.abs(comprehensionDelta).toFixed(2)}`;

  useEffect(() => {
    previousAverage.current = rollingAverage;
    setHoveredPoint(null);
    setPinnedPoint(null);
  }, [demoTick, rollingAverage]);

  const isVisible = (point) => {
    if (filter === "high") return point.confusion >= 0.6;
    if (filter === "recent") return point.isRecent;
    return true;
  };

  if (isLoading) return <div className="panel-state">Calibrating telemetry…</div>;
  if (!sampleCount) return <div className="panel-state">No telemetry samples yet.</div>;

  return (
    <section className="module heatmap-module" aria-labelledby="heatmap-title">
      <header className="module-header heatmap-header">
        <div>
          <h2 id="heatmap-title">Student confusion scatter</h2>
          <p className="microcopy">{sampleCount} students / live aggregate telemetry</p>
        </div>
        <span className="status status-live">Updating / 2 s</span>
      </header>

      <div className="telemetry-controls" aria-label="Graph controls">
        <div className="graph-filter" role="group" aria-label="Filter illustrative samples">
          {[
            ["all", "All samples"],
            ["high", "High friction"],
            ["recent", "Recent 30"],
          ].map(([value, label]) => (
            <button
              type="button"
              className={filter === value ? "is-active" : ""}
              onClick={() => setFilter(value)}
              key={value}
            >
              {label}
            </button>
          ))}
        </div>
        <button
          type="button"
          className={`graph-toggle ${showTrend ? "is-active" : ""}`}
          aria-pressed={showTrend}
          onClick={() => setShowTrend((value) => !value)}
        >
          Trend line
        </button>
        <span className="auto-demo-indicator"><i /> Auto simulation</span>
      </div>

      <div className="telemetry-dashboard">
        <div className="telemetry-chart-wrap">
          <div className="chart-axis-title">Confusion</div>
          <svg
            className="telemetry-chart"
            viewBox={`0 0 ${VIEWBOX.width} ${VIEWBOX.height}`}
            role="img"
            aria-label="Live student confusion distribution"
            onMouseLeave={() => setHoveredPoint(null)}
          >
            <defs>
              <linearGradient id="trend-gradient" x1="0" x2="1">
                <stop offset="0" stopColor="#3f9fff" />
                <stop offset="1" stopColor="#7ae7ff" />
              </linearGradient>
              <filter id="point-glow" x="-200%" y="-200%" width="400%" height="400%">
                <feGaussianBlur stdDeviation="2.2" result="blur" />
                <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
              </filter>
            </defs>

            {[0, 0.25, 0.5, 0.75, 1].map((value) => {
              const y = PLOT.top + value * (PLOT.bottom - PLOT.top);
              return (
                <g className="chart-gridline" key={value}>
                  <line x1={PLOT.left} x2={PLOT.right} y1={y} y2={y} />
                  <text x="8" y={y + 3}>{value.toFixed(2)}</text>
                </g>
              );
            })}
            {[1, 30, 60, 90, 120].map((value) => {
              const ratio = (value - 1) / 119;
              const x = PLOT.left + ratio * (PLOT.right - PLOT.left);
              return (
                <g className="chart-gridline chart-gridline-vertical" key={value}>
                  <line x1={x} x2={x} y1={PLOT.top} y2={PLOT.bottom} />
                  <text x={x} y="239" textAnchor="middle">{value}</text>
                </g>
              );
            })}

            <line
              className="average-reference"
              x1={PLOT.left}
              x2={PLOT.right}
              y1={averageY}
              y2={averageY}
            />
            <text className="average-reference-label" x={PLOT.right - 5} y={averageY - 6} textAnchor="end">
              Aggregate reference {(averageConfusion).toFixed(2)}
            </text>

            {showTrend && <path className="telemetry-trend" d={trendPath} />}

            <g className="telemetry-points">
              {points.map((point) => {
                const visible = isVisible(point);
                const selected = activePoint?.id === point.id;
                return (
                  <g
                    className={`telemetry-point ${visible ? "" : "is-muted"} ${selected ? "is-selected" : ""}`}
                    key={point.id}
                    role="button"
                    tabIndex="0"
                    aria-label={`Student sample ${point.id}, confusion ${point.confusion.toFixed(2)}`}
                    onMouseEnter={() => setHoveredPoint(point)}
                    onFocus={() => setHoveredPoint(point)}
                    onBlur={() => setHoveredPoint(null)}
                    onClick={() => setPinnedPoint((current) => current?.id === point.id ? null : point)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        setPinnedPoint((current) => current?.id === point.id ? null : point);
                      }
                    }}
                  >
                    <line x1={point.x} x2={point.x} y1={PLOT.bottom} y2={point.y} />
                    <circle cx={point.x} cy={point.y} r={selected ? 4.8 : 3.1} />
                  </g>
                );
              })}
            </g>

            {activePoint && (
              <g
                className="chart-tooltip"
                transform={`translate(${clamp(activePoint.x - 67, 8, 570)} ${clamp(activePoint.y - 67, 8, 172)})`}
              >
                <rect width="138" height="54" />
                <text x="10" y="17">STUDENT / {String(activePoint.id).padStart(3, "0")}</text>
                <text className="tooltip-value" x="10" y="34">
                  Confusion {activePoint.confusion.toFixed(2)}
                </text>
                <text x="10" y="47">Confidence {activePoint.confidence.toFixed(2)}</text>
              </g>
            )}
          </svg>

          <div className="chart-caption microcopy">
            <span><i className="legend-dot" /> Student sample</span>
            <span><i className="legend-line" /> Cohort trend</span>
            <span>Hover to inspect / click to pin</span>
          </div>
        </div>

        <aside className="telemetry-summary" key={`telemetry-${demoTick}`}>
          <div className="telemetry-summary-heading">
            <span>Telemetry summary</span>
            <i /> Live
          </div>
          <dl>
            <div><dt>Students</dt><dd>{sampleCount}</dd></div>
            <div><dt>Below 0.40 (est.)</dt><dd>{belowThreshold}</dd></div>
            <div><dt>Avg confusion</dt><dd>{averageConfusion.toFixed(2)}</dd></div>
            <div><dt>Avg comprehension</dt><dd>{rollingAverage.toFixed(2)}</dd></div>
            <div><dt>Live movement</dt><dd className={comprehensionDelta >= 0 ? "metric-positive" : "metric-negative"}>{movement}</dd></div>
            <div><dt>High-friction samples</dt><dd>{highFrictionCount}</dd></div>
            <div><dt>Stream pulse</dt><dd>#{String(demoTick + 1).padStart(3, "0")}</dd></div>
          </dl>
          <p>
            Cohort model synchronized with the active transcript and incoming
            comprehension telemetry.
          </p>
          <strong>Estimated {belowThreshold} students below 0.40 confidence</strong>
          {activePoint && (
            <div className="selected-sample">
              <span>Selected student sample</span>
              <b>{String(activePoint.id).padStart(3, "0")}</b>
              <small>Confusion {activePoint.confusion.toFixed(2)}</small>
            </div>
          )}
        </aside>
      </div>
    </section>
  );
}
