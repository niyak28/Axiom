"""
Redis client wrapper — used for temporary, high-frequency telemetry state
(Section 3.2). Raw per-student scores live here; only aggregated rolling
averages get persisted to Supabase's `analytics` table.
"""

import redis.asyncio as redis
from app.config import settings

_client: redis.Redis | None = None


def get_redis() -> redis.Redis:
    global _client
    if _client is None:
        _client = redis.from_url(settings.redis_url, decode_responses=True)
    return _client


# --- Key helpers (stubs) ---
# DECISION NEEDED: rolling-window length, expiry policy, and handling of
# students who stop submitting mid-lecture are unspecified (Section 3.2).

def telemetry_key(lecture_id: str) -> str:
    return f"telemetry:{lecture_id}:scores"


async def record_score(lecture_id: str, student_id: str, score: int) -> None:
    """TODO: push/update this student's latest score for the lecture."""
    raise NotImplementedError


async def get_current_scores(lecture_id: str) -> dict[str, int]:
    """TODO: return {student_id: score} snapshot used by the aggregator."""
    raise NotImplementedError
