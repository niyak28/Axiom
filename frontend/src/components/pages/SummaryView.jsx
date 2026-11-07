import AppShell from "../common/AppShell";
import summary from "../mock/dummySummary.json";
import VisualCanvas from "../lecture/VisualCanvas";

export default function SummaryView({ activeView, onNavigate }) {
  return (
    <AppShell
      activeView={activeView}
      onNavigate={onNavigate}
      eyebrow="03 / Lecture archive"
      title="Session summary"
      actions={<span className="status status-live">Synthesis complete</span>}
    >
      <div className="summary-grid">
        <article className="module summary-notes">
          <header className="module-header"><h2>Lecture notes</h2><span className="microcopy">Generated / transcript 41:26</span></header>
          <p>{summary.notesMarkdown}</p>
          <h3>Key takeaways</h3>
          <ol>
            {summary.keyTakeaways.map((item) => <li key={item}>{item}</li>)}
          </ol>
        </article>
        <section className="module summary-visual">
          <header className="module-header"><h2>Generated visual</h2><span className="status">Transformation A</span></header>
          <VisualCanvas frame={summary.generatedVisuals[0]} />
        </section>
      </div>
    </AppShell>
  );
}
