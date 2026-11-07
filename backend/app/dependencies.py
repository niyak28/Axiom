"""
Shared FastAPI dependency providers. Kept thin on purpose — the actual
clients live in app/services/*_client.py so socket handlers and background
workers (which aren't FastAPI routes and can't use `Depends`) can reach them
the same way routes do.
"""

from app.services.supabase_client import get_supabase
from app.services.redis_client import get_redis


def supabase_dependency():
    return get_supabase()


def redis_dependency():
    return get_redis()
