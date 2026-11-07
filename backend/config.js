// Loads env vars. The repo-root .env is loaded first so its values win;
// backend/.env only fills in anything missing. Real shell env vars beat both.
import { fileURLToPath } from "url";
import path from "path";
import dotenv from "dotenv";

const here = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(here, "..", ".env"), quiet: true });
dotenv.config({ path: path.join(here, ".env"), quiet: true });

const env = process.env;
const first = (...names) => names.map((n) => env[n]?.trim()).find(Boolean) || "";
const list = (s) => s.split(",").map((x) => x.trim()).filter(Boolean);

export const config = {
  port: Number(env.PORT) || 4000,
  geminiApiKey: first("GEMINI_API_KEY"),
  // Comma-separated lists; later models are fallbacks when earlier ones are overloaded.
  // Transcription quality matters more than speed; answers need to be fast.
  geminiModels: list(first("GEMINI_MODEL") || "gemini-3.8-flash,gemini-3.7-flash,gemini-3.5-flash"),
  geminiAnswerModels: list(first("GEMINI_ANSWER_MODEL") || "gemini-3.5-flash,gemini-3.5-flash-lite"),
  geminiTimeoutMs: Number(env.GEMINI_TIMEOUT_MS) || 15000,
  useMockAi: env.USE_MOCK_AI === "true",
  useMemoryStore: env.USE_MEMORY_STORE === "true", // skip Supabase, keep data in memory (dev/testing)
  supabaseUrl: first("SUPABASE_URL", "VITE_SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_URL"),
  // Must be the secret/service-role key: the backend writes to tables.
  supabaseKey: first("SUPABASE_SERVICE_KEY", "SUPABASE_SERVICE_ROLE_KEY"),
  // Set DEMO_REINGEST=true to force a fresh transcription of the demo video on startup.
  demoReingest: env.DEMO_REINGEST === "true",
  // The one video used for the demo. Transcribed automatically at startup, stored, and reused.
  // Default: MIT OCW "Independence, Basis, and Dimension" (13:19).
  // If you override DEMO_YOUTUBE_URL, also set DEMO_VIDEO_DURATION_SEC for videos over 10 min.
  ...(first("DEMO_YOUTUBE_URL")
    ? {
      demoVideoUrl: first("DEMO_YOUTUBE_URL"),
      demoVideoTitle: first("DEMO_LECTURE_TITLE") || "Demo lecture",
      demoVideoDurationSec: Number(env.DEMO_VIDEO_DURATION_SEC) || null,
    }
    : {
      demoVideoUrl: "https://www.youtube.com/watch?v=eeMJg4uI7o0",
      demoVideoTitle: first("DEMO_LECTURE_TITLE") || "Independence, Basis, and Dimension",
      demoVideoDurationSec: 799,
    }),
};
