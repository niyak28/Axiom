import { USE_MOCK, generate } from "./client.js";
import { mockTranscript } from "./mock.js";

export async function transcribeChunk(base64Audio, mimeType = "audio/webm") {
  if (USE_MOCK) return mockTranscript;
  const res = await generate({
    contents: [{ role: "user", parts: [
      { inlineData: { mimeType, data: base64Audio } },
      { text: "Transcribe this lecture audio verbatim. Write math in plain words (e.g. 'x squared'). If there is no speech, output nothing. Output only the transcript." },
    ]}],
  }, { label: "transcribe" });
  return (res.text || "").trim();
}