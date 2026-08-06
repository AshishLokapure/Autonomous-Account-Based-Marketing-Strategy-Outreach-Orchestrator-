"""Settings API — user preferences, password, and email logs.

GET  /api/v1/settings          — Fetch user settings
POST /api/v1/settings          — Create user settings
PUT  /api/v1/settings          — Update user settings
POST /api/v1/settings/password — Change password via Supabase Auth
GET  /api/v1/email-logs        — Retrieve email send logs
"""

from __future__ import annotations

import json
from typing import Any
from urllib.request import Request, urlopen
from urllib.error import HTTPError

from fastapi import APIRouter, HTTPException, Query, status
from pydantic import BaseModel, Field

from app.services.settings_service import SettingsService
from app.core.config import get_settings
from app.core.logger import logger

router = APIRouter()
logs_router = APIRouter()
app_settings = get_settings()


class UserSettingsPayload(BaseModel):
    user_id: str
    full_name: str | None = None
    company_name: str | None = None
    designation: str | None = None
    phone_number: str | None = None
    profile_picture_url: str | None = None
    auto_send_email: bool | None = None
    sender_name: str | None = None
    reply_email: str | None = None
    timezone: str | None = None
    daily_limit: int | None = None
    delay_between_emails: int | None = None
    email_signature: str | None = None
    llm_model: str | None = None
    temperature: float | None = None
    writing_style: str | None = None
    tone_tags: list[str] | None = None
    email_length: str | None = None
    notify_email_opened: bool | None = None
    notify_campaign_complete: bool | None = None
    notify_agent_failure: bool | None = None
    weekly_report: bool | None = None
    daily_summary: bool | None = None


DEFAULT_SETTINGS: dict[str, Any] = {
    "full_name": "Ashish Lokapure",
    "company_name": "AccountPilot AI",
    "designation": "Head of Growth",
    "phone_number": "+1 (555) 019-2834",
    "auto_send_email": False,
    "sender_name": "Ashish Lokapure",
    "reply_email": "ashish@accountpilot.ai",
    "timezone": "UTC-5 (Eastern Time)",
    "daily_limit": 50,
    "delay_between_emails": 120,
    "email_signature": "--\nBest regards,\nAshish Lokapure\nAccountPilot AI",
    "llm_model": "grok-beta",
    "temperature": 0.7,
    "writing_style": "Professional & Consultative",
    "tone_tags": ["Value-Driven", "Data-Backed", "Strategic"],
    "email_length": "concise",
    "notify_email_opened": True,
    "notify_campaign_complete": True,
    "notify_agent_failure": True,
    "weekly_report": True,
    "daily_summary": False,
}


class PasswordUpdatePayload(BaseModel):
    user_id: str
    new_password: str = Field(..., min_length=8)


@router.get("", summary="Get user settings")
async def get_settings(user_id: str = Query(...)):
    user_settings = SettingsService.get_settings(user_id)
    if not user_settings:
        # Seamlessly return default initialized settings for new users (200 OK)
        return {"status": "success", "data": {"user_id": user_id, **DEFAULT_SETTINGS}}
    return {"status": "success", "data": user_settings}


@router.post("", summary="Create user settings")
@router.put("", summary="Update user settings")
async def upsert_settings(payload: UserSettingsPayload):
    data = payload.model_dump(exclude_unset=True, exclude_none=True)
    user_id = data.pop("user_id", None)
    if not user_id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="user_id is required")
        
    result = SettingsService.upsert_settings(user_id, data)
    if not result:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to save settings")
    return {"status": "success", "data": result}


@router.post("/password", summary="Update user password")
async def update_password(payload: PasswordUpdatePayload):
    # This requires Supabase Admin API or the user's access token.
    # Since we only have anon_key and service_role in typical setups, we'll try to use the Admin API.
    url = f"{app_settings.supabase_url.rstrip('/')}/auth/v1/admin/users/{payload.user_id}"
    
    headers = {
        "apikey": app_settings.supabase_service_role_key or app_settings.supabase_anon_key,
        "Authorization": f"Bearer {app_settings.supabase_service_role_key or app_settings.supabase_anon_key}",
        "Content-Type": "application/json",
    }
    
    data = {"password": payload.new_password}
    
    try:
        req = Request(url, data=json.dumps(data).encode(), headers=headers, method="PUT")
        with urlopen(req, timeout=8) as resp:
            return {"status": "success", "message": "Password updated successfully"}
    except HTTPError as exc:
        body = exc.read().decode() if exc.fp else str(exc)
        logger.error(f"Password update failed: {body}")
        raise HTTPException(status_code=exc.code, detail="Failed to update password")
    except Exception as exc:
        logger.error(f"Password update error: {exc}")
        raise HTTPException(status_code=500, detail="Internal server error updating password")


@logs_router.get("", summary="Get email logs")
async def get_email_logs(user_id: str = Query(...), limit: int = Query(100)):
    logs = SettingsService.get_email_logs(user_id, limit=limit)
    return {"status": "success", "data": logs}
