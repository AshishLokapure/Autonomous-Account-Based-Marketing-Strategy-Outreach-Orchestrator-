"""Email Drafts Repository — Supabase REST API and In-Memory Resilient Cache."""

from __future__ import annotations

import json
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
from urllib.error import HTTPError
from urllib.parse import quote
from urllib.request import Request, urlopen
from uuid import uuid4

from app.core.config import get_settings
from app.core.logger import logger

settings = get_settings()


class EmailDraftRepository:
    """Repository for email_drafts table in Supabase with in-memory caching."""

    BASE = f"{settings.supabase_url.rstrip('/')}/rest/v1" if settings.supabase_url else ""
    HEADERS = {
        "apikey": settings.supabase_anon_key or "",
        "Authorization": f"Bearer {settings.supabase_anon_key or ''}",
        "Content-Type": "application/json",
    }

    # In-memory store for instantaneous access and fallback
    _memory_drafts: Dict[str, Dict[str, Any]] = {}

    @classmethod
    def list_drafts(
        cls,
        product: Optional[str] = None,
        campaign_id: Optional[str] = None,
        company: Optional[str] = None,
        limit: int = 100,
    ) -> List[Dict[str, Any]]:
        """List email drafts from Supabase REST API with local cache fallback."""
        if cls.BASE and settings.supabase_anon_key:
            try:
                params = ["select=*"]
                if product:
                    params.append(f"product=eq.{quote(str(product))}")
                if campaign_id:
                    params.append(f"campaign_id=eq.{quote(str(campaign_id))}")
                if company:
                    params.append(f"company=eq.{quote(str(company))}")
                params.append(f"limit={limit}")
                params.append("order=created_at.desc")

                url = f"{cls.BASE}/email_drafts?{'&'.join(params)}"
                req = Request(url, headers=cls.HEADERS, method="GET")
                with urlopen(req, timeout=6) as resp:
                    remote_rows = json.loads(resp.read().decode())
                    if remote_rows:
                        # Sync remote into memory cache
                        for row in remote_rows:
                            cls._memory_drafts[str(row.get("id"))] = row
                        return remote_rows
            except Exception as exc:
                logger.warning(f"Failed to fetch drafts from Supabase REST API: {exc}. Using memory cache.")

        # In-memory fallback / cache query
        results = list(cls._memory_drafts.values())
        if product:
            results = [r for r in results if r.get("product") == product]
        if campaign_id:
            results = [r for r in results if r.get("campaign_id") == campaign_id]
        if company:
            results = [r for r in results if r.get("company") == company]

        results.sort(key=lambda x: x.get("created_at", ""), reverse=True)
        return results[:limit]

    @classmethod
    def get_draft(cls, draft_id: str) -> Optional[Dict[str, Any]]:
        """Fetch a specific email draft by ID."""
        if draft_id in cls._memory_drafts:
            return cls._memory_drafts[draft_id]

        if cls.BASE and settings.supabase_anon_key:
            try:
                url = f"{cls.BASE}/email_drafts?id=eq.{quote(str(draft_id))}&select=*"
                req = Request(url, headers=cls.HEADERS, method="GET")
                with urlopen(req, timeout=6) as resp:
                    rows = json.loads(resp.read().decode())
                    if rows:
                        cls._memory_drafts[draft_id] = rows[0]
                        return rows[0]
            except Exception as exc:
                logger.warning(f"Failed to get draft {draft_id} from Supabase: {exc}")

        return cls._memory_drafts.get(draft_id)

    @classmethod
    def save_draft(cls, data: Dict[str, Any]) -> Dict[str, Any]:
        """Insert or upsert an email draft record."""
        draft_id = str(data.get("id") or uuid4())
        data["id"] = draft_id
        now = datetime.now(timezone.utc).isoformat()
        data.setdefault("created_at", now)
        data["updated_at"] = now
        data.setdefault("status", "draft")
        data["_persisted_to_db"] = False

        # Save to memory immediately
        cls._memory_drafts[draft_id] = data

        if cls.BASE and settings.supabase_anon_key:
            try:
                # Clean internal flags before DB write
                db_payload = {k: v for k, v in data.items() if not k.startswith("_")}
                url = f"{cls.BASE}/email_drafts"
                headers = {
                    **cls.HEADERS,
                    "Prefer": "resolution=merge-duplicates,return=representation",
                }
                req = Request(url, data=json.dumps([db_payload]).encode(), headers=headers, method="POST")
                with urlopen(req, timeout=6) as resp:
                    rows = json.loads(resp.read().decode())
                    if rows:
                        rows[0]["_persisted_to_db"] = True
                        cls._memory_drafts[draft_id] = rows[0]
                        return rows[0]
                    data["_persisted_to_db"] = True
            except Exception as exc:
                logger.warning(f"Failed to save draft {draft_id} to Supabase: {exc}")

        return data

    @classmethod
    def update_draft(cls, draft_id: str, updates: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Update draft status, subject, body, or metadata."""
        draft = cls.get_draft(draft_id)
        if not draft:
            return None

        draft.update(updates)
        draft["updated_at"] = datetime.now(timezone.utc).isoformat()
        cls._memory_drafts[draft_id] = draft

        if cls.BASE and settings.supabase_anon_key:
            try:
                url = f"{cls.BASE}/email_drafts?id=eq.{quote(str(draft_id))}"
                headers = {**cls.HEADERS, "Prefer": "return=representation"}
                db_updates = {k: v for k, v in updates.items() if not k.startswith("_")}
                req = Request(url, data=json.dumps(db_updates).encode(), headers=headers, method="PATCH")
                with urlopen(req, timeout=6) as resp:
                    rows = json.loads(resp.read().decode())
                    if rows:
                        cls._memory_drafts[draft_id] = rows[0]
                        return rows[0]
            except Exception as exc:
                logger.warning(f"Failed to update draft {draft_id} in Supabase: {exc}")

        return draft

    @classmethod
    def mark_sent(cls, draft_id: str) -> Optional[Dict[str, Any]]:
        """Mark draft as sent with timestamp."""
        now = datetime.now(timezone.utc).isoformat()
        return cls.update_draft(draft_id, {"status": "sent", "sent_time": now})

