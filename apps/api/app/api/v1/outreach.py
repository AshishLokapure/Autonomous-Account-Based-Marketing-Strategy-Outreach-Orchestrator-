"""Outreach API Router — Drafts management, Grok AI generation, and email dispatch."""

from __future__ import annotations

from typing import Any, Dict, List, Optional
from fastapi import APIRouter, HTTPException, Query, status

from app.core.logger import logger
from app.repositories.email_draft_repository import EmailDraftRepository
from app.schemas.outreach import (
    EmailDraft,
    EmailDraftUpdate,
    GenerateDraftRequest,
    GenerateDraftResponse,
    RegenerateDraftRequest,
    SendDraftRequest,
    SendDraftResponse,
)
from app.services.agents.outreach_service import OutreachService
from app.services.email_service import EmailService
from app.services.grok_service import GrokService

router = APIRouter(prefix="/outreach", tags=["Outreach"])


@router.get("/drafts", response_model=List[Dict[str, Any]])
def list_email_drafts(
    product: Optional[str] = Query(None, description="Filter by product name"),
    campaign_id: Optional[str] = Query(None, description="Filter by campaign ID"),
    company: Optional[str] = Query(None, description="Filter by company name"),
    limit: int = Query(100, ge=1, le=500),
):
    """Retrieve all generated email drafts from Supabase / memory store."""
    drafts = EmailDraftRepository.list_drafts(
        product=product,
        campaign_id=campaign_id,
        company=company,
        limit=limit,
    )
    # If no drafts exist for the product yet, trigger standard outreach service to generate initial drafts
    if not drafts and product:
        try:
            logger.info(f"No drafts found for product {product}. Generating initial drafts via OutreachService...")
            outreach_res = OutreachService().run(product=product, campaign_id=campaign_id or "default-campaign")
            drafts = EmailDraftRepository.list_drafts(product=product, campaign_id=campaign_id, limit=limit)
        except Exception as exc:
            logger.warning(f"Auto-draft generation skipped: {exc}")

    return drafts


@router.get("/drafts/{draft_id}", response_model=Dict[str, Any])
def get_email_draft(draft_id: str):
    """Retrieve a specific email draft by ID."""
    draft = EmailDraftRepository.get_draft(draft_id)
    if not draft:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Email draft with ID '{draft_id}' not found.",
        )
    return draft


@router.post("/generate", response_model=Dict[str, Any])
def generate_draft(req: GenerateDraftRequest):
    """Generate a single personalized email draft for a company using Grok."""
    try:
        # Run OutreachService to generate or refresh draft
        service_res = OutreachService().run(product=req.product, campaign_id=req.campaign_id or "default-campaign")
        companies = service_res.get("result", {}).get("companies", [])
        
        target_company = None
        if req.company_name:
            target_company = next(
                (c for c in companies if c["company_name"].lower() == req.company_name.lower()),
                None,
            )
        if not target_company and companies:
            target_company = companies[0]

        if not target_company:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Unable to generate draft for company '{req.company_name}'",
            )

        draft_id = target_company.get("draft_id")
        draft = EmailDraftRepository.get_draft(draft_id) if draft_id else None
        
        return {
            "status": "completed",
            "draft": draft or target_company.get("executive_email"),
            "company": target_company,
        }
    except Exception as exc:
        logger.error(f"Failed to generate draft: {exc}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Draft generation failed: {str(exc)}",
        )


@router.post("/regenerate", response_model=Dict[str, Any])
def regenerate_draft(req: RegenerateDraftRequest):
    """Regenerate an existing draft with a new AI tone preset and instructions."""
    updated = GrokService.regenerate_email(
        draft_id=req.draft_id,
        tone=req.tone,
        custom_instructions=req.instructions,
    )
    if not updated:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Draft with ID '{req.draft_id}' not found for regeneration.",
        )
    return {
        "status": "completed",
        "draft": updated,
        "message": f"Successfully regenerated with '{req.tone}' tone.",
    }


@router.patch("/drafts/{draft_id}", response_model=Dict[str, Any])
def update_email_draft(draft_id: str, updates: EmailDraftUpdate):
    """Update draft subject, body, or status (e.g. approve or manual edit)."""
    update_data = updates.model_dump(exclude_unset=True)
    updated = EmailDraftRepository.update_draft(draft_id, update_data)
    if not updated:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Email draft with ID '{draft_id}' not found.",
        )
    return updated


@router.post("/send", response_model=SendDraftResponse)
def send_email_draft(req: SendDraftRequest):
    """Send an approved email draft via configured SMTP service."""
    draft = None
    if req.draft_id:
        draft = EmailDraftRepository.get_draft(req.draft_id)

    to_email = req.to_email or (draft.get("recipient_email") if draft else None)
    subject = req.subject or (draft.get("subject") if draft else None)
    content = req.content or (draft.get("body") if draft else None)

    if not to_email or not subject or not content:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Recipient email, subject, and content are required to dispatch email.",
        )

    company_name = draft.get("company", "Enterprise Prospect") if draft else "Prospect"
    success, message = EmailService.send_email(
        to_email=to_email,
        subject=subject,
        content=content,
        campaign_name=f"Outreach — {company_name}",
    )

    if req.draft_id:
        if success:
            EmailDraftRepository.mark_sent(req.draft_id)
        else:
            EmailDraftRepository.update_draft(req.draft_id, {"status": "failed"})

    return SendDraftResponse(
        status="success" if success else "failed",
        message=message,
        draft_id=req.draft_id,
        sent_at=draft.get("sent_time") if draft else None,
    )
