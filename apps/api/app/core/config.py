"""Application configuration loaded from environment variables via Pydantic Settings."""

from functools import lru_cache
from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict

# apps/api/.env (local dev). In Docker, env vars come from the container environment.
ENV_FILE = Path(__file__).resolve().parents[2] / ".env"


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=ENV_FILE,
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    # App
    app_name: str = "AccountPilot AI"
    app_env: str = "development"
    app_port: int = 8000
    secret_key: str = "CHANGE_ME"
    api_v1_prefix: str = "/api/v1"

    # Database
    postgres_host: str = "localhost"
    postgres_port: int = 5432
    postgres_db: str = "accountpilot"
    postgres_user: str = "postgres"
    postgres_password: str = "postgres"
    database_url: str | None = None

    # Redis
    redis_host: str = "localhost"
    redis_port: int = 6379

    # Auth
    jwt_secret: str = ""
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 60

    # CORS
    cors_origins: list[str] = ["http://localhost:3000"]

    @property
    def sqlalchemy_database_url(self) -> str:
        if self.database_url:
            url = self.database_url
            # Supabase (and most managed Postgres) require SSL
            if "supabase.co" in url and "sslmode=" not in url:
                separator = "&" if "?" in url else "?"
                url = f"{url}{separator}sslmode=require"
            return url
        return (
            f"postgresql://{self.postgres_user}:{self.postgres_password}"
            f"@{self.postgres_host}:{self.postgres_port}/{self.postgres_db}"
        )

    @property
    def jwt_signing_key(self) -> str:
        return self.jwt_secret or self.secret_key

    @property
    def is_development(self) -> bool:
        return self.app_env.lower() == "development"


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
