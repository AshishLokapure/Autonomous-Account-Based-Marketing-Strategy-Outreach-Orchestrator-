"""Shared helpers for the agent services.

The Research Agent loads pre-generated research reports from
apps/api/dummy_outputs/. Downstream agents (Stakeholder, Intent, Strategy,
Outreach) derive their outputs deterministically from that research data â€”
no facts are invented at random; every derived value traces back to fields
in the research JSON. All of this is clearly-dummy demo data.
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
    if product not in PRODUCT_FILES:
        raise NotFoundException(
            f"Unknown product '{product}'. Expected one of: {', '.join(PRODUCT_FILES)}"
        )
    return product


@lru_cache(maxsize=8)
def load_research_data(product: str) -> dict:
    """Load the pre-generated research report for a product."""
    validate_product(product)
    path = DUMMY_OUTPUTS_DIR / PRODUCT_FILES[product]
    if not path.exists():
        raise NotFoundException(f"Research data file not found: {path.name}")
    with path.open(encoding="utf-8") as fp:
        return json.load(fp)


def seed(text: str) -> int:
    """Deterministic small integer derived from text (stable across runs)."""
    return zlib.crc32(text.encode("utf-8"))


def pick(pool: list, text: str, salt: str = "") -> object:
    """Deterministically pick an item from a pool based on text."""
    return pool[seed(text + salt) % len(pool)]

