"""Pydantic models for evidence items."""
from datetime import datetime
from typing import Optional, Literal
from pydantic import BaseModel, Field


SignalType = Literal[
    "pain", "hiring", "expansion", "funding", "product_launch", "partnership",
    "acquisition", "leadership_change", "technology", "customer_signal",
    "competitor_signal", "market_signal", "strategic_initiative", "growth", "purchase_intent"
]

Classification = Literal["FACT", "INFERENCE", "COMMUNITY_SIGNAL", "UNKNOWN"]
SourceType = Literal["website", "reddit"]
RedditSignalClass = Literal["direct_company_signal", "customer_signal", "market_signal", "competitor_signal", "irrelevant"]


class Evidence(BaseModel):
    source_type: SourceType
    signal_type: SignalType
    title: str
    evidence: str
    source_url: str
    published_at: Optional[str] = None
    retrieved_at: str = Field(default_factory=lambda: datetime.utcnow().isoformat())
    classification: Classification = "UNKNOWN"
    relevance_score: float = 0.0
    confidence: float = 0.0


class RedditPost(BaseModel):
    post_id: str
    title: str
    subreddit: str
    body: str
    created_utc: float
    score: int
    num_comments: int
    permalink: str
    search_query: str
    signal_class: RedditSignalClass = "irrelevant"
    relevance_score: float = 0.0
