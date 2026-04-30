from pydantic_settings import BaseSettings
from typing import Optional, List


class Settings(BaseSettings):
    # App
    APP_NAME: str = "Ex-Machina"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = False

    # Database
    DATABASE_URL: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/asystem"

    # Auth
    SECRET_KEY: str = "your-secret-key-change-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440  # 24 hours

    # OpenRouter
    OPENROUTER_API_KEY: str = ""
    OPENROUTER_BASE_URL: str = "https://openrouter.ai/api/v1"

    # CORS - supports comma-separated list in env var
    BACKEND_CORS_ORIGINS: str = "http://localhost:3000,http://localhost:3001"

    # AI defaults
    DEFAULT_AI_MODEL: str = "anthropic/claude-3.5-haiku"
    DEFAULT_MONTHLY_BUDGET: float = 5.0

    # Registration
    INVITE_CODE: str = "EXMACHINA2026"

    # Encryption
    TOKEN_ENCRYPTION_KEY: str = ""  # Fernet key for encrypting bot tokens in DB

    # Webhooks
    WEBHOOK_BASE_URL: str = ""  # Will be set to VPS URL

    # Frontend (used for inline-button deep links from manager TG notifications)
    FRONTEND_BASE_URL: str = "https://exmachina.up.railway.app"

    # Feature flag — followup messages ("are you still there?" 10/15 min after
    # bot reply). In-memory task tracking on multi-replica Railway can race and
    # spam the user with duplicate followups; this flag lets us kill it from
    # env without a redeploy when needed (set FOLLOWUP_ENABLED=false on Railway).
    FOLLOWUP_ENABLED: bool = True

    @property
    def cors_origins(self) -> List[str]:
        """Parse CORS origins from comma-separated string"""
        if isinstance(self.BACKEND_CORS_ORIGINS, str):
            return [origin.strip() for origin in self.BACKEND_CORS_ORIGINS.split(",")]
        return self.BACKEND_CORS_ORIGINS

    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()

# Fail-fast checks for production
if not settings.DEBUG:
    if settings.SECRET_KEY == "your-secret-key-change-in-production":
        raise RuntimeError("FATAL: Set SECRET_KEY in environment variables before running in production!")
    if settings.INVITE_CODE == "EXMACHINA2026":
        raise RuntimeError("FATAL: Set INVITE_CODE in environment variables before running in production!")
