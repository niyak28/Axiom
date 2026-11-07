"""
Background loop that aggregates per-student cognitive scores into a rolling
class average every ~2 seconds (Section 3.2, 9.4.8), persists samples to
Supabase `analytics`, and should broadcast the result to professors.

DECISION NEEDED (Section 12.3): no socket event name is documented for
broadcasting updated rolling averages to the professor UI. `qna_state_change`-
style naming (e.g. `telemetry_update`) is a reasonable placeholder but must
be confirmed/added to the shared contract before the frontend binds to it.
"""

import asyncio

from app.config import settings
from app.services.redis_client import get_current_scores
from app.services.supabase_client import insert_analytics_sample


async def compute_rolling_average(lecture_id: str) -> tuple[float, int]:
    """TODO: pull current scores from Redis and compute the rolling average.

    DECISION NEEDED (Section 12.2): confirm output scale — 1-10 (matches the
    `analytics.rolling_average` column) or 0-1 (matches the heatmap API
    example in Section 5.5). Do not silently pick one.
    """
    scores = await get_current_scores(lecture_id)
    raise NotImplementedError


async def aggregation_loop(lecture_id: str, sio, stop_event: asyncio.Event) -> None:
    """Runs for the lifetime of an active lecture. Call via asyncio.create_task
    when a lecture starts; cancel/stop via `stop_event` when it ends.
    """
    while not stop_event.is_set():
        try:
            rolling_average, sample_count = await compute_rolling_average(lecture_id)
            await insert_analytics_sample(
                lecture_id=lecture_id,
                rolling_average=rolling_average,
                sample_count=sample_count,
            )
            # TODO: emit to professor UI once the broadcast event name is confirmed.
            # await sio.emit("telemetry_update", {...}, room=lecture_id)
        except NotImplementedError:
            pass  # stub — remove once compute_rolling_average is implemented
        await asyncio.sleep(settings.telemetry_aggregation_interval_seconds)
