"""
Async AI question-triage worker (Section 2.3, 9.4.3-4).

Must never block Socket.IO event handling — this is run as a background
asyncio task (or an external queue consumer, if load requires it later),
not awaited inline in the request path unless `POST /api/qa/ask` is
confirmed to be synchronous (see DECISION NEEDED below).

DECISION NEEDED (Section 12.5): is /api/qa/ask synchronous (caller waits for
aiAnswer) or does it return immediately (202-style) with the answer pushed
later over a socket? This stub assumes synchronous for now because the
response schema (Section 8.3) has no "pending" state — confirm with backend
owner before relying on that assumption.

LLM provider/model/prompt/timeout/retry/confidence-threshold are all
unspecified (Section 2.3 "Important" note) — `_call_llm` is an intentional
placeholder.
"""

import uuid

from app.models.schemas import AskQuestionResponse
from app.services.transcript_buffer import get_buffer


async def _call_llm(question: str, transcript_context: str) -> tuple[str, str | None, bool]:
    """TODO: call the chosen LLM provider.

    Returns: (answer, supporting_quote_or_None, resolved)
    """
    raise NotImplementedError


async def triage_question(lecture_id: str, student_id: str, question: str) -> AskQuestionResponse:
    """Entry point called from POST /api/qa/ask.

    Consumes buffered transcript context, asks the LLM, and returns a
    questionId/aiAnswer/quote/resolved payload per Section 8.3.
    """
    buffer = get_buffer(lecture_id)
    context = buffer.recent_text()

    answer, quote, resolved = await _call_llm(question, context)

    return AskQuestionResponse(
        questionId=str(uuid.uuid4()),
        aiAnswer=answer,
        quote=quote,
        resolved=resolved,
    )
