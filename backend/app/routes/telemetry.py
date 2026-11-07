"""
POST /api/telemetry/friction, GET /api/telemetry/heatmap/:lectureId
(Section 5.5, 5.6).

RESOLVED (was Section 12.1): slider/cognitive scores come in exclusively
over this REST route now — the `cognitive_update` Socket.IO event is not
used for inbound student data. `record_score` stays the single write path
into Redis either way, so the aggregator doesn't care how a score arrived.
"""

from fastapi import APIRouter

from app.models.schemas import TelemetryFrictionRequest, TelemetryHeatmapResponse
from app.services.redis_client import record_score

router = APIRouter(prefix="/api/telemetry", tags=["telemetry"])


@router.post("/friction")
async def submit_friction_score(payload: TelemetryFrictionRequest):
    """
    This is now the only inbound path for slider/cognitive scores — the
    frontend posts here on slider release instead of emitting a socket
    event. The aggregator loop (telemetry_aggregator.py) still runs on its
    own ~2s cadence and reads whatever's in Redis; this route's only job is
    to write the latest score.
    """
    # Response shape not specified in the source (Section 5.6) — 200/success for now.
    await record_score(payload.lectureId, payload.studentId, payload.score)
    return {"success": True}


@router.get("/heatmap/{lecture_id}", response_model=TelemetryHeatmapResponse)
async def get_heatmap(lecture_id: str) -> TelemetryHeatmapResponse:
    # TODO: read latest aggregated sample for this lecture (from Redis cache
    # of the last computed value, or the most recent `analytics` row).
    raise NotImplementedError
