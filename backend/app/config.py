"""
Centralized settings loaded from environment variables.

Nothing here should be hardcoded — URLs, keys, and ports all come from env
vars per Section 11 of the project context doc. Values below are the
documented/known ones; anything marked unspecified still needs a default
decided by the team.
"""

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # --- Server ---
    port: int = 8000
    cors_allowed_origins: list[str] = ["http://localhost:5173"]

    # --- Supabase ---
    supabase_url: str = ""
    supabase_service_role_key: str = ""

    # --- Redis ---
    redis_url: str = "redis://localhost:6379/0"

    # --- LLM (provider not specified in project context) ---
    llm_provider: str = ""
    llm_api_key: str = ""
    llm_model: str = ""

    # --- Telemetry ---
    # Documented cadence: aggregate rolling average ~every 2 seconds.
    telemetry_aggregation_interval_seconds: float = 2.0

    # --- Contract constants (do not change without confirming) ---
    question_max_length: int = 500
    cognitive_score_min: int = 1
    cognitive_score_max: int = 10

    class Config:
        env_file = ".env"


settings = Settings()
