"""Signal Analyzer Agent.

Receives filtered evidence text and uses LLM to extract typed, classified signals.
Never fabricates — every signal must reference the evidence it came from.
"""
import logging
from pydantic import BaseModel, Field

from models.evidence import SignalType, Classification
from models.research_result import SignalItem
from models.product import ProductProfile
from services.llm_service import call_json
from utils.dates import utc_now_iso

logger = logging.getLogger(__name__)


class _RawSignal(BaseModel):
    signal_type: str
    title: str
    summary: str
    classification: str
    evidence: str
    product_relevance: str
    relevance_score: float
    confidence: float


VALID_SIGNAL_TYPES = {
    "pain", "hiring", "expansion", "funding", "product_launch", "partnership",
    "acquisition", "leadership_change", "technology", "customer_signal",
    "competitor_signal", "market_signal", "strategic_initiative", "growth", "purchase_intent"
}

VALID_CLASSIFICATIONS = {"FACT", "INFERENCE", "COMMUNITY_SIGNAL", "UNKNOWN"}


def extract_signals(
    company_name: str,
    evidence_chunks: list[dict],  # [{text, source_url, source_type, published_at}]
    product: ProductProfile,
) -> list[SignalItem]:
    """Extract typed signals from filtered evidence chunks."""
    if not evidence_chunks:
        return []

    # Batch evidence into one prompt (max 3000 chars of evidence)
    evidence_text = ""
    for i, chunk in enumerate(evidence_chunks[:15]):
        snippet = chunk.get("text", "")[:300]
        src = chunk.get("source_url", "")
        evidence_text += f"\n[{i+1}] Source: {src}\n{snippet}\n"

    prompt = f"""You are analyzing evidence about the company "{company_name}" to identify sales signals
relevant to this product: {product.description}

Product capabilities: {', '.join(product.features[:5])}
Pain keywords: {', '.join(product.keywords.pain_keywords[:8])}

Evidence collected:
{evidence_text}

Extract only signals that are genuinely relevant to the product. Return a JSON array of signal objects.
Each object must have:
- signal_type: one of: pain, hiring, expansion, funding, product_launch, partnership, acquisition, leadership_change, technology, customer_signal, competitor_signal, market_signal, strategic_initiative, growth, purchase_intent
- title: short descriptive title (max 80 chars)
- summary: 1-2 sentence summary of what was found
- classification: FACT (directly stated), INFERENCE (reasonably implied), COMMUNITY_SIGNAL (from community/customers), or UNKNOWN
- evidence: exact quote or paraphrase from the evidence above
- product_relevance: why this is relevant to the product (1 sentence)
- relevance_score: 0.0-1.0 (how relevant to the product)
- confidence: 0.0-1.0 (how confident in this signal)

Rules:
- Only include signals with relevance_score >= 0.4
- Never fabricate — only use what is in the evidence
- Do not convert INFERENCE into FACT
- Return empty array [] if no relevant signals found"""

    try:
        raw = call_json(prompt, max_tokens=2000)
        if not isinstance(raw, list):
            return []

        signals = []
        now = utc_now_iso()
        for item in raw:
            try:
                sig_type = item.get("signal_type", "pain")
                if sig_type not in VALID_SIGNAL_TYPES:
                    sig_type = "pain"
                classification = item.get("classification", "UNKNOWN")
                if classification not in VALID_CLASSIFICATIONS:
                    classification = "UNKNOWN"

                # Find matching source URL from evidence chunks
                source_url = ""
                for chunk in evidence_chunks:
                    if item.get("evidence", "") in chunk.get("text", ""):
                        source_url = chunk.get("source_url", "")
                        break

                signals.append(SignalItem(
                    signal_type=sig_type,
                    title=str(item.get("title", ""))[:80],
                    summary=str(item.get("summary", "")),
                    classification=classification,
                    source_type=str(item.get("source_type", "website")),
                    source_url=source_url,
                    published_at=None,
                    retrieved_at=now,
                    evidence=str(item.get("evidence", ""))[:500],
                    product_relevance=str(item.get("product_relevance", "")),
                    relevance_score=float(item.get("relevance_score", 0.0)),
                    confidence=float(item.get("confidence", 0.0)),
                ))
            except Exception as e:
                logger.debug("Skipping malformed signal: %s", e)

        return signals

    except Exception as e:
        logger.error("Signal extraction failed for %s: %s", company_name, e)
        return []
