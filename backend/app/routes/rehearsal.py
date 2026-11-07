"""POST /api/rehearsal/ping — end-to-end connectivity check (Section 5.7, 9.3)."""

from fastapi import APIRouter

from app.models.schemas import RehearsalPingRequest, RehearsalPingResponse
from app.services.supabase_client import ping_db

router = APIRouter(prefix="/api/rehearsal", tags=["rehearsal"])


@router.post("/ping", response_model=RehearsalPingResponse)
async def ping(payload: RehearsalPingRequest) -> RehearsalPingResponse:
    try:
        db_connected = await ping_db()
    except NotImplementedError:
        db_connected = False  # stub default until ping_db is implemented
    return RehearsalPingResponse(dbConnected=db_connected)
