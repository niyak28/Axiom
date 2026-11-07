import { useMemo, useState } from "react";
import AppShell from "../common/AppShell";
import { useLectureContent } from "../contexts/LectureContent";
import useLectureRecording from "../hooks/useLectureRecording";
import useSocket from "../hooks/useSocket";
import Heatmap from "../lecture/Heatmap";
import Sidepanel from "../qa/Sidepanel";

export default function ProfessorView({ activeView, onNavigate }) {
  const {
    rollingAverage,
    sampleCount,
    isQnaOpen,
    questions,
    lectureId,
    demoTick,
    updateQnaState,
  } = useLectureContent();
  const [selectedId, setSelectedId] = useState(null);
  const [panelOpen, setPanelOpen] = useState(true);
  const [recordingFile, setRecordingFile] = useState(null);
  const { setQnaOpen } = useSocket();
  const {
    uploadRecording,
    isUploading: isUploadingRecording,
    error: recordingError,
    isComplete: isRecordingUploaded,
    reset: resetRecordingUpload,
  } = useLectureRecording();
  const escalated = useMemo(
    () => questions.filter((item) => item.status === "escalated"),
    [questions],
  );
  const resolved = questions.filter((item) => item.status === "resolved");

  const handleQnaToggle = () => {
    const nextValue = !isQnaOpen;
    updateQnaState(nextValue);
    setQnaOpen(lectureId, nextValue);
  };

  const handleRecordingSelection = (event) => {
    setRecordingFile(event.target.files?.[0] || null);
    resetRecordingUpload();
  };

  const handleRecordingUpload = async (event) => {
    event.preventDefault();
    if (!recordingFile) return;

    try {
      await uploadRecording(recordingFile, lectureId);
    } catch {
      // The upload hook exposes the request error in the recording module.
    }
  };

  return (
    <AppShell
      activeView={activeView}
      onNavigate={onNavigate}
      eyebrow="02 / Instructor observatory"
      title="Class intelligence"
      actions={<div className="professor-meta"><span>Dr. E. Voss</span><span className="microcopy">Room 04 / 09:41:26</span></div>}
    >
      <div className="professor-layout">
        <div className="professor-main">
          <section className="module metric-strip">
            <div><span className="microcopy">Connected endpoints</span><strong>{sampleCount}</strong><small>{sampleCount} / {sampleCount} enrolled</small></div>
            <div><span className="microcopy">Mean comprehension</span><strong>{rollingAverage.toFixed(2)}</strong><small>Live telemetry · 2 s interval</small></div>
            <div><span className="microcopy">Below threshold</span><strong>{Math.round((1 - rollingAverage) * 46)}</strong><small>Illustrative estimate · confidence &lt; 0.40</small></div>
            <div><span className="microcopy">Resolved silently</span><strong>93.0%</strong><small>{resolved.length} / {questions.length} intercepted questions</small></div>
          </section>

          <Heatmap
            rollingAverage={rollingAverage}
            sampleCount={sampleCount}
            demoTick={demoTick}
          />

          <section className="module recording-module">
            <header className="module-header">
              <div>
                <h2>Lecture recording</h2>
                <p className="microcopy">Professor upload / active session archive</p>
              </div>
              <span
                className={`status ${
                  recordingError
                    ? "status-error"
                    : isRecordingUploaded
                      ? "status-ok"
                      : ""
                }`}
                role={recordingError ? "alert" : undefined}
              >
                {recordingError
                  ? "Upload failed"
                  : isRecordingUploaded
                    ? "Recording received"
                    : isUploadingRecording
                      ? "Uploading"
                      : "Awaiting file"}
              </span>
            </header>
            <form onSubmit={handleRecordingUpload} className="recording-form">
              <label className="recording-picker">
                <span className="microcopy">Audio or video recording</span>
                <strong>
                  {recordingFile ? recordingFile.name : "Select lecture recording"}
                </strong>
                <input
                  type="file"
                  accept="audio/*,video/*"
                  onChange={handleRecordingSelection}
                  disabled={isUploadingRecording}
                />
              </label>
              <div className="recording-file-meta microcopy">
                {recordingFile ? (
                  <>
                    <span>{recordingFile.type || "Recording file"}</span>
                    <span>{(recordingFile.size / 1024 / 1024).toFixed(1)} MB</span>
                  </>
                ) : (
                  <span>Choose a completed recording from this live lecture.</span>
                )}
              </div>
              <button
                type="submit"
                className="primary-button"
                disabled={!recordingFile || isUploadingRecording}
              >
                {isUploadingRecording ? "Uploading recording…" : "Upload recording"}
              </button>
            </form>
            {recordingError && (
              <p className="recording-feedback status-error">
                {recordingError.message} Select the file again or retry the upload.
              </p>
            )}
          </section>

          <section className="module professor-queue">
            <header className="module-header">
              <div><h2>Professor queue</h2><p className="microcopy">{String(escalated.length).padStart(2, "0")} unresolved</p></div>
              <span className="queue-state microcopy">{isQnaOpen ? "Routing / Q&A open" : "Held / Q&A closed"}</span>
            </header>
            <div className="queue-table">
              <div className="queue-row queue-head microcopy"><span>ID</span><span>Unresolved question</span><span>Context</span><span>State</span></div>
              {escalated.map((item, index) => (
                <button className="queue-row" key={item.questionId} type="button" onClick={() => setSelectedId(item.questionId)}>
                  <span>Q-{String(index + 41).padStart(3, "0")}</span>
                  <span>{item.question}</span>
                  <span>{index === 0 ? "Multiplicity" : index === 1 ? "Basis condition" : "Lecture scope"}</span>
                  <span className="status status-ok">Staged</span>
                </button>
              ))}
            </div>
          </section>
        </div>

        <div className="resolution-column">
          <section className="module qna-control">
            <span className="status">Resolution channel</span>
            <div className="toggle-row">
              <div><h2>Open Q&amp;A</h2><span className="microcopy">{isQnaOpen ? "Open / questions routing" : "Closed / questions held"}</span></div>
              <button
                type="button"
                role="switch"
                aria-checked={isQnaOpen}
                className={`switch ${isQnaOpen ? "is-on" : ""}`}
                onClick={handleQnaToggle}
              ><span /></button>
            </div>
            <p>When open, unresolved questions route to your main queue.</p>
          </section>
          <Sidepanel
            questions={escalated}
            selectedId={selectedId}
            onSelect={setSelectedId}
            isOpen={panelOpen}
            onToggle={() => setPanelOpen((value) => !value)}
          />
        </div>
      </div>
    </AppShell>
  );
}
