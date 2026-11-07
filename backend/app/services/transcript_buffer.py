"""
In-memory asynchronous buffer for incoming lecture transcript chunks
(Section 2.3, 9.4.2). The AI triage worker reads from this buffer to ground
its answers and to source the `quote` field.

DECISION NEEDED (Section 12.6): no ingest mechanism or chunk format is
documented. This stub assumes short text chunks with a timestamp; revisit
once the live-transcription pipeline is defined.
"""

import time
from collections import deque


class TranscriptBuffer:
    def __init__(self, max_chunks: int = 500):
        self._chunks: deque[tuple[float, str]] = deque(maxlen=max_chunks)

    def add_chunk(self, text: str) -> None:
        self._chunks.append((time.time(), text))

    def recent_text(self, seconds: float = 120.0) -> str:
        """Return concatenated transcript text from the last `seconds`."""
        cutoff = time.time() - seconds
        return " ".join(text for ts, text in self._chunks if ts >= cutoff)


# One buffer per active lecture. Replace with a proper lecture-session
# registry once lecture lifecycle routes exist (Section 12.8).
_buffers: dict[str, TranscriptBuffer] = {}


def get_buffer(lecture_id: str) -> TranscriptBuffer:
    if lecture_id not in _buffers:
        _buffers[lecture_id] = TranscriptBuffer()
    return _buffers[lecture_id]
