"""Settings service — Supabase REST API operations for user_settings and email_logs."""

from __future__ import annotations

import json
from datetime import datetime, timezone
from typing import Any
from urllib.error import HTTPError
from urllib.parse import quote
from urllib.request import Request, urlopen
from uuid import uuid4

from app.core.config import get_settings
from app.core.logger import logger

settings = get_settings()


class SettingsService:
    """CRUD operations for the user_settings and email_logs Supabase tables."""

    BASE = f"{settings.supabase_url.rstrip('/')}/rest/v1" if settings.supabase_url else ""
    HEADERS = {
        "apikey": settings.supabase_anon_key or "",
        "Authorization": f"Bearer {settings.supabase_anon_key or ''}",
        "Content-Type": "application/json",
    }

    _cache: dict[str, dict[str, Any]] = {}
    _email_logs: list[dict[str, Any]] = []

    # ── user_settings ────────────────────────────────────────────────────

    @classmethod
    def get_settings(cls, user_id: str) -> dict[str, Any] | None:
        """Fetch user settings by user_id."""
        if cls.BASE and settings.supabase_anon_key:
            url = f"{cls.BASE}/user_settings?user_id=eq.{quote(str(user_id))}&select=*"
            try:
                req = Request(url, headers=cls.HEADERS, method="GET")
                with urlopen(req, timeout=5) as resp:
                    rows = json.loads(resp.read().decode())
                    if rows:
                        cls._cache[user_id] = rows[0]
                        return rows[0]
            except Exception as exc:
                logger.debug(f"Supabase settings lookup note: {exc}")
        
        return cls._cache.get(user_id)

    @classmethod
    def upsert_settings(cls, user_id: str, data: dict[str, Any]) -> dict[str, Any] | None:
        """Create or update user settings (upsert on user_id)."""
        now = datetime.now(timezone.utc).isoformat()
        data["user_id"] = user_id
        data.setdefault("id", str(uuid4()))
        data.setdefault("created_at", now)
        data["updated_at"] = now
        cls._cache[user_id] = {**cls._cache.get(user_id, {}), **data}
        
        if cls.BASE and settings.supabase_anon_key:
            url = f"{cls.BASE}/user_settings"
            headers = {**cls.HEADERS, "Prefer": "resolution=merge-duplicates,return=representation"}
            try:
                req = Request(url, data=json.dumps([data]).encode(), headers=headers, method="POST")
                with urlopen(req, timeout=5) as resp:
                    rows = json.loads(resp.read().decode())
                    if rows:
                        cls._cache[user_id] = rows[0]
                        return rows[0]
                    return cls._cache[user_id]
            except Exception as exc:
                logger.warning(f"Supabase upsert note (persisted to memory): {exc}")
                return cls._cache[user_id]

        return cls._cache.get(user_id)

    # ── email_logs ───────────────────────────────────────────────────────

    @classmethod
    def get_email_logs(cls, user_id: str, limit: int = 100) -> list[dict[str, Any]]:
        """Fetch email logs for a user."""
        if cls.BASE and settings.supabase_anon_key:
            url = f"{cls.BASE}/email_logs?user_id=eq.{quote(str(user_id))}&select=*&order=created_at.desc&limit={limit}"
            try:
                req = Request(url, headers=cls.HEADERS, method="GET")
                with urlopen(req, timeout=5) as resp:
                    rows = json.loads(resp.read().decode())
                    if rows:
                        return rows
            except Exception as exc:
                logger.debug(f"Supabase email logs note: {exc}")
            
        return [log for log in cls._email_logs if log.get("user_id") == user_id][:limit]

    @classmethod
    def create_email_log(cls, data: dict[str, Any]) -> dict[str, Any] | None:
        """Insert an email log record."""
        log_entry = dict(data)
        log_entry.setdefault("id", str(uuid4()))
        log_entry.setdefault("created_at", datetime.now(timezone.utc).isoformat())
        log_entry.setdefault("status", "sent")

        cls._email_logs.insert(0, log_entry)

        if cls.BASE and settings.supabase_anon_key:
            url = f"{cls.BASE}/email_logs"
            headers = {**cls.HEADERS, "Prefer": "return=representation"}
            try:
                req = Request(url, data=json.dumps([log_entry]).encode(), headers=headers, method="POST")
                with urlopen(req, timeout=5) as resp:
                    rows = json.loads(resp.read().decode())
                    return rows[0] if rows else log_entry
            except Exception as exc:
                logger.debug(f"Supabase create email log note: {exc}")
                return log_entry

        return log_entry

    # ── auto-send check helper ───────────────────────────────────────────

    @classmethod
    def is_auto_send_enabled(cls, user_id: str) -> bool:
        """Quick check if auto_send_email is enabled for a user."""
        s = cls.get_settings(user_id)
        if s is None:
            return False
        return bool(s.get("auto_send_email", False))

