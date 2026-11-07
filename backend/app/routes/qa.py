"""POST /api/qa/ask, POST /api/qa/escalate (Section 5.2, 5.3)."""

from fastapi import APIRouter

from app.models.schemas import (
    AskQuestionRequest,
    AskQuestionResponse,
    EscalateQuestionRequest,
    EscalateQuestionResponse,
)
from app.services.ai_triage import triage_question
from app.services.supabase_client import insert_chat_log

router = APIRouter(prefix="/api/qa", tags=["qa"])


@router.post("/ask", response_model=AskQuestionResponse)
async def ask_question(payload: AskQuestionRequest) -> AskQuestionResponse:
    # DECISION NEEDED (Section 12.5): sync vs async response — see ai_triage.py.
    result = await triage_question(
        lecture_id=payload.lectureId,
        student_id=payload.studentId,
        question=payload.question,
    )

    try:
        await insert_chat_log(
            lecture_id=payload.lectureId,
            student_id=payload.studentId,
            question=payload.question,
            ai_answer=result.aiAnswer,
            quote=result.quote,
            is_escalated=not result.resolved,
        )
    except NotImplementedError:
        pass  # stub

    # TODO: if not result.resolved, route to escalation (auto, or require
    # explicit POST /api/qa/escalate from the client? not documented).

    return result


@router.post("/escalate", response_model=EscalateQuestionResponse)
async def escalate_question(payload: EscalateQuestionRequest) -> EscalateQuestionResponse:
    # TODO: mark chat_logs.is_escalated = true for this questionId
    # TODO: emit `qna_queue_update` to the professor room via Socket.IO
    return EscalateQuestionResponse(success=True, status="escalated")
