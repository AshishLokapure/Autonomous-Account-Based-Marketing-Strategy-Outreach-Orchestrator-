"""Scoring utilities for individual relevance dimensions."""
from datetime import datetime, timezone
from models.research_result import SignalItem, RedditSignalItem


def score_pain_match(signals: list[SignalItem], pain_keywords: list[str]) -> float:
    if not signals:
        return 0.0
    pain_signals = [s for s in signals if s.signal_type == "pain"]
    kw_lower = [k.lower() for k in pain_keywords]
    hits = sum(
        1 for s in signals
        if any(kw in (s.evidence + s.title).lower() for kw in kw_lower)
    )
    base = min(1.0, len(pain_signals) * 0.3 + hits * 0.1)
    avg_relevance = sum(s.relevance_score for s in signals) / max(len(signals), 1)
    return min(1.0, base * 0.6 + avg_relevance * 0.4)


def score_technology_match(signals: list[SignalItem], tech_keywords: list[str]) -> float:
    if not signals:
        return 0.0
    tech_signals = [s for s in signals if s.signal_type == "technology"]
    kw_lower = [k.lower() for k in tech_keywords]
    hits = sum(
        1 for s in signals
        if any(kw in (s.evidence + s.title).lower() for kw in kw_lower)
    )
    return min(1.0, len(tech_signals) * 0.25 + hits * 0.15)


def score_hiring_growth(signals: list[SignalItem]) -> float:
    relevant_types = {"hiring", "growth", "expansion"}
    count = sum(1 for s in signals if s.signal_type in relevant_types)
    return min(1.0, count * 0.3)


def score_community_signals(reddit_signals: list[RedditSignalItem]) -> float:
    if not reddit_signals:
        return 0.0
    high_value = [s for s in reddit_signals if s.signal_class in ("direct_company_signal", "customer_signal")]
    avg_score = sum(s.relevance_score for s in reddit_signals) / max(len(reddit_signals), 1)
    return min(1.0, len(high_value) * 0.2 + avg_score * 0.5)


def score_evidence_quality(signals: list[SignalItem]) -> float:
    if not signals:
        return 0.0
    facts = sum(1 for s in signals if s.classification == "FACT")
    avg_confidence = sum(s.confidence for s in signals) / max(len(signals), 1)
    fact_ratio = facts / max(len(signals), 1)
    return min(1.0, fact_ratio * 0.5 + avg_confidence * 0.5)


def score_recency(signals: list[SignalItem]) -> float:
    """Score based on how recent the signals are."""
    if not signals:
        return 0.0
    now = datetime.now(timezone.utc)
    scores = []
    for s in signals:
        if not s.published_at:
            scores.append(0.3)  # unknown date — neutral
            continue
        try:
            pub = datetime.fromisoformat(s.published_at.replace("Z", "+00:00"))
            days = (now - pub).days
            if days <= 30:
                scores.append(1.0)
            elif days <= 90:
                scores.append(0.8)
            elif days <= 180:
                scores.append(0.5)
            elif days <= 365:
                scores.append(0.3)
            else:
                scores.append(0.1)
        except Exception:
            scores.append(0.3)
    return sum(scores) / max(len(scores), 1)
