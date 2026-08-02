"""Agent execution endpoints.

POST /api/v1/research/run     - Research Agent
POST /api/v1/stakeholder/run  - Stakeholder Agent
POST /api/v1/intent/run       - Intent Agent
POST /api/v1/strategy/run     - Strategy Agent
POST /api/v1/outreach/run     - Outreach Agent
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


class IntentRunRequest(BaseModel):
    campaign_id: str | None = None
    product: ProductName


class AgentRunResponse(BaseModel):
    agent: str
    status: str
    execution_time: float
    confidence: int
    result: dict


@router.post("/research/run", response_model=AgentRunResponse)
def run_research(body: AgentRunRequest) -> dict:
    return ResearchService().run(body.product)


@router.post("/stakeholder/run", response_model=AgentRunResponse)
def run_stakeholder(body: AgentRunRequest) -> dict:
    return StakeholderService().run(body.product)


@router.post("/intent/run", response_model=AgentRunResponse)
def run_intent(body: IntentRunRequest) -> dict:
    return IntentService().run(body.product, campaign_id=body.campaign_id)


@router.post("/strategy/run", response_model=AgentRunResponse)
def run_strategy(body: AgentRunRequest) -> dict:
    return StrategyService().run(body.product)


@router.post("/outreach/run", response_model=AgentRunResponse)
def run_outreach(body: AgentRunRequest) -> dict:
    return OutreachService().run(body.product)

