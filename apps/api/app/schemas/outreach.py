"""Outreach and Email Generation Schemas."""

from __future__ import annotations

from datetime import datetime
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, EmailStr, Field


class EmailDraftBase(BaseModel):
    company: str
    product: str
    decision_maker: str
    recipient_email: str
    subject: str
    body: str
    intent_score: int = 0
    generated_by: str = "Grok-2 / Outreach Agent"
    status: str = "draft"  # draft, approved, sending, sent, failed, opened, clicked, replied
    cta: Optional[str] = None
    confidence: int = 90
    reason: Optional[str] = None
    metadata: Dict[str, Any] = Field(default_factory=dict)


class EmailDraftCreate(EmailDraftBase):
    campaign_id: str


class EmailDraftUpdate(BaseModel):
    subject: Optional[str] = None
    body: Optional[str] = None
    status: Optional[str] = None
    cta: Optional[str] = None
    decision_maker: Optional[str] = None
    recipient_email: Optional[str] = None


class EmailDraft(EmailDraftBase):
    id: str
    campaign_id: str
    sent_time: Optional[str] = None
    created_at: Optional[str] = None
    updated_at: Optional[str] = None


class GenerateDraftRequest(BaseModel):
    campaign_id: Optional[str] = "default-campaign"
    company_id: Optional[str] = None
    company_name: Optional[str] = None
    product: str = "Azure AI"
    tone: Optional[str] = "Executive & Concise"


class RegenerateDraftRequest(BaseModel):
    draft_id: str
    tone: str = "Executive & Concise"
    instructions: Optional[str] = None


class SendDraftRequest(BaseModel):
    draft_id: Optional[str] = None
    to_email: Optional[str] = None
    subject: Optional[str] = None
    content: Optional[str] = None


class SendDraftResponse(BaseModel):
    status: str = "success"
    message: str
    draft_id: Optional[str] = None
    sent_at: Optional[str] = None


class GenerateDraftResponse(BaseModel):
    status: str = "completed"
    draft: EmailDraft
