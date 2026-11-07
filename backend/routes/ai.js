import { Router } from "express";
import multer from "multer";
import { transcribeChunk } from "../ai/transcribe.js";
import { generateVisual } from "../ai/visualizer.js";
import { createLecture, getLecture, addSegments, getTranscript, listChatLogs } from "../state/store.js";
import { getDemoLecture, videoIdOf } from "../demo.js";
import { askQuestion, escalateQuestion, QuestionError, toSeconds } from "../questions.js";

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Accepts a UUID or "demo" (missing -> demo). Sends 400/404/503 and returns null on failure.
async function requireLecture(id, res) {
  if (!id || id === "demo") {
    const demo = getDemoLecture();
    if (!demo) { res.status(503).json({ error: "demo lecture is not set up yet" }); return null; }
    return demo;
  }
  if (!UUID_RE.test(id)) { res.status(400).json({ error: "lectureId must be a UUID or 'demo'" }); return null; }
  const lecture = await getLecture(id);
  if (!lecture) { res.status(404).json({ error: "lecture not found" }); return null; }
  return lecture;
}

// Wraps a Q&A function: JSON body in, JSON out, QuestionErrors become 4xx/5xx with { error }.
const qaHandler = (fn) => async (req, res) => {
  try {
    res.json(await fn(req.body ?? {}));
  } catch (e) {
    if (e instanceof QuestionError) return res.status(e.status).json({ error: e.message });
    throw e;
  }
};

export function aiRoutes(io) {
  const r = Router();

  // The constant demo lecture: what the frontend needs to embed the video and join the room.
  r.get("/demo", (req, res) => {
    const demo = getDemoLecture();
    if (!demo) return res.status(503).json({ error: "demo lecture is not set up yet" });
    res.json({ ...demo, videoId: videoIdOf(demo.sourceUrl) });
  });

  r.get("/lectures/:id", async (req, res) => {
    const lecture = await requireLecture(req.params.id, res);
    if (lecture) res.json(lecture);
  });

  // ?videoTime=123 limits to what's been said up to that point.
  r.get("/lectures/:id/transcript", async (req, res) => {
    const lecture = await requireLecture(req.params.id, res);
    if (!lecture) return;
    res.json(await getTranscript(lecture.id, { videoTime: toSeconds(req.query.videoTime), minutes: 24 * 60 }));
  });

  // Q&A history (e.g. on page load). ?escalated=true for the professor's queue.
  r.get("/lectures/:id/questions", async (req, res) => {
    const lecture = await requireLecture(req.params.id, res);
    if (!lecture) return;
    res.json(await listChatLogs(lecture.id, { escalatedOnly: req.query.escalated === "true" }));
  });

  // ---------- Q&A (agreed API contract) ----------

  // { lectureId, studentId, question, videoTime? } -> { questionId, aiAnswer, quote, resolved }
  r.post("/qa/ask", qaHandler((body) => askQuestion(io, body)));

  // { lectureId, questionId, studentId, question } -> { success: true, status: "escalated" }
  r.post("/qa/escalate", qaHandler((body) => escalateQuestion(io, body)));

  // Professor "visualize" button. Body: { lectureId?, videoTime? }
  r.post("/visual", async (req, res) => {
    const lecture = await requireLecture(req.body?.lectureId, res);
    if (!lecture) return;
    const frame = await generateVisual(lecture.id, { videoTime: toSeconds(req.body?.videoTime) });
    if (frame.frameType !== "none") io.to(lecture.id).emit("visual_frame_update", frame);
    res.json(frame);
  });

  // ---------- live lectures (not used by the YouTube demo) ----------

  r.post("/lectures", async (req, res) => {
    const { title, professorName } = req.body ?? {};
    if (!title) return res.status(400).json({ error: "title required" });
    res.status(201).json(await createLecture({ title, professorName }));
  });

  // Professor client posts ~5s audio blobs: form-data { lectureId, audio }
  r.post("/transcript/chunk", upload.single("audio"), async (req, res) => {
    const { lectureId } = req.body ?? {};
    if (!lectureId || !req.file) return res.status(400).json({ error: "lectureId and audio required" });
    if (!(await requireLecture(lectureId, res))) return;
    try {
      const text = await transcribeChunk(req.file.buffer.toString("base64"), req.file.mimetype);
      if (text) {
        await addSegments(lectureId, [{ text }], "live");
        io.to(lectureId).emit("transcript_update", { lectureId, text, ts: Date.now() });
      }
      res.json({ ok: true, text });
    } catch (e) { console.error(e); res.status(500).json({ error: "transcription failed" }); }
  });

  return r;
}
