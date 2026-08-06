"""Sequential campaign agent-run endpoints for the live Agent Monitor."""

from typing import Literal

from fastapi import APIRouter, BackgroundTasks, HTTPException, status
from pydantic import BaseModel

from app.services.agents.orchestration_service import campaign_orchestrator

router = APIRouter(prefix="/agent-runs", tags=["Agent Runs"])
ProductName = Literal["Azure AI", "AWS Cloud", "Claude Enterprise"]


class AgentRunCreate(BaseModel):
    product: str = "Azure AI"


@router.post("", status_code=status.HTTP_202_ACCEPTED)
def start_agent_run(payload: AgentRunCreate, background_tasks: BackgroundTasks) -> dict:
    run = campaign_orchestrator.create(payload.product)
    background_tasks.add_task(campaign_orchestrator.execute, run["run_id"])
    return run


@router.get("/{run_id}")
def get_agent_run(run_id: str) -> dict:
    try:
        return campaign_orchestrator.snapshot(run_id)
    except KeyError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Agent run not found") from exc
