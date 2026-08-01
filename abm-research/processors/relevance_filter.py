"""Relevance Filter.

Performs cheap local filtering of scraped content BEFORE sending to LLM.
Splits text into paragraphs and keeps only those matching product keywords.
"""
import re
from models.product import ProductProfile


def filter_relevant_content(text: str, product: ProductProfile) -> list[dict]:
    """Split text into paragraphs and return only relevant ones.

    Returns list of {text, matched_keywords, score}.
    """
    all_keywords = [kw.lower() for kw in product.keywords.all_keywords()]
    paragraphs = _split_paragraphs(text)

    results = []
    for para in paragraphs:
        if len(para) < 40:
            continue
        para_lower = para.lower()
        matched = [kw for kw in all_keywords if kw in para_lower]
        if matched:
            score = min(1.0, len(matched) / 3)
            results.append({"text": para, "matched_keywords": matched, "score": score})

    # Sort by score descending, keep top chunks
    results.sort(key=lambda x: x["score"], reverse=True)
    return results[:30]


def _split_paragraphs(text: str) -> list[str]:
    """Split text into meaningful paragraphs."""
    # Split on double newlines or sentence boundaries
    parts = re.split(r"\n{2,}|\.\s{2,}", text)
    cleaned = []
    for part in parts:
        part = part.strip()
        if len(part) > 40:
            cleaned.append(part)
    return cleaned
