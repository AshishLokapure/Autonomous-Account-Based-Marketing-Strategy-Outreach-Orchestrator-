"""Relevance Ranker Agent.

Scores each company using configurable weighted dimensions,
classifies relevance level, and generates why_relevant + top_opportunity via LLM.
"""
import logging
from datetime import datetime, timezone

from models.product import ProductProfile
from models.research_result import CompanyResult, CompanyScores, TopOpportunity
from services.llm_service import call_json
from utils.scoring import score_pain_match, score_technology_match, score_hiring_growth, score_community_signals, score_evidence_quality, score_recency
from config import settings

logger = logging.getLogger(__name__)


def rank_companies(companies: list[CompanyResult], product: ProductProfile) -> list[CompanyResult]:
    """Score, rank, and annotate all companies. Returns sorted list."""
    for company in companies:
        _score_company(company, product)

    companies.sort(key=lambda c: c.scores.product_relevance_score, reverse=True)

    for i, company in enumerate(companies):
        company.rank = i + 1
        company.relevance_level = _classify_level(company.scores.product_relevance_score)
        if company.signals:
            _generate_narrative(company, product)

    return companies


def _score_company(company: CompanyResult, product: ProductProfile) -> None:
    signals = company.signals
    reddit_signals = company.reddit_intelligence.signals
    all_keywords = product.keywords.all_keywords()

    pain_score = score_pain_match(signals, product.keywords.pain_keywords)
    tech_score = score_technology_match(signals, product.keywords.technology_keywords)
    hiring_score = score_hiring_growth(signals)
    community_score = score_community_signals(reddit_signals)
    evidence_score = score_evidence_quality(signals)
    recency_score = score_recency(signals)

    # Business trigger: any funding/expansion/acquisition/product_launch signal
    trigger_types = {"funding", "expansion", "acquisition", "product_launch", "strategic_initiative", "partnership"}
    trigger_score = min(1.0, sum(1 for s in signals if s.signal_type in trigger_types) * 0.25)

    # Product/use-case match: signals with high relevance_score
    product_match = (
        sum(s.relevance_score for s in signals) / max(len(signals), 1)
        if signals else 0.0
    )

    w = settings
    composite = (
        pain_score       * w.weight_pain_match +
        product_match    * w.weight_product_match +
        trigger_score    * w.weight_business_trigger +
        hiring_score     * w.weight_hiring_growth +
        tech_score       * w.weight_technology +
        community_score  * w.weight_reddit +
        recency_score    * w.weight_recency +
        evidence_score   * w.weight_evidence_quality
    )

    company.scores = CompanyScores(
        product_relevance_score=round(composite * 100, 1),
        pain_match_score=round(pain_score * 100, 1),
        business_trigger_score=round(trigger_score * 100, 1),
        technology_match_score=round(tech_score * 100, 1),
        community_signal_score=round(community_score * 100, 1),
        evidence_quality_score=round(evidence_score * 100, 1),
    )

    # Matched keywords
    all_text = " ".join(s.evidence + " " + s.title for s in signals).lower()
    company.matched_keywords = [kw for kw in all_keywords if kw.lower() in all_text][:15]


def _generate_narrative(company: CompanyResult, product: ProductProfile) -> None:
    """Use LLM to generate why_relevant and top_opportunity."""
    signal_summaries = "\n".join(
        f"- [{s.signal_type}] {s.title}: {s.summary}" for s in company.signals[:8]
    )
    name = company.company.get("name", "")

    prompt = f"""Based on these signals about "{name}", explain why this company is relevant
to this product: {product.description}

Signals:
{signal_summaries}

Return JSON with:
- why_relevant: 2-3 sentence explanation of why this company is a good fit (be specific, cite signals)
- top_signal: the single most important signal title
- top_reason: why that signal matters for the product
- related_capability: which product feature/capability addresses it
- evidence_quotes: list of 1-3 short evidence quotes
- confidence: 0.0-1.0"""

    try:
        data = call_json(prompt, max_tokens=600)
        company.why_relevant = str(data.get("why_relevant", ""))
        company.top_opportunity = TopOpportunity(
            signal=str(data.get("top_signal", "")),
            reason=str(data.get("top_reason", "")),
            related_product_capability=str(data.get("related_capability", "")),
            evidence=data.get("evidence_quotes", []),
            confidence=float(data.get("confidence", 0.5)),
        )
    except Exception as e:
        logger.debug("Narrative generation failed for %s: %s", name, e)
        company.why_relevant = f"Signals detected: {', '.join(s.signal_type for s in company.signals[:3])}"


def _classify_level(score: float) -> str:
    if score >= 80:
        return "very_high"
    if score >= 60:
        return "high"
    if score >= 40:
        return "medium"
    if score >= 20:
        return "low"
    return "very_low"
