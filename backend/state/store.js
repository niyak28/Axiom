// Persistence for lectures, transcript segments and Q&A logs.
// Uses Supabase when SUPABASE_URL + SUPABASE_SERVICE_KEY are set; otherwise
// falls back to in-memory storage (lost on restart) so local dev still works.
import { randomUUID } from "crypto";
import { createClient } from "@supabase/supabase-js";
import { config } from "../config.js";

const db = !config.useMemoryStore && config.supabaseUrl && config.supabaseKey
  ? createClient(config.supabaseUrl, config.supabaseKey, { auth: { persistSession: false } })
  : null;

export const STORAGE = db ? "supabase" : "memory";
if (!db) console.warn("[store] Supabase not configured (or USE_MEMORY_STORE=true) - using in-memory storage, data is lost on restart");

function unwrap({ data, error }) {
  if (error) throw new Error(`[supabase] ${error.message}`);
  return data;
}

// ---------- row <-> API shape ----------
const toLecture = (r) => r && ({
  id: r.id, title: r.title, professorName: r.professor_name, sourceUrl: r.source_url,
  status: r.status, error: r.error, isActive: r.is_active, createdAt: r.created_at,
});
const toSegment = (r) => ({
  startSec: r.start_sec, endSec: r.end_sec, text: r.text, source: r.source, createdAt: r.created_at,
});
const toChatLog = (r) => ({
  questionId: r.id, lectureId: r.lecture_id, studentId: r.student_id, question: r.question,
  aiAnswer: r.ai_answer, quote: r.quote, quoteStartSec: r.quote_start_sec,
  videoTimeSec: r.video_time_sec, escalated: r.is_escalated, createdAt: r.created_at,
});

// ---------- in-memory fallback ----------
const mem = { lectures: new Map(), segments: new Map(), chat: new Map() };
const memList = (map, id) => { if (!map.has(id)) map.set(id, []); return map.get(id); };

// ---------- lectures ----------
export async function createLecture({ title, professorName = "Unknown", sourceUrl = null, status = "ready" }) {
  const row = { title, professor_name: professorName, source_url: sourceUrl, status };
  if (!db) {
    const full = { id: randomUUID(), created_at: new Date().toISOString(), is_active: true, error: null, ...row };
    mem.lectures.set(full.id, full);
    return toLecture(full);
  }
  return toLecture(unwrap(await db.from("lectures").insert(row).select().single()));
}

export async function updateLecture(id, { status, error }) {
  const patch = {};
  if (status !== undefined) patch.status = status;
  if (error !== undefined) patch.error = error;
  if (!db) { Object.assign(mem.lectures.get(id) || {}, patch); return; }
  unwrap(await db.from("lectures").update(patch).eq("id", id));
}

export async function getLecture(id) {
  if (!db) return toLecture(mem.lectures.get(id)) ?? null;
  return toLecture(unwrap(await db.from("lectures").select("*").eq("id", id).maybeSingle()));
}

// Most recent lecture for a given video URL (null if none).
export async function findLectureBySourceUrl(sourceUrl) {
  if (!db) {
    const rows = [...mem.lectures.values()].filter((r) => r.source_url === sourceUrl);
    return toLecture(rows.at(-1)) ?? null;
  }
  const rows = unwrap(await db.from("lectures").select("*").eq("source_url", sourceUrl)
    .order("created_at", { ascending: false }).limit(1));
  return toLecture(rows[0]) ?? null;
}

// ---------- transcript ----------
// segments: [{ text, startSec?, endSec? }]
export async function addSegments(lectureId, segments, source = "live") {
  if (!segments.length) return;
  const now = new Date().toISOString();
  const rows = segments.map((s) => ({
    lecture_id: lectureId, start_sec: s.startSec ?? null, end_sec: s.endSec ?? null, text: s.text, source,
  }));
  if (!db) { memList(mem.segments, lectureId).push(...rows.map((r) => ({ ...r, created_at: now }))); return; }
  for (let i = 0; i < rows.length; i += 500) unwrap(await db.from("transcript_segments").insert(rows.slice(i, i + 500)));
}

export async function deleteSegments(lectureId) {
  if (!db) { mem.segments.delete(lectureId); return; }
  unwrap(await db.from("transcript_segments").delete().eq("lecture_id", lectureId));
}

// Pick the transcript the AI should see.
//   videoTime given        -> everything up to that point in the video (optionally only the last `windowSec`)
//   video lecture, no time -> the whole video
//   live lecture           -> last `minutes` of wall-clock time
export async function getTranscript(lectureId, { videoTime = null, windowSec = null, minutes = 10 } = {}) {
  const hasVideoTime = typeof videoTime === "number" && Number.isFinite(videoTime);
  const from = hasVideoTime && windowSec ? videoTime - windowSec : null;

  if (!db) {
    const all = mem.segments.get(lectureId) || [];
    const isVideo = all.some((r) => r.start_sec != null);
    let rows;
    if (isVideo) {
      rows = all.filter((r) => r.start_sec != null
        && (!hasVideoTime || r.start_sec <= videoTime) && (from == null || r.start_sec >= from));
      rows.sort((a, b) => a.start_sec - b.start_sec);
    } else {
      const cutoff = Date.now() - minutes * 60_000;
      rows = all.filter((r) => Date.parse(r.created_at) >= cutoff);
    }
    return rows.map(toSegment);
  }

  const lecture = await getLecture(lectureId);
  let q = db.from("transcript_segments").select("start_sec,end_sec,text,source,created_at").eq("lecture_id", lectureId);
  if (lecture?.sourceUrl) {
    q = q.not("start_sec", "is", null).order("start_sec", { ascending: true });
    if (hasVideoTime) q = q.lte("start_sec", videoTime);
    if (from != null) q = q.gte("start_sec", from);
  } else {
    q = q.gte("created_at", new Date(Date.now() - minutes * 60_000).toISOString()).order("created_at", { ascending: true });
  }
  return unwrap(await q.limit(5000)).map(toSegment);
}

// ---------- Q&A ----------
export async function saveChatLog({ questionId, lectureId, studentId, question, aiAnswer, quote,
  quoteStartSec = null, videoTimeSec = null, escalated }) {
  const row = {
    id: questionId, lecture_id: lectureId, student_id: studentId, question, ai_answer: aiAnswer, quote,
    quote_start_sec: quoteStartSec, video_time_sec: videoTimeSec, is_escalated: escalated,
  };
  if (!db) { memList(mem.chat, lectureId).push({ ...row, created_at: new Date().toISOString() }); return; }
  unwrap(await db.from("chat_logs").insert(row));
}

export async function getChatLog(questionId) {
  if (!db) {
    for (const rows of mem.chat.values()) { const r = rows.find((x) => x.id === questionId); if (r) return toChatLog(r); }
    return null;
  }
  return (r => r && toChatLog(r))(unwrap(await db.from("chat_logs").select("*").eq("id", questionId).maybeSingle()));
}

// Mark a question escalated. Returns true if it was newly escalated (false if it already was).
// If the question was never logged (unknown questionId), it is inserted as escalated.
export async function escalateChatLog({ questionId, lectureId, studentId, question }) {
  const existing = await getChatLog(questionId);
  if (existing?.escalated) return false;
  if (existing) {
    if (!db) {
      for (const rows of mem.chat.values()) { const r = rows.find((x) => x.id === questionId); if (r) r.is_escalated = true; }
    } else {
      unwrap(await db.from("chat_logs").update({ is_escalated: true }).eq("id", questionId));
    }
    return true;
  }
  await saveChatLog({ questionId, lectureId, studentId, question, aiAnswer: null, quote: null, escalated: true });
  return true;
}

export async function listChatLogs(lectureId, { escalatedOnly = false } = {}) {
  if (!db) {
    return (mem.chat.get(lectureId) || []).filter((r) => !escalatedOnly || r.is_escalated).map(toChatLog);
  }
  let q = db.from("chat_logs").select("*").eq("lecture_id", lectureId).order("created_at", { ascending: true });
  if (escalatedOnly) q = q.eq("is_escalated", true);
  return unwrap(await q).map(toChatLog);
}

// ---------- helpers ----------
export function formatTime(sec) {
  const s = Math.max(0, Math.floor(sec));
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), r = s % 60;
  const mm = String(m).padStart(h ? 2 : 1, "0"), ss = String(r).padStart(2, "0");
  return h ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
}

// Transcript as prompt text, with [mm:ss] markers for video segments.
export function segmentsToText(segments) {
  return segments.map((s) => (s.startSec != null ? `[${formatTime(s.startSec)}] ${s.text}` : s.text)).join("\n");
}

const norm = (t) => t.toLowerCase().replace(/[^a-z0-9 ]/g, " ").replace(/\s+/g, " ").trim();

// Find where in the video a quote was said (null if it can't be matched).
// The model's quote is usually verbatim, but sometimes stitches phrases together, so we
// try a 6-word run from the start, then any 4-word run from the quote.
export function findQuoteStart(segments, quote) {
  if (!quote) return null;
  const words = norm(quote).split(" ").filter(Boolean);
  if (!words.length) return null;
  const timed = segments.filter((s) => s.startSec != null);
  // Single segments, plus adjacent pairs (a quote can straddle a boundary).
  const haystacks = [
    ...timed.map((s) => [norm(s.text), s.startSec]),
    ...timed.slice(0, -1).map((s, i) => [norm(`${s.text} ${timed[i + 1].text}`), s.startSec]),
  ];
  const probes = [words.slice(0, 6).join(" ")];
  for (let i = 0; i + 4 <= words.length; i++) probes.push(words.slice(i, i + 4).join(" "));
  for (const probe of probes) {
    const hit = haystacks.find(([text]) => ` ${text} `.includes(` ${probe} `));
    if (hit) return hit[1];
  }
  return null;
}
