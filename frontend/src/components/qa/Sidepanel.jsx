export default function Sidepanel({
  questions,
  selectedId,
  onSelect,
  isOpen,
  onToggle,
}) {
  const selected = questions.find((item) => item.questionId === selectedId);

  return (
    <aside className={`module sidepanel ${isOpen ? "is-open" : "is-collapsed"}`}>
      <header className="module-header sidepanel-header">
        <span className="status">Resolution channel</span>
        <button type="button" className="icon-button" onClick={onToggle} aria-label={`${isOpen ? "Close" : "Open"} question panel`}>
          {isOpen ? "×" : "‹"}
        </button>
      </header>
      {isOpen && (
        <>
          <div className="sidepanel-intro">
            <h2>Escalated questions</h2>
            <p>{questions.length} items routed to the professor queue.</p>
          </div>
          <div className="queue-list">
            {questions.length ? questions.map((item, index) => (
              <button
                type="button"
                className={`queue-item ${selectedId === item.questionId ? "is-selected" : ""}`}
                key={item.questionId}
                onClick={() => onSelect(item.questionId)}
              >
                <span className="microcopy">Q-{String(index + 41).padStart(3, "0")} / {item.studentId}</span>
                <strong>{item.question}</strong>
              </button>
            )) : <div className="panel-state">Queue is clear.</div>}
          </div>
          {selected && (
            <div className="selection-detail">
              <span className="microcopy">Selected context</span>
              <p>{selected.aiAnswer || "Awaiting professor response."}</p>
            </div>
          )}
        </>
      )}
    </aside>
  );
}
