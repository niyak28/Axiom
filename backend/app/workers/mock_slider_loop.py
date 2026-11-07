"""
Demo-reliability loop: generates fake slider/cognitive scores so the demo
doesn't depend on real students connecting (Section 9.4.9). Gate this
behind a flag — never run it alongside real student telemetry, or it'll
pollute the rolling average.

Real scores now arrive via POST /api/telemetry/friction rather than a
socket event, so this writes straight to `record_score` — the same
function that route calls — instead of going through any socket/HTTP
layer. That keeps the mock data indistinguishable from real data as far
as the aggregator is concerned.
"""

import asyncio
import random

from app.services.redis_client import record_score


async def run_mock_loop(lecture_id: str, interval_seconds: float = 3.0) -> None:
    fake_student_ids = [f"demo_student_{i}" for i in range(5)]
    while True:
        for student_id in fake_student_ids:
            await record_score(lecture_id, student_id, random.randint(1, 10))
        await asyncio.sleep(interval_seconds)
