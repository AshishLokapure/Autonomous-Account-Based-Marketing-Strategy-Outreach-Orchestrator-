"""Pydantic models for product intelligence."""
from typing import Optional
from pydantic import BaseModel, HttpUrl, Field


class ProductInput(BaseModel):
    name: str
    website: Optional[str] = None
    description: str
    features: list[str] = Field(default_factory=list)
    value_proposition: str = ""


class ProductKeywords(BaseModel):
    pain_keywords: list[str] = Field(default_factory=list)
    solution_keywords: list[str] = Field(default_factory=list)
    growth_keywords: list[str] = Field(default_factory=list)
    hiring_keywords: list[str] = Field(default_factory=list)
    technology_keywords: list[str] = Field(default_factory=list)
    intent_keywords: list[str] = Field(default_factory=list)

    def all_keywords(self) -> list[str]:
        return (
            self.pain_keywords + self.solution_keywords + self.growth_keywords
            + self.hiring_keywords + self.technology_keywords + self.intent_keywords
        )


class ProductProfile(BaseModel):
    name: str
    website: Optional[str] = None
    description: str
    features: list[str] = Field(default_factory=list)
    value_proposition: str = ""
    use_cases: list[str] = Field(default_factory=list)
    customer_types: list[str] = Field(default_factory=list)
    buyer_personas: list[str] = Field(default_factory=list)
    relevant_industries: list[str] = Field(default_factory=list)
    business_problems_solved: list[str] = Field(default_factory=list)
    competitor_categories: list[str] = Field(default_factory=list)
    keywords: ProductKeywords = Field(default_factory=ProductKeywords)
