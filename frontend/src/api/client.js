const backendUrl = (import.meta.env.VITE_BACKEND_URL || "").replace(/\/$/, "");

function demoResponse(data, delay = 420) {
  return new Promise((resolve) => {
    window.setTimeout(() => resolve({ ...data, demo: true }), delay);
  });
}

export class ApiError extends Error {
  constructor(message, status, details) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.details = details;
  }
}

async function request(path, options = {}) {
  if (!backendUrl) {
    throw new ApiError(
      "Backend integration is not configured. Set VITE_BACKEND_URL to connect.",
      0,
    );
  }

  const isFormData = options.body instanceof FormData;
  const headers = new Headers(options.headers);
  if (options.body && !isFormData && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  let response;
  try {
    response = await fetch(`${backendUrl}${path}`, { ...options, headers });
  } catch (error) {
    throw new ApiError("Unable to reach the Axiom backend.", 0, error);
  }

  const contentType = response.headers.get("content-type") || "";
  const data = contentType.includes("application/json")
    ? await response.json()
    : await response.text();

  if (!response.ok) {
    const message =
      data?.message || data?.error || `Request failed with status ${response.status}.`;
    throw new ApiError(message, response.status, data);
  }

  return data;
}

function jsonBody(payload) {
  return JSON.stringify(payload);
}

export function uploadLectureRecording(file, lectureId) {
  if (!backendUrl) {
    return demoResponse({
      recordingId: `recording-${Date.now()}`,
      lectureId,
      filename: file.name,
      status: "received",
    }, 850);
  }
  const formData = new FormData();
  formData.append("file", file);
  formData.append("lectureId", lectureId);
  return request("/api/lecture/recording", { method: "POST", body: formData });
}

export function isBackendConfigured() {
  return Boolean(backendUrl);
}

// Transcript of the demo lecture video: [{ startSec, endSec, text }]. Empty when no backend.
export function getDemoTranscript() {
  if (!backendUrl) return Promise.resolve([]);
  return request("/api/lectures/demo/transcript");
}

export function askQuestion(payload) {
  if (!backendUrl) {
    return demoResponse({ questionId: `question-${Date.now()}`, ...payload });
  }
  return request("/api/qa/ask", { method: "POST", body: jsonBody(payload) });
}

export function escalateQuestion(payload) {
  if (!backendUrl) {
    return demoResponse({ ...payload, status: "escalated" });
  }
  return request("/api/qa/escalate", {
    method: "POST",
    body: jsonBody(payload),
  });
}

export function getLectureSummary(lectureId) {
  if (!backendUrl) {
    return demoResponse({ lectureId, status: "ready" });
  }
  return request(`/api/lecture/${encodeURIComponent(lectureId)}/summary`);
}

export function getLectureHeatmap(lectureId) {
  if (!backendUrl) {
    return demoResponse({ lectureId, status: "streaming" });
  }
  return request(`/api/telemetry/heatmap/${encodeURIComponent(lectureId)}`);
}

export function sendFrictionScore(payload) {
  if (!backendUrl) {
    return demoResponse({ ...payload, accepted: true }, 260);
  }
  return request("/api/telemetry/friction", {
    method: "POST",
    body: jsonBody(payload),
  });
}

export function pingBackend() {
  if (!backendUrl) {
    return demoResponse({ message: "pong", latency: 24 }, 180);
  }
  return request("/api/rehearsal/ping", {
    method: "POST",
    body: jsonBody({ message: "ping" }),
  });
}
