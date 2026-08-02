from __future__ import annotations

import json
from datetime import datetime, timezone
from pathlib import Path


class IntentRepository:
    """Persist generated intent analysis snapshots to local JSON files."""

    def __init__(self) -> None:
        self.base_dir = Path(__file__).resolve().parents[2] / "dummy_outputs" / "intent_results"
        self.base_dir.mkdir(parents=True, exist_ok=True)

    def save(self, product: str, campaign_id: str | None, payload: dict) -> dict:
        timestamp = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")
        slug = product.lower().replace(" ", "-")
        file_name = f"{slug}-{campaign_id or 'adhoc'}-{timestamp}.json"
        path = self.base_dir / file_name
        with path.open("w", encoding="utf-8") as fp:
            json.dump(payload, fp, indent=2)
        return {
            "path": str(path),
            "file_name": file_name,
            "saved_at": timestamp,
        }

