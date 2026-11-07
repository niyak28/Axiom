import { config } from "../config.js";
import { GoogleGenAI } from "@google/genai";

export const USE_MOCK = config.useMockAi;
export const MODELS = config.geminiModels;          // transcription / visuals
export const ANSWER_MODELS = config.geminiAnswerModels; // student Q&A
export const MODEL = MODELS[0];
const TIMEOUT_MS = config.geminiTimeoutMs;

if (!USE_MOCK && !config.geminiApiKey) {
  throw new Error("GEMINI_API_KEY is not set (or set USE_MOCK_AI=true)");
}

// Only construct the real client when we'll actually call Gemini.
export const ai = USE_MOCK ? null : new GoogleGenAI({ apiKey: config.geminiApiKey });

// Reject if a Gemini call takes too long, so requests never hang.
export function withTimeout(promise, ms = TIMEOUT_MS) {
  let timer;
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(() => reject(new Error(`Gemini call timed out after ${ms}ms`)), ms);
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}

// Errors worth retrying: rate limits, overload, server errors, timeouts.
function isTransient(e) {
  const msg = String(e?.message || "");
  const code = e?.status ?? Number(msg.match(/"code":\s*(\d{3})/)?.[1]);
  return [429, 500, 502, 503, 504].includes(code) || /timed out|UNAVAILABLE|RESOURCE_EXHAUSTED|fetch failed|ECONNRESET/i.test(msg);
}

/**
 * Run a Gemini call with a timeout, retrying transient failures with backoff.
 *   withRetry(() => ai.models.generateContent({...}), { retries: 3, timeoutMs: 60000 })
 */
export async function withRetry(fn, { retries = 2, timeoutMs = TIMEOUT_MS, baseDelayMs = 2000, label = "gemini" } = {}) {
  for (let attempt = 0; ; attempt++) {
    try {
      return await withTimeout(fn(), timeoutMs);
    } catch (e) {
      if (attempt >= retries || !isTransient(e)) throw e;
      const delay = baseDelayMs * 2 ** attempt + Math.random() * 1000;
      console.warn(`[${label}] transient error (attempt ${attempt + 1}/${retries + 1}), retrying in ${Math.round(delay / 1000)}s: ${String(e.message).slice(0, 120)}`);
      await new Promise((r) => setTimeout(r, delay));
    }
  }
}

const isModelMissing = (e) => /"code":\s*404|NOT_FOUND|no longer available/i.test(String(e?.message || ""));

/**
 * generateContent with retries and model fallback: each model gets `retriesPerModel`
 * retries on transient errors, then the next model in `models` is tried.
 *   generate({ contents, config }, { models: ANSWER_MODELS, timeoutMs: 20000, label: "triage" })
 */
export async function generate(request, { models = MODELS, retriesPerModel = 1, timeoutMs = TIMEOUT_MS, baseDelayMs = 2000, label = "gemini" } = {}) {
  let lastErr;
  for (const [i, model] of models.entries()) {
    try {
      return await withRetry(() => ai.models.generateContent({ ...request, model }),
        { retries: retriesPerModel, timeoutMs, baseDelayMs, label: `${label}:${model}` });
    } catch (e) {
      lastErr = e;
      if (!isTransient(e) && !isModelMissing(e)) throw e;
      if (i + 1 < models.length) console.warn(`[${label}] ${model} unavailable, falling back to ${models[i + 1]}`);
    }
  }
  throw lastErr;
}
