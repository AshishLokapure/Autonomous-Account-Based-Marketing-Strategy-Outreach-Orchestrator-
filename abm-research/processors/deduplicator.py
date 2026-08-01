"""Deduplicator.

Detects and removes duplicate evidence items using URL normalization,
title similarity, and text overlap.
"""
import re
from models.research_result import SignalItem


def deduplicate_signals(signals: list[SignalItem]) -> list[SignalItem]:
    """Remove duplicate signals, keeping the highest-confidence version."""
    seen_titles: dict[str, SignalItem] = {}
    seen_urls: set[str] = set()
    unique: list[SignalItem] = []

    for signal in sorted(signals, key=lambda s: s.confidence, reverse=True):
        norm_title = _normalize_text(signal.title)
        norm_url = _normalize_url(signal.source_url)

        # URL dedup
        if norm_url and norm_url in seen_urls:
            continue

        # Title similarity dedup
        duplicate = False
        for existing_title in seen_titles:
            if _similarity(norm_title, existing_title) > 0.8:
                duplicate = True
                break

        if not duplicate:
            unique.append(signal)
            seen_titles[norm_title] = signal
            if norm_url:
                seen_urls.add(norm_url)

    return unique


def _normalize_text(text: str) -> str:
    return re.sub(r"\W+", " ", text.lower()).strip()


def _normalize_url(url: str) -> str:
    return re.sub(r"https?://|www\.|/$", "", url.lower()).strip()


def _similarity(a: str, b: str) -> float:
    """Simple word-overlap similarity."""
    words_a = set(a.split())
    words_b = set(b.split())
    if not words_a or not words_b:
        return 0.0
    return len(words_a & words_b) / max(len(words_a), len(words_b))
