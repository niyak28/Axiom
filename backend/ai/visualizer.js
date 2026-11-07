import { Type } from "@google/genai";
import { USE_MOCK, ANSWER_MODELS, generate } from "./client.js";
import { getTranscript, segmentsToText } from "../state/store.js";
import { mockVisual } from "./mock.js";

const FRAME_TYPES = ["matrix", "vector_space", "graph", "none"];

// videoTime: playback position for YouTube lectures (uses the last 2 min of video before it).
export async function generateVisual(lectureId, { videoTime = null } = {}) {
  if (USE_MOCK) return { lectureId, ...mockVisual };
  const recent = segmentsToText(await getTranscript(lectureId, { videoTime, windowSec: 120, minutes: 2 }));
  if (!recent) return { lectureId, frameType: "none" };
  try {
    const res = await generate({
      contents: `Recent lecture content:\n${recent}`,
      config: {
        systemInstruction:
          "If the content teaches a visualizable math concept, return a frame. Otherwise frameType 'none'. Matrices at most 4x4, at most 20 coordinates, numbers only.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            frameType: { type: Type.STRING, enum: FRAME_TYPES },
            data: { type: Type.OBJECT, properties: {
              matrix: { type: Type.ARRAY, items: { type: Type.ARRAY, items: { type: Type.NUMBER } } },
              coordinates: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: {
                x: { type: Type.NUMBER }, y: { type: Type.NUMBER }, z: { type: Type.NUMBER } } } },
              label: { type: Type.STRING },
            }},
          },
          required: ["frameType"],
        },
      },
    }, { models: ANSWER_MODELS, label: "visual" });
    const out = JSON.parse(res.text);
    if (!FRAME_TYPES.includes(out.frameType)) return { lectureId, frameType: "none" };
    return { lectureId, ...out };
  } catch (e) {
    console.error("visual failed:", e.message);
    return { lectureId, frameType: "none" };
  }
}