"""
POST /api/telemetry/friction, GET /api/telemetry/heatmap/:lectureId
(Section 5.5, 5.6).

DECISION NEEDED (Section 12.1): both this REST route and the socket
`cognitive_update` event are documented for submitting a score. This stub
implements the REST path; keep `record_score` as the single write path so
whichever transport(s) end up supported funnel through one place.
"""

from fastapi import APIRouter

from app.models.schemas import TelemetryFrictionRequest, TelemetryHeatmapResponse
from app.services.redis_client import record_score

router = APIRouter(prefix="/api/telemetry", tags=["telemetry"])


@router.post("/friction")
async def submit_friction_score(payload: TelemetryFrictionRequest):
    # Response shape not specified in the source (Section 5.6) — 204 for now.
    await record_score(payload.lectureId, payload.studentId, payload.score)
    return {"success": True}


@router.get("/heatmap/{lecture_id}", response_model=TelemetryHeatmapResponse)
async def get_heatmap(lecture_id: str) -> TelemetryHeatmapResponse:
    # TODO: read latest aggregated sample for this lecture (from Redis cache
    # of the last computed value, or the most recent `analytics` row).
    raise NotImplementedError
