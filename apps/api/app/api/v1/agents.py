"""Agent execution endpoints.

POST /api/v1/research/run     — Research Agent (loads product research JSON)
POST /api/v1/stakeholder/run  — Stakeholder Agent
POST /api/v1/intent/run       — Intent Agent
POST /api/v1/strategy/run     — Strategy Agent
POST /api/v1/outreach/run     — Outreach Agent

Each returns: { agent, status, execution_time, confidence, result }
"""

from typing import Literal

from fastapi import APIRouter
from pydantic import BaseModel

from app.services.agents.intent_service import IntentService
from app.services.agents.outreach_service import OutreachService
from app.services.agents.research_service import ResearchService
from app.services.agents.stakeholder_service import StakeholderService
from app.services.agents.strategy_service import StrategyService

router = APIRouter(tags=["Agents"])

ProductName = Literal["Azure AI", "AWS Cloud", "Claude Enterprise"]


class AgentRunRequest(BaseModel):
    product: ProductName


class AgentRunResponse(BaseModel):
    agent: str
    status: str
    execution_time: float
    confidence: int
    result: dict


@router.post("/research/run", response_model=AgentRunResponse)
def run_research(body: AgentRunRequest) -> dict:
    """Run the Research Agent for the selected product."""
    return ResearchService().run(body.product)


@router.post("/stakeholder/run", response_model=AgentRunResponse)
def run_stakeholder(body: AgentRunRequest) -> dict:
    """Run the Stakeholder Agent (requires research to exist for the product)."""
    return StakeholderService().run(body.product)


@router.post("/intent/run", response_model=AgentRunResponse)
def run_intent(body: AgentRunRequest) -> dict:
    """Run the Intent Agent."""
    return IntentService().run(body.product)


@router.post("/strategy/run", response_model=AgentRunResponse)
def run_strategy(body: AgentRunRequest) -> dict:
    """Run the Strategy Agent."""
    return StrategyService().run(body.product)


@router.post("/outreach/run", response_model=AgentRunResponse)
def run_outreach(body: AgentRunRequest) -> dict:
    """Run the Outreach Agent."""
    return OutreachService().run(body.product)
