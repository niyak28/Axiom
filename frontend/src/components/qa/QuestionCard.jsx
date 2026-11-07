export default function QuestionCard({ question, aiAnswer, status, quote }) {
  return (
    <article className="question-card">
      <div className="question-card-meta microcopy">
        <span>{status === "escalated" ? "Professor queue" : "AI resolution"}</span>
        <span className={`status ${status === "resolved" ? "status-ok" : ""}`}>
          {status}
        </span>
      </div>
      <h3>{question}</h3>
      {aiAnswer && <p>{aiAnswer}</p>}
      {quote && <blockquote>“{quote}”</blockquote>}
    </article>
  );
}
