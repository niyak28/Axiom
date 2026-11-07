import { createContext, useCallback, useContext, useMemo, useState } from "react";
import confusionFixture from "../mock/dummyConfusion.json";
import questionsFixture from "../mock/dummyQuestions.json";

const LectureContentContext = createContext(null);

export function LectureContentProvider({ children }) {
  const [rollingAverage, setRollingAverage] = useState(
    confusionFixture.rollingAverage,
  );
  const [sampleCount, setSampleCount] = useState(confusionFixture.sampleCount);
  const [isQnaOpen, setIsQnaOpen] = useState(false);
  const [questions, setQuestions] = useState(questionsFixture);
  const [visualStream, setVisualStream] = useState({
    frameType: "linear_transformation",
    data: {
      matrix: [[3, 0, 0], [0, 2, 0], [0, 0, 1]],
      eigenvalues: [3, 2, 1],
    },
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const lectureId = "lecture_01";
  const studentId = "student_01";

  const updateRollingAverage = useCallback((value, count) => {
    setRollingAverage(Number(value) || 0);
    if (typeof count === "number") setSampleCount(count);
  }, []);
  const updateQnaState = useCallback((value) => setIsQnaOpen(Boolean(value)), []);
  const updateQuestions = useCallback(
    (value) => setQuestions(Array.isArray(value) ? value : []),
    [],
  );
  const updateQuestionQueue = useCallback((queue) => {
    const liveQueue = Array.isArray(queue)
      ? queue.map((item) => ({ ...item, status: "escalated" }))
      : [];
    setQuestions((current) => [
      ...current.filter((item) => item.status !== "escalated"),
      ...liveQueue,
    ]);
  }, []);
  const updateVisualStream = useCallback((frame) => {
    if (frame?.frameType && frame?.data && typeof frame.data === "object") {
      setVisualStream(frame);
    }
  }, []);

  const value = useMemo(
    () => ({
      rollingAverage,
      sampleCount,
      isQnaOpen,
      questions,
      visualStream,
      lectureId,
      studentId,
      isLoading,
      error,
      updateRollingAverage,
      updateQnaState,
      updateQuestions,
      updateQuestionQueue,
      updateVisualStream,
      setIsLoading,
      setError,
    }),
    [
      rollingAverage,
      sampleCount,
      isQnaOpen,
      questions,
      visualStream,
      isLoading,
      error,
      updateRollingAverage,
      updateQnaState,
      updateQuestions,
      updateQuestionQueue,
      updateVisualStream,
    ],
  );

  return (
    <LectureContentContext.Provider value={value}>
      {children}
    </LectureContentContext.Provider>
  );
}

export function useLectureContent() {
  const context = useContext(LectureContentContext);
  if (!context) {
    throw new Error("useLectureContent must be used within LectureContentProvider.");
  }
  return context;
}
