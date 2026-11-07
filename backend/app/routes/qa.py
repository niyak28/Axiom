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
    print(">>> HIT /api/qa/ask ENDPOINT SUCCESSFULLY <<<")
    try:
        result = await triage_question(
            lecture_id=payload.lectureId,
            student_id=payload.studentId,
            question=payload.question,
        )

        await insert_chat_log(
            lecture_id=payload.lectureId,
            student_id=payload.studentId,
            question=payload.question,
            ai_answer=result.aiAnswer,
            quote=result.quote,
            is_escalated=not result.resolved,
        )
        return result
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise e

@router.post("/escalate", response_model=EscalateQuestionResponse)
async def escalate_question(payload: EscalateQuestionRequest) -> EscalateQuestionResponse:
    # TODO: mark chat_logs.is_escalated = true for this questionId
    # TODO: emit `qna_queue_update` to the professor room via Socket.IO
    return EscalateQuestionResponse(success=True, status="escalated")
