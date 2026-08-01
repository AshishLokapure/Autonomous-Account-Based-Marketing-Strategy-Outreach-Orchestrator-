"""Pydantic models for the final research result output."""
from datetime import datetime
from typing import Optional, Literal
from pydantic import BaseModel, Field

RelevanceLevel = Literal["very_high", "high", "medium", "low", "very_low"]


class SignalItem(BaseModel):
    signal_type: str
    title: str
    summary: str
    classification: str
    source_type: str
    source_url: str
    published_at: Optional[str] = None
    retrieved_at: str
    evidence: str
    product_relevance: str = ""
    relevance_score: float = 0.0
    confidence: float = 0.0


class RedditSignalItem(BaseModel):
    signal_class: str
    subreddit: str
    title: str
    summary: str
    evidence: str
    permalink: str
    created_at: str
    score: int
    num_comments: int
    relevance_score: float = 0.0


class WebsiteIntelligence(BaseModel):
    pages_checked: int = 0
    relevant_pages: list[str] = Field(default_factory=list)
    key_findings: list[str] = Field(default_factory=list)


class RedditIntelligence(BaseModel):
    queries_used: list[str] = Field(default_factory=list)
    posts_checked: int = 0
    relevant_posts: int = 0
    signals: list[RedditSignalItem] = Field(default_factory=list)


class TopOpportunity(BaseModel):
    signal: str = ""
    reason: str = ""
    related_product_capability: str = ""
    evidence: list[str] = Field(default_factory=list)
    confidence: float = 0.0


class CompanyScores(BaseModel):
    product_relevance_score: float = 0.0
    pain_match_score: float = 0.0
    business_trigger_score: float = 0.0
    technology_match_score: float = 0.0
    community_signal_score: float = 0.0
    evidence_quality_score: float = 0.0


class CompanyResult(BaseModel):
    rank: int = 0
    company: dict
    scores: CompanyScores = Field(default_factory=CompanyScores)
    relevance_level: RelevanceLevel = "very_low"
    why_relevant: str = ""
    matched_product_capabilities: list[str] = Field(default_factory=list)
    matched_keywords: list[str] = Field(default_factory=list)
    signals: list[SignalItem] = Field(default_factory=list)
    website_intelligence: WebsiteIntelligence = Field(default_factory=WebsiteIntelligence)
    reddit_intelligence: RedditIntelligence = Field(default_factory=RedditIntelligence)
    top_opportunity: TopOpportunity = Field(default_factory=TopOpportunity)
    research_gaps: list[str] = Field(default_factory=list)


class ResearchMetadata(BaseModel):
    generated_at: str = Field(default_factory=lambda: datetime.utcnow().isoformat())
    industry_category: str
    companies_requested: int
    companies_discovered: int
    companies_researched: int
    reddit_source: str = "PRAW"
    version: str = "1.0"


class ResearchResult(BaseModel):
    research_metadata: ResearchMetadata
    product_context: dict
    companies: list[CompanyResult] = Field(default_factory=list)
