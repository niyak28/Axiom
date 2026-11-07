"""GET /api/lecture/:id/summary (Section 5.4)."""

from fastapi import APIRouter, HTTPException

from app.models.schemas import LectureSummaryResponse
from app.services.supabase_client import get_summary

router = APIRouter(prefix="/api/lecture", tags=["lecture"])


@router.get("/{lecture_id}/summary", response_model=LectureSummaryResponse)
async def get_lecture_summary(lecture_id: str) -> LectureSummaryResponse:
    # DECISION NEEDED (Section 12.8): no documented summary-generation
    # trigger. This assumes the summary already exists in `summaries` by
    # the time this is called; if generation is on-demand, this route
    # needs to trigger it instead of just reading.
    row = await get_summary(lecture_id)
    if row is None:
        raise HTTPException(status_code=404, detail="Summary not found")
    return LectureSummaryResponse(**row)
