"""Pydantic models for company data."""
from typing import Optional
from pydantic import BaseModel, Field


class CompanyInput(BaseModel):
    name: str
    website: str


class CompanyValidated(BaseModel):
    name: str
    website: str
    domain: str
    industry: str = ""
    description: str = ""
    is_valid: bool = True
    validation_error: Optional[str] = None
