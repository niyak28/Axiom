const viewLabels = {
  student: "Student console",
  professor: "Professor console",
  summary: "Lecture summary",
};

export default function AppShell({
  activeView,
  onNavigate,
  eyebrow,
  title,
  children,
  actions,
}) {
  return (
    <div className="app-shell">
      <header className="topbar">
        <button className="brand" type="button" onClick={() => onNavigate("student")}>
          <span className="brand-mark">Σ</span>
          <strong>Axiom</strong>
          <span className="brand-divider">/</span>
          <span>Lecture systems</span>
        </button>
        <div className="lecture-meta">
          <strong>Linear algebra</strong>
          <span>Math 240 / Lecture 07</span>
        </div>
        <nav aria-label="Application views">
          {Object.entries(viewLabels).map(([view, label]) => (
            <button
              type="button"
              className={activeView === view ? "is-active" : ""}
              key={view}
              onClick={() => onNavigate(view)}
            >
              {label}
            </button>
          ))}
        </nav>
        <span className="session-status"><i /> Session live</span>
      </header>

      <main>
        <div className="page-heading">
          <div>
            <p className="eyebrow">{eyebrow}</p>
            <h1>{title}</h1>
            <p className="microcopy">L07&nbsp;&nbsp;/&nbsp;&nbsp;Eigenvalues &amp; linear transformations</p>
          </div>
          {actions}
        </div>
        {children}
      </main>

      <footer className="app-footer microcopy">
        <span>AXM / 240.07</span>
        <span>Encrypted channel&nbsp;&nbsp;•&nbsp;&nbsp;Transcript synced</span>
        <span>Endpoint S-042&nbsp;&nbsp;/&nbsp;&nbsp;Latency 24 ms</span>
      </footer>
    </div>
  );
}
