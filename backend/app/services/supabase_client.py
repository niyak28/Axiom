"""
Supabase client wrapper.

Tables (Section 7): lectures, analytics, chat_logs, summaries.
No auth/RLS is documented yet (Section 12.10) — this client uses the
service role key, so route-level authorization (if any) must be enforced
in the route layer, not assumed here.
"""

from supabase import create_client, Client
from app.config import settings

_client: Client | None = None


def get_supabase() -> Client:
    global _client
    if _client is None:
        _client = create_client(settings.supabase_url, settings.supabase_service_role_key)
    return _client


# --- Table helpers (stubs) ---
# Keep DB access behind helpers rather than scattering `.table(...)` calls
# across routes, so a schema change touches one place.

async def insert_chat_log(*, lecture_id: str, student_id: str, question: str,
                           ai_answer: str | None, quote: str | None,
                           is_escalated: bool) -> dict:
    """TODO: insert into chat_logs, matching columns in Section 7.3."""
    raise NotImplementedError


async def insert_analytics_sample(*, lecture_id: str, rolling_average: float,
                                   sample_count: int) -> dict:
    """TODO: insert into analytics, matching columns in Section 7.2."""
    raise NotImplementedError


async def get_summary(lecture_id: str) -> dict | None:
    """TODO: fetch from summaries table for GET /api/lecture/:id/summary."""
    raise NotImplementedError


async def ping_db() -> bool:
    """Lightweight connectivity check for POST /api/rehearsal/ping."""
    raise NotImplementedError
