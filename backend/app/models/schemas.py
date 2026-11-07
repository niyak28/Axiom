"""
Pydantic models mirroring the documented API contract (Section 5 & 8 of the
project context doc). Field names and types are reproduced exactly as
documented — do not rename or retype without updating the contract doc first.
"""

from typing import Any, Literal
from pydantic import BaseModel, Field


# --- 8.1 Cognitive telemetry: student -> professor/backend ---
class CognitiveUpdate(BaseModel):
    lectureId: str
    studentId: str
    score: int = Field(ge=1, le=10)


# --- 5.6 POST /api/telemetry/friction (request) ---
class TelemetryFrictionRequest(BaseModel):
    lectureId: str
    studentId: str
    score: int = Field(ge=1, le=10)


# --- 5.5 GET /api/telemetry/heatmap/:lectureId (response) ---
class TelemetryHeatmapResponse(BaseModel):
    rollingAverage: float  # DECISION NEEDED: 0-10 vs 0-1 scale, see Section 12.2
    sampleCount: int
    timestamp: str


# --- 8.2 Student question: student -> AI (POST /api/qa/ask request) ---
class AskQuestionRequest(BaseModel):
    lectureId: str
    studentId: str
    question: str = Field(max_length=500)


# --- 8.3 AI response: AI -> student (POST /api/qa/ask response) ---
class AskQuestionResponse(BaseModel):
    questionId: str
    aiAnswer: str
    quote: str | None = None
    resolved: bool


# --- POST /api/qa/escalate (request) ---
class EscalateQuestionRequest(BaseModel):
    lectureId: str
    questionId: str
    studentId: str
    question: str


# --- 8.4 Question escalation: AI -> professor (POST /api/qa/escalate response) ---
class EscalateQuestionResponse(BaseModel):
    success: bool
    status: Literal["escalated"] = "escalated"


# --- 5.4 GET /api/lecture/:id/summary (response) ---
class LectureSummaryResponse(BaseModel):
    lectureId: str
    notesMarkdown: str
    keyTakeaways: list[str]
    generatedVisuals: list[dict[str, Any]]


# --- 5.1 POST /api/notes/upload (response) ---
class NotesUploadResponse(BaseModel):
    success: bool
    visualId: str
    coordinates: dict[str, Any] = {}  # schema unspecified, see Section 5.1


# --- 8.5 Visualizer payload (socket: visual_frame_update) ---
class VisualFramePayload(BaseModel):
    lectureId: str
    frameType: Literal["matrix", "vector_space", "graph"]
    data: dict[str, Any]


# --- 5.7 POST /api/rehearsal/ping ---
class RehearsalPingRequest(BaseModel):
    message: str


class RehearsalPingResponse(BaseModel):
    status: Literal["ok"] = "ok"
    message: Literal["pong"] = "pong"
    dbConnected: bool


# --- 6.1 Socket: toggle_qna (client -> server) ---
class ToggleQnaPayload(BaseModel):
    lectureId: str
    isQnaOpen: bool


# --- 6.2 Socket: qna_state_change (server -> client) ---
class QnaStateChangePayload(BaseModel):
    isQnaOpen: bool


# --- 6.3 Socket: qna_queue_update (server -> client) ---
class QueuedQuestion(BaseModel):
    questionId: str
    question: str
    studentId: str


class QnaQueueUpdatePayload(BaseModel):
    questions: list[QueuedQuestion]
