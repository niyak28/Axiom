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


class _InMemoryRedis:
    """Minimal stand-in for the hash commands we use (dev only)."""

    def __init__(self) -> None:
        self._hashes: dict[str, dict[str, str]] = {}

    async def hset(self, key: str, field: str, value) -> None:
        self._hashes.setdefault(key, {})[field] = str(value)

    async def hgetall(self, key: str) -> dict[str, str]:
        return dict(self._hashes.get(key, {}))


_memory_client = _InMemoryRedis()


def _store():
    return _memory_client if settings.use_in_memory_redis else get_redis()


async def record_score(lecture_id: str, student_id: str, score: int) -> None:
    """Store this student's latest score for the lecture (one entry per student)."""
    await _store().hset(telemetry_key(lecture_id), student_id, score)


async def get_current_scores(lecture_id: str) -> dict[str, int]:
    """Return {student_id: score} snapshot used by the aggregator."""
    raw = await _store().hgetall(telemetry_key(lecture_id))
    return {student_id: int(score) for student_id, score in raw.items()}
