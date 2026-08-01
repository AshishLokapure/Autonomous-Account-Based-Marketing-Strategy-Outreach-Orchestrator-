"""JSON writer — saves the final ResearchResult to disk."""
import json
import os
from models.research_result import ResearchResult


def write_results(result: ResearchResult, path: str) -> None:
    os.makedirs(os.path.dirname(path) or ".", exist_ok=True)
    with open(path, "w", encoding="utf-8") as f:
        json.dump(result.model_dump(), f, indent=2, ensure_ascii=False, default=str)


def read_results(path: str) -> dict:
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)
