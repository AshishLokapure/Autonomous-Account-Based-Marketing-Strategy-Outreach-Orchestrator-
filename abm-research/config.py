"""Central configuration — all values from environment variables.

Copy .env.example to .env and fill in your keys.
"""
import os
from functools import lru_cache
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    # LLM
    openai_api_key: str = ""
    openai_model: str = "gpt-4o-mini"
    openai_temperature: float = 0.2

    # Reddit / PRAW
    reddit_client_id: str = ""
    reddit_client_secret: str = ""
    reddit_user_agent: str = "abm-research-bot/1.0"

    # Pipeline limits
    max_pages_per_company: int = 10
    max_content_length: int = 15000
    request_timeout: int = 10
    max_reddit_results_per_query: int = 10
    max_comments_per_post: int = 5
    max_reddit_queries_per_company: int = 6
    concurrency_limit: int = 5

    # Scoring weights (must sum to 1.0)
    weight_pain_match: float = 0.25
    weight_product_match: float = 0.20
    weight_business_trigger: float = 0.15
    weight_hiring_growth: float = 0.10
    weight_technology: float = 0.10
    weight_reddit: float = 0.10
    weight_recency: float = 0.05
    weight_evidence_quality: float = 0.05

    # Output
    output_path: str = "data/research_results.json"

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
