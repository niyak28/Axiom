// The demo uses one constant YouTube video (config.demoVideoUrl).
// At startup we make sure it has a lecture row and a stored transcript; the
// transcript is only generated once and reused on later restarts.
import { config } from "./config.js";
import { normalizeYouTubeUrl, transcribeYouTube } from "./ai/youtube.js";
import { USE_MOCK } from "./ai/client.js";
import { mockYouTubeSegments } from "./ai/mock.js";
import {
  createLecture, updateLecture, findLectureBySourceUrl, addSegments, deleteSegments, getTranscript,
} from "./state/store.js";

let demo = null; // the demo lecture, once known

export const getDemoLecture = () => demo;

// Mock transcripts are tagged source="mock"; older ones were saved as "youtube", so also
// recognise the canned mock text itself.
function isMockTranscript(segments) {
  return segments.some((s) => s.source === "mock")
    || (segments.length === mockYouTubeSegments.length && segments[0]?.text === mockYouTubeSegments[0].text);
}

export function videoIdOf(url) {
  return url ? new URL(url).searchParams.get("v") : null;
}

export async function ensureDemoLecture(io) {
  const url = normalizeYouTubeUrl(config.demoVideoUrl);
  if (!url) throw new Error(`DEMO_YOUTUBE_URL is not a valid YouTube URL: ${config.demoVideoUrl}`);

  let lecture = await findLectureBySourceUrl(url);
  if (lecture?.status === "ready") {
    const segments = await getTranscript(lecture.id);
    const isMock = isMockTranscript(segments);
    if (segments.length && (USE_MOCK || !isMock) && !config.demoReingest) {
      demo = lecture;
      console.log(`[demo] using stored ${isMock ? "MOCK " : ""}transcript for lecture ${lecture.id} (${segments.length} segments)`);
      return demo;
    }
    if (isMock && !USE_MOCK) console.log("[demo] stored transcript is mock data - replacing it with a real one");
    if (config.demoReingest) console.log("[demo] DEMO_REINGEST=true - re-transcribing");
  }

  // No usable transcript (first run, earlier failure, crash mid-ingest, or mock data): (re)build it.
  if (!lecture) {
    lecture = await createLecture({ title: config.demoVideoTitle, sourceUrl: url, status: "processing" });
  } else {
    await updateLecture(lecture.id, { status: "processing", error: null });
    lecture = { ...lecture, status: "processing", error: null };
  }
  demo = lecture;
  console.log(`[demo] transcribing ${url} into lecture ${lecture.id} ...`);
  ingest(io, lecture.id, url); // runs in the background; the server keeps serving
  return demo;
}

async function ingest(io, lectureId, url) {
  const emit = (payload) => io.to(lectureId).emit("lecture_status", { lectureId, ...payload });
  const started = Date.now();
  try {
    await deleteSegments(lectureId);
    const segments = await transcribeYouTube(url, {
      durationSec: config.demoVideoDurationSec,
      onProgress: (done, total) => {
        console.log(`[demo] transcribed ${done}/${total}`);
        emit({ status: "processing", progress: { done, total } });
      },
    });
    if (!segments.length) throw new Error("no speech found in video");
    await addSegments(lectureId, segments, USE_MOCK ? "mock" : "youtube");
    await updateLecture(lectureId, { status: "ready", error: null });
    demo = { ...demo, status: "ready", error: null };
    emit({ status: "ready", segmentCount: segments.length });
    console.log(`[demo] ready: ${segments.length} segments in ${Math.round((Date.now() - started) / 1000)}s`);
  } catch (e) {
    console.error("[demo] transcription failed:", e.message);
    await updateLecture(lectureId, { status: "failed", error: e.message }).catch(() => {});
    demo = { ...demo, status: "failed", error: e.message };
    emit({ status: "failed", error: e.message });
  }
}
