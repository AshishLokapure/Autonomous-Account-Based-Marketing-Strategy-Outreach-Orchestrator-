"""In-memory sequential orchestrator for the AccountPilot demo agent workflow.

Runs are intentionally explicit about their simulated nature and retain the
actual service outputs derived from the product-specific research JSON.
Replace this manager with a durable queue/worker in production.
"""

from __future__ import annotations

import copy
import threading
import time
from datetime import datetime, timezone
from uuid import uuid4

from app.services.agents.intent_service import IntentService
from app.services.agents.outreach_service import OutreachService
from app.services.agents.research_service import ResearchService
from app.services.agents.stakeholder_service import StakeholderService
from app.services.agents.strategy_service import StrategyService


# Each agent definition includes sub-steps and a simulation delay to make
# the monitor UI observable.  The actual service call runs after the delay.
AGENTS = (
    {
        "id": "research",
        "name": "Research Agent",
        "service": ResearchService,
        "delay": 3.0,
        "steps": [
            "Loading Website",
            "Loading LinkedIn",
            "Loading Reddit",
            "Generating Report",
        ],
    },
    {
        "id": "stakeholder",
        "name": "Stakeholder Agent",
        "service": StakeholderService,
        "delay": 2.5,
        "steps": [
            "Loading Emails",
            "Loading Meeting Transcripts",
            "Finding Decision Makers",
            "Finding Champions",
            "Detecting Buying Signals",
        ],
    },
    {
        "id": "intent",
        "name": "Intent Agent",
        "service": IntentService,
        "delay": 2.0,
        "steps": [
            "Analyzing Intent",
            "Competitor Detection",
            "Urgency Detection",
        ],
    },
    {
        "id": "strategy",
        "name": "Strategy Agent",
        "service": StrategyService,
        "delay": 2.5,
        "steps": [
            "Building Strategy",
            "Finding White Space",
            "Prioritization",
        ],
    },
    {
        "id": "outreach",
        "name": "Outreach Agent",
        "service": OutreachService,
        "delay": 2.0,
        "steps": [
            "Generating Email",
            "Generating LinkedIn Message",
            "Generating Next Best Action",
        ],
    },
)


class CampaignOrchestrator:
    def __init__(self) -> None:
        self._runs: dict[str, dict] = {}
        self._lock = threading.Lock()

    def create(self, product: str) -> dict:
        run_id = str(uuid4())
        agents = [
            {
                "id": agent["id"],
                "name": agent["name"],
                "status": "idle",
                "execution_time": None,
                "confidence": None,
                "steps": [{"label": s, "done": False} for s in agent["steps"]],
                "current_step": None,
            }
            for agent in AGENTS
        ]
        run = {
            "run_id": run_id,
            "product": product,
            "status": "queued",
            "progress": 0,
            "current_agent": None,
            "started_at": None,
            "completed_at": None,
            "agents": agents,
            "events": [{"timestamp": self._now(), "type": "info", "message": "Campaign queued"}],
            "results": {},
            "error": None,
        }
        with self._lock:
            self._runs[run_id] = run
        return self.snapshot(run_id)

    def execute(self, run_id: str) -> None:
        """Run all agents sequentially with sub-step progress events."""
        self._update(run_id, status="running", started_at=self._now())
        self._event(run_id, "info", "Campaign execution started")

        for index, agent_def in enumerate(AGENTS):
            agent_id = agent_def["id"]
            name = agent_def["name"]
            service_class = agent_def["service"]
            delay = agent_def["delay"]
            steps = agent_def["steps"]

            # Mark agent as running
            self._set_agent(run_id, index, status="running", current_step=steps[0])
            self._update(run_id, current_agent=agent_id, progress=index * 20)
            self._event(run_id, "start", f"{name} started")

            try:
                # Simulate sub-steps with delays
                step_interval = delay / len(steps)
                for step_idx, step_label in enumerate(steps):
                    self._set_agent(run_id, index, current_step=step_label)
                    time.sleep(step_interval)
                    # Mark step as done
                    self._complete_step(run_id, index, step_idx)
                    self._event(run_id, "step", f"{name}: {step_label} ✔")

                # Execute the actual service
                result = service_class().run(self.snapshot(run_id)["product"])

                self._set_agent(
                    run_id,
                    index,
                    status="completed",
                    execution_time=result["execution_time"],
                    confidence=result["confidence"],
                    current_step=None,
                )
                self._store_result(run_id, agent_id, result["result"])
                self._update(run_id, progress=(index + 1) * 20)
                self._event(run_id, "completed", f"{name} completed")

            except Exception as exc:
                self._set_agent(run_id, index, status="failed", current_step=None)
                self._update(
                    run_id,
                    status="failed",
                    error=str(exc),
                    current_agent=agent_id,
                    completed_at=self._now(),
                )
                self._event(run_id, "error", f"{name} failed: {exc}")
                return

        self._update(
            run_id,
            status="completed",
            progress=100,
            current_agent=None,
            completed_at=self._now(),
        )
        self._event(run_id, "completed", "Campaign completed — all agents finished")

    def snapshot(self, run_id: str) -> dict:
        with self._lock:
            if run_id not in self._runs:
                raise KeyError(run_id)
            return copy.deepcopy(self._runs[run_id])

    # ── Internal helpers ────────────────────────────────────────────────

    def _update(self, run_id: str, **values: object) -> None:
        with self._lock:
            self._runs[run_id].update(values)

    def _set_agent(self, run_id: str, index: int, **values: object) -> None:
        with self._lock:
            self._runs[run_id]["agents"][index].update(values)

    def _complete_step(self, run_id: str, agent_index: int, step_index: int) -> None:
        with self._lock:
            self._runs[run_id]["agents"][agent_index]["steps"][step_index]["done"] = True

    def _store_result(self, run_id: str, agent_id: str, result: dict) -> None:
        with self._lock:
            self._runs[run_id]["results"][agent_id] = result

    def _event(self, run_id: str, event_type: str, message: str) -> None:
        with self._lock:
            self._runs[run_id]["events"].append(
                {"timestamp": self._now(), "type": event_type, "message": message}
            )

    @staticmethod
    def _now() -> str:
        return datetime.now(timezone.utc).isoformat()


campaign_orchestrator = CampaignOrchestrator()

