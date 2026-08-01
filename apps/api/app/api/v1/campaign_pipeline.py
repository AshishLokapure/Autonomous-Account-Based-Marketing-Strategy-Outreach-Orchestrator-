"""Campaign Pipeline API — POST /api/v1/campaign/run

Triggers the ABM research pipeline for a given product + industry,
stores results, and returns structured JSON for the frontend dashboard.
"""
import json
import os
import sys
import asyncio
from typing import Annotated

from fastapi import APIRouter, BackgroundTasks, HTTPException, status
from pydantic import BaseModel, Field

from app.core.logger import logger

router = APIRouter(prefix="/campaign", tags=["Campaign Pipeline"])

# Path to the abm-research package (sibling of apps/)
ABM_RESEARCH_PATH = os.path.join(
    os.path.dirname(__file__),  # apps/api/app/api/v1/
    "..", "..", "..", "..", "..", "abm-research"
)
ABM_RESEARCH_PATH = os.path.normpath(ABM_RESEARCH_PATH)
RESULTS_PATH = os.path.join(ABM_RESEARCH_PATH, "data", "research_results.json")

# In-memory job state (replace with Redis/DB for production)
_job_state: dict = {"status": "idle", "progress": 0, "error": None}


# ── Request / Response schemas ─────────────────────────────────────────────────

class CampaignRunRequest(BaseModel):
    product: dict = Field(..., description="ProductInput dict")
    industry_category: str = Field(..., examples=["B2B SaaS"])
    target_company_count: int = Field(default=20, ge=1, le=100)


class CampaignStatusResponse(BaseModel):
    status: str
    progress: int
    error: str | None = None


# ── Background task ────────────────────────────────────────────────────────────

def _run_pipeline_task(product: dict, industry: str, count: int) -> None:
    global _job_state
    _job_state = {"status": "running", "progress": 5, "error": None}
    try:
        # Add abm-research to sys.path so we can import it
        if ABM_RESEARCH_PATH not in sys.path:
            sys.path.insert(0, ABM_RESEARCH_PATH)

        from main import run_pipeline  # abm-research/main.py

        _job_state["progress"] = 10
        result = run_pipeline(
            product_input=product,
            industry_category=industry,
            target_company_count=count,
        )
        _job_state = {"status": "completed", "progress": 100, "error": None}
        logger.info("Campaign pipeline completed — %d companies", len(result.companies))

    except Exception as e:
        logger.error("Campaign pipeline failed: %s", e)
        _job_state = {"status": "failed", "progress": 0, "error": str(e)[:300]}


# ── Endpoints ──────────────────────────────────────────────────────────────────

@router.post("/run", response_model=CampaignStatusResponse, status_code=status.HTTP_202_ACCEPTED)
async def run_campaign(body: CampaignRunRequest, background_tasks: BackgroundTasks) -> CampaignStatusResponse:
    """Trigger the ABM research pipeline asynchronously."""
    global _job_state
    if _job_state.get("status") == "running":
        raise HTTPException(status_code=409, detail="A campaign is already running")

    logger.info("Campaign run triggered — industry=%s count=%d", body.industry_category, body.target_company_count)
    background_tasks.add_task(
        _run_pipeline_task,
        body.product,
        body.industry_category,
        body.target_company_count,
    )
    _job_state = {"status": "queued", "progress": 0, "error": None}
    return CampaignStatusResponse(status="queued", progress=0)


@router.get("/status", response_model=CampaignStatusResponse)
async def get_campaign_status() -> CampaignStatusResponse:
    """Poll campaign execution status."""
    return CampaignStatusResponse(**_job_state)


@router.get("/results")
async def get_campaign_results() -> dict:
    """Return the latest research_results.json for the frontend dashboard."""
    if not os.path.exists(RESULTS_PATH):
        raise HTTPException(status_code=404, detail="No campaign results found. Run a campaign first.")
    try:
        with open(RESULTS_PATH, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to read results: {e}")
