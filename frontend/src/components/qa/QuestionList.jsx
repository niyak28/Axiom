import QuestionCard from "./QuestionCard";

export default function QuestionList({ questions, status = "all" }) {
  const filtered =
    status === "all" ? questions : questions.filter((item) => item.status === status);

  if (!filtered.length) {
    return <div className="panel-state">No questions in this channel.</div>;
  }

  return (
    <div className="question-list">
      {filtered.map((item) => (
        <QuestionCard key={item.questionId} {...item} />
      ))}
    </div>
  );
}
