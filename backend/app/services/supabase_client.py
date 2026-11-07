"""
Supabase client wrapper.

Tables (Section 7): lectures, analytics, chat_logs, summaries.
Hackathon scope: no RLS policies and no route-level authorization — this
client uses the service role key and that's fine as-is (Section 12.10's
"no auth documented" is resolved as "not needed," not "still open").
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

async def ping_db() -> bool:
    """Lightweight connectivity check for POST /api/rehearsal/ping."""
    try:
        client = get_supabase()
        # Query a lightweight table from Section 7 (e.g., lectures) to verify connectivity
        client.table("lectures").select("id", count="exact").limit(1).execute()
        return True
    except Exception as e:
        print(f"DB ping error: {e}")
        return False
