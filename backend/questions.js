// Q&A logic behind POST /api/qa/ask and POST /api/qa/escalate.
// Answers with Gemini, saves to chat_logs, and pushes real-time updates over Socket.IO.
import { randomUUID } from "crypto";
import { answerQuestion } from "./ai/triage.js";
import { getLecture, getChatLog, saveChatLog, escalateChatLog } from "./state/store.js";
import { getDemoLecture } from "./demo.js";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export class QuestionError extends Error {
  constructor(status, message) { super(message); this.status = status; }
}

export function toSeconds(v) {
  if (v === undefined || v === null || v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) && n >= 0 ? n : null;
}

const requireString = (v, name, max) => {
  if (typeof v !== "string" || !v.trim()) throw new QuestionError(400, `${name} is required`);
  if (max && v.length > max) throw new QuestionError(400, `${name} must be at most ${max} characters`);
  return v.trim();
};

// The frontend may send any lectureId string (e.g. "lecture_01"). A UUID of a lecture we
// know is used as-is; anything else means the demo lecture.
async function resolveLecture(lectureId) {
  const demo = getDemoLecture();
  if (typeof lectureId === "string" && UUID_RE.test(lectureId) && lectureId !== demo?.id) {
    const lecture = await getLecture(lectureId);
    if (lecture) return lecture;
  }
  if (!demo) throw new QuestionError(503, "demo lecture is not set up yet");
  return demo;
}

const profRoom = (lectureId) => `prof:${lectureId}`;

/**
 * POST /api/qa/ask
 * body: { lectureId, studentId, question, videoTime? }
 *   videoTime (optional, seconds) = current YouTube playback position; the AI then only
 *   uses what has been said so far. Without it, the whole video is used.
 * returns: { questionId, aiAnswer, quote, resolved }
 */
export async function askQuestion(io, body = {}) {
  const studentId = requireString(body.studentId, "studentId");
  const question = requireString(body.question, "question", 500);
  requireString(body.lectureId, "lectureId");
  const lecture = await resolveLecture(body.lectureId);
  if (lecture.status === "processing") throw new QuestionError(409, "lecture transcript is still being processed");
  if (lecture.status === "failed") throw new QuestionError(503, "lecture transcript is unavailable");

  const videoTime = toSeconds(body.videoTime);
  const ans = await answerQuestion(lecture.id, question, { videoTime });
  const questionId = randomUUID();
  const createdAt = new Date().toISOString();

  try {
    await saveChatLog({
      questionId, lectureId: lecture.id, studentId, question, aiAnswer: ans.aiAnswer, quote: ans.quote,
      quoteStartSec: ans.quoteStartSec, videoTimeSec: videoTime, escalated: !ans.resolved,
    });
  } catch (e) {
    console.error("saving chat log failed:", e.message); // still answer the student
  }

  // Real-time extras (not part of the HTTP contract): live Q&A feed for the room,
  // and the professor's queue when the AI couldn't answer.
  const event = { questionId, lectureId: lecture.id, studentId, question, ...ans, videoTime, createdAt };
  io.to(lecture.id).emit("question_answered", event);
  if (!ans.resolved) io.to(profRoom(lecture.id)).emit("qna_queue_update", { ...event, status: "escalated" });

  return { questionId, aiAnswer: ans.aiAnswer, quote: ans.quote, resolved: ans.resolved };
}

/**
 * POST /api/qa/escalate
 * body: { lectureId, questionId, studentId, question }
 * returns: { success: true, status: "escalated" }
 * Idempotent: escalating the same question twice only notifies the professor once.
 * (Questions the AI couldn't answer are already escalated by /ask.)
 */
export async function escalateQuestion(io, body = {}) {
  const questionId = requireString(body.questionId, "questionId");
  if (!UUID_RE.test(questionId)) throw new QuestionError(400, "questionId must be a UUID");
  const studentId = requireString(body.studentId, "studentId");
  const question = requireString(body.question, "question", 500);
  requireString(body.lectureId, "lectureId");

  const existing = await getChatLog(questionId);
  const lectureId = existing?.lectureId ?? (await resolveLecture(body.lectureId)).id;

  const newlyEscalated = await escalateChatLog({ questionId, lectureId, studentId, question });
  if (newlyEscalated) {
    io.to(profRoom(lectureId)).emit("qna_queue_update", {
      questionId, lectureId, studentId, question,
      aiAnswer: existing?.aiAnswer ?? null, quote: existing?.quote ?? null,
      videoTime: existing?.videoTimeSec ?? null, status: "escalated", createdAt: new Date().toISOString(),
    });
  }
  return { success: true, status: "escalated" };
}
