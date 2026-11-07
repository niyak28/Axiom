import { useMemo, useState } from "react";
import { askQuestion } from "../../api/client";
import AppShell from "../common/AppShell";
import RaiseHand from "../common/RaiseHand";
import Slider from "../common/Slider";
import { useLectureContent } from "../contexts/LectureContent";
import useFrictionTelemetry from "../hooks/useFrictionTelemetry";
import VisualCanvas from "../lecture/VisualCanvas";
import QuestionList from "../qa/QuestionList";

export default function StudentView({ activeView, onNavigate }) {
  const { lectureId, studentId, visualStream, isQnaOpen } = useLectureContent();
  const [friction, setFriction] = useState(7);
  const [lastSent, setLastSent] = useState("09:41:24");
  const [isRaised, setIsRaised] = useState(false);
  const [question, setQuestion] = useState("");
  const [submittedQuestions, setSubmittedQuestions] = useState([]);
  const [isAnswering, setIsAnswering] = useState(false);
  const {
    submitFriction,
    isSubmitting: isSendingFriction,
    error: frictionError,
  } = useFrictionTelemetry();

  const matrix = visualStream?.data?.matrix || [[3, 0, 0], [0, 2, 0], [0, 0, 1]];
  const matrixText = useMemo(
    () => matrix.map((row) => `│ ${row.join("   ")} │`).join("\n"),
    [matrix],
  );

  const handleFriction = async (score) => {
    setFriction(score);
    try {
      await submitFriction({ lectureId, studentId, score });
      setLastSent(new Date().toLocaleTimeString([], { hour12: false }));
    } catch {
      // The hook exposes the request error to the telemetry status UI.
    }
  };

  const handleQuestion = async (event) => {
    event.preventDefault();
    const trimmed = question.trim();
    if (!trimmed || isAnswering) return;
    setIsAnswering(true);
    try {
      // POST /api/qa/ask -> { questionId, aiAnswer, quote, resolved }
      const { questionId, aiAnswer, quote, resolved } = await askQuestion({
        lectureId,
        studentId,
        question: trimmed,
      });
      setSubmittedQuestions((items) => [
        { questionId, question: trimmed, aiAnswer, quote, status: resolved ? "resolved" : "escalated" },
        ...items,
      ]);
      setQuestion("");
    } catch (error) {
      setSubmittedQuestions((items) => [
        {
          questionId: `error-${Date.now()}`,
          question: trimmed,
          aiAnswer: `Could not reach the AI: ${error?.message || "unknown error"}`,
          quote: null,
          status: "error",
        },
        ...items,
      ]);
    } finally {
      setIsAnswering(false);
    }
  };

  return (
    <AppShell
      activeView={activeView}
      onNavigate={onNavigate}
      eyebrow="01 / Student terminal"
      title="Vector workspace"
      actions={
        <div className="heading-actions">
          <RaiseHand isRaised={isRaised} onToggle={() => setIsRaised((value) => !value)} />
          <span className="microcopy">{isQnaOpen ? "Q&A channel open" : "Q&A not yet open"}</span>
        </div>
      }
    >
      <section className="module telemetry-module">
        <div className="telemetry-main">
          <div className="module-kicker">
            <span>01.1 / Comprehension telemetry</span>
            <span
              className={`status ${
                frictionError ? "status-error" : "status-live"
              }`}
              role={frictionError ? "alert" : undefined}
            >
              {frictionError
                ? `Transmission / ${frictionError.message}`
                : isSendingFriction
                  ? "Transmission / sending"
                  : "Transmission / ready"}
            </span>
          </div>
          <p>Drag to calibrate. Release to transmit.</p>
          <Slider
            min={0}
            max={10}
            value={friction}
            onRelease={handleFriction}
            disabled={isSendingFriction}
          />
        </div>
        <div className="telemetry-value">
          <strong>{(friction / 10).toFixed(2)}</strong>
          <span className="microcopy">
            {frictionError ? "Not sent — retry by releasing slider" : `Last sent ${lastSent}`}
          </span>
        </div>
      </section>

      <section className="module workspace-module">
        <header className="module-header">
          <div>
            <h2>Workspace</h2>
            <p className="microcopy">Handwriting → symbolic model → vector space</p>
          </div>
          <span className="status status-live">Live generation</span>
        </header>
        <div className="workspace-grid">
          <aside className="notes-capture">
            <span className="microcopy">Live lecture transcript</span>
            <div className="transcript-preview">
              <span className="status status-live">Listening / live</span>
              <p>
                “For an eigenvector, the transformation changes magnitude while
                preserving direction.”
              </p>
              <p>
                “We find the eigenvalues by solving the characteristic equation
                det(A − λI) = 0.”
              </p>
            </div>
            <p className="microcopy">Live symbol extraction</p>
            <code>A = diag(3, 2, 1)<br />Av = λv</code>
            <div className="capture-stats microcopy"><span>12 symbols</span><span>99.2% match</span></div>
          </aside>
          <div className="visual-area">
            <div className="visual-labels microcopy"><span>R³ / Linear transformation</span><span>Basis view</span></div>
            <VisualCanvas frame={visualStream} />
            <div className="visual-labels microcopy"><span>Camera [35°, 24°]</span><span>Orthographic</span></div>
          </div>
          <aside className="model-parameters">
            <span className="microcopy">Model parameters</span>
            <h3>Transformation A</h3>
            <pre>{matrixText}</pre>
            <dl>
              <div><dt>Dimension</dt><dd>3 × 3</dd></div>
              <div><dt>Rank</dt><dd>3</dd></div>
              <div><dt>Determinant</dt><dd>6</dd></div>
              <div><dt>Eigenvalues</dt><dd>3, 2, 1</dd></div>
            </dl>
            <div className="converged-box microcopy">Model converged<br />Residual &lt; 10⁻⁶</div>
          </aside>
        </div>
        <div className="pipeline microcopy">
          {["01 Capture", "02 Parse", "03 Reconstruct", "04 Render"].map((step, index) => (
            <span key={step}>{step}{index < 3 && <b>→</b>}</span>
          ))}
          <span>Updated 0.2 s ago&nbsp;&nbsp;/&nbsp;&nbsp;60 fps</span>
        </div>
      </section>

      <section className="module question-console">
        <header className="module-header">
          <div>
            <h2>AI question console</h2>
            <p className="microcopy">Submit questions for AI resolution. Transcript-based answers appear below.</p>
          </div>
        </header>
        <form onSubmit={handleQuestion}>
          <label htmlFor="student-question" className="microcopy">Question entry</label>
          <div className="question-entry">
            <input
              id="student-question"
              value={question}
              onChange={(event) => setQuestion(event.target.value)}
              placeholder="What is the geometric interpretation of λ₁ = 3 in this eigenspace?"
            />
            <button className="primary-button" disabled={isAnswering || !question.trim()}>
              {isAnswering ? "Resolving…" : "Submit to AI"}
            </button>
          </div>
        </form>
        <div className="answer-region">
          <span className="microcopy">AI answers</span>
          <QuestionList questions={submittedQuestions} />
        </div>
      </section>
    </AppShell>
  );
}
