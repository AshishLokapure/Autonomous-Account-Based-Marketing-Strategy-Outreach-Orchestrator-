from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "AccountPilot AI API"
    app_env: str = "development"
    api_v1_prefix: str = "/api/v1"
    database_url: str = "sqlite:///./accountpilot_demo.db"
    jwt_secret_key: str = ""
    jwt_algorithm: str = "HS256"
    cors_origins: str = (
        "http://localhost:3000,"
        "http://127.0.0.1:3000,"
        "http://localhost:3001,"
        "http://127.0.0.1:3001,"
        "http://localhost:3002,"
        "http://127.0.0.1:3002,"
        "https://innovahack-zeta.vercel.app,"
        "https://innovahack-1yxdrokox-manthann-0s-projects.vercel.app"
    )
    mail_server: str = ""
    mail_port: int = 587
    mail_username: str = ""
    mail_password: str = ""
    mail_from: str = ""
    mail_from_name: str = "Marketing Agent"

    supabase_url: str = ""
    supabase_anon_key: str = ""
    groq_api_key: str = ""
    grok_api_key: str = ""
    xai_api_key: str = ""
    sendinblue_api_key: str = ""
    brevo_api_key: str = ""

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    @property
    def cors_origin_list(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]

    @property
    def is_development(self) -> bool:
        return self.app_env.lower() == "development"

    @property
    def jwt_signing_key(self) -> str:
        return self.jwt_secret_key


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
