import { config } from "./config.js";
import express from "express";
import cors from "cors";
import http from "http";
import { Server } from "socket.io";
import { aiRoutes } from "./routes/ai.js";
import { STORAGE } from "./state/store.js";
import { ensureDemoLecture, getDemoLecture } from "./demo.js";
import { getQueuePayload } from "./questions.js";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const app = express();
app.use(cors());
app.use(express.json());
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

io.on("connection", (socket) => {
  // The frontend doesn't send join_lecture, so every connection joins the demo lecture
  // (and its professor room) automatically and gets the current professor queue.
  const demo = getDemoLecture();
  if (demo) {
    socket.join(demo.id);
    socket.join(`prof:${demo.id}`);
    getQueuePayload(demo.id).then((q) => socket.emit("qna_queue_update", q)).catch(() => {});
  }

  // Optional explicit join: { lectureId?, role? }  Any lectureId that isn't a known lecture UUID means the demo lecture.
  socket.on("join_lecture", ({ lectureId, role } = {}) => {
    const demo = getDemoLecture();
    const id = UUID_RE.test(lectureId || "") ? lectureId : demo?.id;
    if (!id) return;
    socket.join(id);
    if (role === "professor") socket.join(`prof:${id}`);
    if (demo && id === demo.id) socket.emit("lecture_status", { lectureId: id, status: demo.status, error: demo.error });
  });
});

app.use("/api", aiRoutes(io));

// Express 5 forwards async route errors here.
app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(err.status || 500).json({ error: err.expose ? err.message : "internal error" });
});

server.listen(config.port, async () => {
  console.log(`up on ${config.port} (storage: ${STORAGE}, ai: ${config.useMockAi ? "mock" : config.geminiModels[0]} / answers: ${config.geminiAnswerModels[0]})`);
  try {
    await ensureDemoLecture(io);
  } catch (e) {
    console.error("[demo] setup failed:", e.message);
    if (/column|schema cache|does not exist/i.test(e.message)) {
      console.error("[demo] Run backend/database/migrations/001_youtube_transcripts.sql in the Supabase SQL editor.");
    }
  }
});
