import { Type, MediaResolution } from "@google/genai";
import { USE_MOCK, generate } from "./client.js";
import { mockYouTubeSegments } from "./mock.js";

const WINDOW_SEC = 10 * 60;         // transcribe long videos in 10-minute windows
const CALL_TIMEOUT_MS = 5 * 60_000; // video calls are slow
const WINDOW_CONCURRENCY = 3;

// Accepts watch / youtu.be / shorts / live / embed links; returns a canonical URL or null.
export function normalizeYouTubeUrl(input) {
  let u;
  try { u = new URL(String(input).trim()); } catch { return null; }
  const host = u.hostname.replace(/^(www\.|m\.|music\.)/, "");
  let id = null;
  if (host === "youtu.be") id = u.pathname.slice(1).split("/")[0];
  else if (host === "youtube.com") {
    id = u.searchParams.get("v") || u.pathname.match(/^\/(?:shorts|live|embed)\/([^/?]+)/)?.[1] || null;
  }
  return id && /^[A-Za-z0-9_-]{11}$/.test(id) ? `https://www.youtube.com/watch?v=${id}` : null;
}

// "1:02:03" / "02:03" / "123" -> seconds
function parseTime(t) {
  if (typeof t === "number") return t;
  const parts = String(t).trim().split(":").map(Number);
  if (!parts.length || parts.some((n) => !Number.isFinite(n))) return null;
  return parts.reduce((acc, n) => acc * 60 + n, 0);
}

const SEGMENT_SCHEMA = {
  type: Type.ARRAY,
  items: {
    type: Type.OBJECT,
    properties: {
      start: { type: Type.STRING, description: "Start time from the beginning of the full video, MM:SS or H:MM:SS" },
      end: { type: Type.STRING, description: "End time from the beginning of the full video, MM:SS or H:MM:SS" },
      text: { type: Type.STRING },
    },
    required: ["start", "end", "text"],
  },
};

async function transcribeWindow(url, startSec, endSec) {
  const clip = startSec != null
    ? { videoMetadata: { startOffset: `${startSec}s`, endOffset: `${endSec}s` } } : {};
  const where = startSec != null
    ? `This clip covers ${startSec}s to ${endSec}s of the video. Give timestamps measured from the start of the FULL video (so the first segment starts near ${startSec}s), not from the start of the clip.`
    : "Give timestamps measured from the start of the video.";

  const res = await generate({
    contents: [{ role: "user", parts: [
      { fileData: { fileUri: url, mimeType: "video/*" }, ...clip },
      { text:
        "Transcribe everything the speaker says in this lecture video, verbatim. " +
        "Split it into segments of roughly 10-30 seconds at natural sentence breaks. " +
        "Write math in plain words (e.g. 'x squared'). If the speaker refers to something written on screen " +
        "(an equation, a diagram), add a short description in square brackets, e.g. [writes A v = lambda v]. " +
        where },
    ]}],
    config: {
      responseMimeType: "application/json",
      responseSchema: SEGMENT_SCHEMA,
      mediaResolution: MediaResolution.MEDIA_RESOLUTION_LOW, // ~3x fewer tokens; we only need the audio + rough visuals
    },
  }, { retriesPerModel: 2, timeoutMs: CALL_TIMEOUT_MS, baseDelayMs: 5000, label: "youtube" });

  let segs = JSON.parse(res.text || "[]")
    .map((s) => ({ startSec: parseTime(s.start), endSec: parseTime(s.end), text: String(s.text || "").trim() }))
    .filter((s) => s.text && s.startSec != null);

  // If the model gave clip-relative times anyway, shift them to video time.
  if (startSec && segs.length && Math.max(...segs.map((s) => s.startSec)) < startSec) {
    segs = segs.map((s) => ({ ...s, startSec: s.startSec + startSec, endSec: (s.endSec ?? s.startSec) + startSec }));
  }
  return segs;
}

/**
 * Transcribe a public YouTube video into [{ startSec, endSec, text }].
 * Pass durationSec for videos longer than ~10 min so they're processed in windows
 * (one call on a long lecture can hit context / output limits).
 */
export async function transcribeYouTube(url, { durationSec = null, onProgress = () => {} } = {}) {
  if (USE_MOCK) { onProgress(1, 1); return mockYouTubeSegments; }

  if (!durationSec || durationSec <= WINDOW_SEC) {
    const segs = await transcribeWindow(url, null, null);
    onProgress(1, 1);
    return segs;
  }

  const windows = [];
  for (let s = 0; s < durationSec; s += WINDOW_SEC) windows.push([s, Math.min(s + WINDOW_SEC, durationSec)]);
  // A few windows at a time: faster startup without tripping rate limits.
  const all = [];
  let next = 0, done = 0;
  const worker = async () => {
    while (next < windows.length) {
      const [s, e] = windows[next++];
      // Drop anything the model placed outside this window, to avoid duplicates at the seams.
      all.push(...(await transcribeWindow(url, s, e)).filter((seg) => seg.startSec >= s - 2 && seg.startSec < e));
      onProgress(++done, windows.length);
    }
  };
  await Promise.all(Array.from({ length: Math.min(WINDOW_CONCURRENCY, windows.length) }, worker));
  return all.sort((a, b) => a.startSec - b.startSec);
}
