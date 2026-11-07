import { Type } from "@google/genai";
import { USE_MOCK, ANSWER_MODELS, generate } from "./client.js";
import { getTranscript, segmentsToText, findQuoteStart } from "../state/store.js";
import { mockAnswer } from "./mock.js";

// videoTime: current playback position (seconds) for YouTube lectures, so the AI
// only uses what has been said so far. Omit for live lectures.
export async function answerQuestion(lectureId, question, { videoTime = null } = {}) {
  const segments = await getTranscript(lectureId, { videoTime, minutes: 10 });
  if (USE_MOCK) return { ...mockAnswer, quoteStartSec: findQuoteStart(segments, mockAnswer.quote) };
  if (!segments.length) {
    return { aiAnswer: "No lecture content captured yet.", quote: null, quoteStartSec: null, resolved: false };
  }
  try {
    const res = await generate({
      contents: `LECTURE TRANSCRIPT (so far):\n${segmentsToText(segments)}\n\nSTUDENT QUESTION: ${question}`,
      config: {
        systemInstruction:
          "You are a teaching assistant for this lecture. Answer the student's question ONLY using the transcript. " +
          "Keep the answer short and clear (2-4 sentences), in plain text: no LaTeX, no markdown " +
          "(write math like 'Ax = 0' or 'A inverse'). " +
          "Put the professor's exact words that best support your answer in 'quote', copied verbatim from the transcript, " +
          "without the [mm:ss] timestamp. " +
          "If the transcript does not answer the question, set resolved=false and quote=null, and say briefly that " +
          "the question has been passed to the professor.",
        thinkingConfig: { thinkingLevel: "low" }, // keeps answers to a few seconds
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            aiAnswer: { type: Type.STRING },
            quote: { type: Type.STRING, nullable: true },
            resolved: { type: Type.BOOLEAN },
          },
          required: ["aiAnswer", "resolved"],
        },
      },
    }, { models: ANSWER_MODELS, retriesPerModel: 1, timeoutMs: 15000, baseDelayMs: 1000, label: "triage" });
    const out = JSON.parse(res.text);
    const quote = out.quote || null;
    return { aiAnswer: out.aiAnswer, quote, quoteStartSec: findQuoteStart(segments, quote), resolved: !!out.resolved };
  } catch (e) {
    console.error("triage failed:", e.message);
    return { aiAnswer: "Couldn't answer right now. Forwarded to the professor.", quote: null, quoteStartSec: null, resolved: false };
  }
}
