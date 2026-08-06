"""EmailService — SMTP & Brevo REST dispatch with delivery status and audit logging."""

from __future__ import annotations

import json
import smtplib
from email.message import EmailMessage
from typing import Tuple
from urllib.error import HTTPError
from urllib.request import Request, urlopen

from app.core.config import get_settings
from app.core.logger import logger
from app.services.settings_service import SettingsService

settings = get_settings()


class EmailService:
    @classmethod
    def _send_via_brevo_api(
        cls,
        api_key: str,
        to_email: str,
        subject: str,
        content: str,
        from_email: str,
        from_name: str,
    ) -> Tuple[bool, str]:
        """Dispatch email via Brevo / Sendinblue REST API (avoids SMTP 525 IP restrictions)."""
        url = "https://api.brevo.com/v3/smtp/email"
        payload = {
            "sender": {"name": from_name, "email": from_email},
            "to": [{"email": to_email}],
            "subject": subject,
            "textContent": content,
        }
        headers = {
            "api-key": api_key,
            "Content-Type": "application/json",
            "Accept": "application/json",
        }
        try:
            req = Request(url, data=json.dumps(payload).encode("utf-8"), headers=headers, method="POST")
            with urlopen(req, timeout=10) as resp:
                data = json.loads(resp.read().decode("utf-8"))
                message_id = data.get("messageId", "ok")
                return True, f"Live email dispatched via Brevo REST API (Message ID: {message_id})"
        except Exception as exc:
            return False, f"Brevo API error: {exc}"

    @classmethod
    def send_email(
        cls,
        to_email: str,
        subject: str,
        content: str,
        user_id: str = "00000000-0000-0000-0000-000000000000",
        campaign_name: str = "Enterprise Outreach",
    ) -> Tuple[bool, str]:
        """Dispatch email via Brevo REST API, SMTP server, or simulated sandbox."""
        curr_settings = get_settings()
        from_email = curr_settings.mail_from or curr_settings.mail_username or "outreach@antigravity.io"
        from_name = curr_settings.mail_from_name or "ABM Outreach Team"

        # 1. Check for dedicated Brevo / Sendinblue API Key
        brevo_key = curr_settings.brevo_api_key or curr_settings.sendinblue_api_key
        if brevo_key:
            success, msg = cls._send_via_brevo_api(
                api_key=brevo_key,
                to_email=to_email,
                subject=subject,
                content=content,
                from_email=from_email,
                from_name=from_name,
            )
            if success:
                logger.info(f"Email sent successfully to {to_email} via Brevo API")
                SettingsService.create_email_log({
                    "user_id": user_id,
                    "recipient": to_email,
                    "subject": subject,
                    "status": "sent",
                    "campaign_name": campaign_name,
                })
                return True, msg
            else:
                logger.warning(f"Brevo REST API failed ({msg}), attempting SMTP fallback...")

        # 2. Check if SMTP configuration is present
        if not curr_settings.mail_server or not curr_settings.mail_username or not curr_settings.mail_password:
            logger.info(f"[Email Sandbox] Simulated delivery to {to_email} with subject '{subject}'")
            SettingsService.create_email_log({
                "user_id": user_id,
                "recipient": to_email,
                "subject": subject,
                "status": "sent",
                "campaign_name": campaign_name,
            })
            return True, f"Simulated delivery to {to_email} (Sandbox mode — configure SMTP in Settings for live relay)"

        msg = EmailMessage()
        msg["Subject"] = subject
        msg["From"] = f"{from_name} <{from_email}>"
        msg["To"] = to_email
        msg.set_content(content)

        try:
            with smtplib.SMTP(curr_settings.mail_server, curr_settings.mail_port) as server:
                server.starttls()
                server.login(curr_settings.mail_username, curr_settings.mail_password)
                server.send_message(msg)

            logger.info(f"Email sent successfully to {to_email} via SMTP")
            SettingsService.create_email_log({
                "user_id": user_id,
                "recipient": to_email,
                "subject": subject,
                "status": "sent",
                "campaign_name": campaign_name,
            })
            return True, f"Live email successfully dispatched to {to_email} via SMTP"

        except Exception as e:
            err_msg = str(e)
            logger.error(f"Failed to send email to {to_email} via SMTP: {err_msg}")

            # Check if password could be a Brevo API key and try REST fallback
            if "525" in err_msg or "unauthorized" in err_msg.lower() or "535" in err_msg:
                if curr_settings.mail_password and curr_settings.mail_password.startswith("xkeysib-"):
                    logger.info("Attempting automatic fallback to Brevo REST API using mail_password...")
                    success, rest_msg = cls._send_via_brevo_api(
                        api_key=curr_settings.mail_password,
                        to_email=to_email,
                        subject=subject,
                        content=content,
                        from_email=from_email,
                        from_name=from_name,
                    )
                    if success:
                        SettingsService.create_email_log({
                            "user_id": user_id,
                            "recipient": to_email,
                            "subject": subject,
                            "status": "sent",
                            "campaign_name": campaign_name,
                        })
                        return True, rest_msg

            SettingsService.create_email_log({
                "user_id": user_id,
                "recipient": to_email,
                "subject": subject,
                "status": "failed",
                "campaign_name": campaign_name,
            })
            return False, f"SMTP Error: {err_msg}"

