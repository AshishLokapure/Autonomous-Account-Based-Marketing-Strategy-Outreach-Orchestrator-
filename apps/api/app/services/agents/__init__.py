"""Shared helpers for the agent services.

The Research Agent loads pre-generated research reports from
apps/api/dummy_outputs/. Downstream agents (Stakeholder, Intent, Strategy,
Outreach) derive their outputs deterministically from that research data —
no facts are invented at random; every derived value traces back to fields
in the research JSON. Custom workspace names dynamically map to standard
datasets while tailoring the product context.
"""

import json
import zlib
from functools import lru_cache
from pathlib import Path

from app.core.exceptions import NotFoundException

DUMMY_OUTPUTS_DIR = Path(__file__).resolve().parents[3] / "dummy_outputs"

PRODUCT_FILES: dict[str, str] = {
    "Azure AI": "azure-research-data.json",
    "AWS Cloud": "aws-research-data.json",
    "Claude Enterprise": "claude-research-data.json",
}

# Which linkedin_analysis job-count field is most relevant per product
PRODUCT_JOB_FIELD: dict[str, str] = {
    "Azure AI": "azure_jobs",
    "AWS Cloud": "aws_jobs",
    "Claude Enterprise": "ai_jobs",
}


def validate_product(product: str) -> str:
    """Accept any product or workspace name."""
    if not product or not product.strip():
        raise NotFoundException("Product or workspace name cannot be empty")
    return product.strip()


@lru_cache(maxsize=16)
def load_research_data(product: str) -> dict:
    """Load the research report for a product or custom workspace."""
    validate_product(product)
    filename = PRODUCT_FILES.get(product, "azure-research-data.json")
    path = DUMMY_OUTPUTS_DIR / filename
    if not path.exists():
        raise NotFoundException(f"Research data file not found: {path.name}")
    with path.open(encoding="utf-8") as fp:
        data = json.load(fp)
    if product not in PRODUCT_FILES:
        # Patch the product title for custom workspace runs
        raw = json.dumps(data).replace("Azure AI", product)
        data = json.loads(raw)
    return data


PRODUCT_EMAIL_FILES: dict[str, str] = {
    "Azure AI": "azure-mails.json",
    "AWS Cloud": "aws-mails.json",
    "Claude Enterprise": "claude-mails.json",
}

PRODUCT_TRANSCRIPT_FILES: dict[str, str] = {
    "Azure AI": "azure-transcripts.json",
    "AWS Cloud": "aws-transcripts.json",
    "Claude Enterprise": "claude-transcripts.json",
}


@lru_cache(maxsize=16)
def load_company_emails(product: str) -> list[dict]:
    """Load logged email threads for a product workspace."""
    validate_product(product)
    filename = PRODUCT_EMAIL_FILES.get(product, "azure-mails.json")
    path = DUMMY_OUTPUTS_DIR / filename
    if not path.exists():
        return []
    with path.open(encoding="utf-8") as fp:
        return json.load(fp)


@lru_cache(maxsize=16)
def load_meeting_transcripts(product: str) -> list[dict]:
    """Load recorded meeting transcripts for a product workspace."""
    validate_product(product)
    filename = PRODUCT_TRANSCRIPT_FILES.get(product, "azure-transcripts.json")
    path = DUMMY_OUTPUTS_DIR / filename
    if not path.exists():
        return []
    with path.open(encoding="utf-8") as fp:
        return json.load(fp)


def seed(text: str) -> int:
    """Deterministic small integer derived from text (stable across runs)."""
    return zlib.crc32(text.encode("utf-8"))


def pick(pool: list, text: str, salt: str = "") -> object:
    """Deterministically pick an item from a pool based on text."""
    return pool[seed(text + salt) % len(pool)]


class AgentResultCache:
    """In-memory cache for agent execution outputs to eliminate redundant recalculation."""

    _cache: dict[tuple[str, str], dict] = {}

    @classmethod
    def get(cls, agent_name: str, product: str) -> dict | None:
        """Retrieve cached agent output for a given product/workspace."""
        return cls._cache.get((agent_name.lower().strip(), product.strip().lower()))

    @classmethod
    def set(cls, agent_name: str, product: str, result: dict) -> None:
        """Cache agent output for a given product/workspace."""
        cls._cache[(agent_name.lower().strip(), product.strip().lower())] = result

    @classmethod
    def clear(cls) -> None:
        """Clear all cached agent outputs."""
        cls._cache.clear()


