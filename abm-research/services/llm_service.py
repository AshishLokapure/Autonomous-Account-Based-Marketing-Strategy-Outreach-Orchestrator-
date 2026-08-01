"""Provider-independent LLM service.

All pipeline modules call this service — never the OpenAI SDK directly.
Structured JSON responses are validated with Pydantic and retried on parse failure.
"""
import json
import logging
from typing import Any, Type, TypeVar
from pydantic import BaseModel, ValidationError
from openai import OpenAI, APIError, RateLimitError

from config import settings

logger = logging.getLogger(__name__)
T = TypeVar("T", bound=BaseModel)

_client = OpenAI(api_key=settings.openai_api_key)

SYSTEM_JSON = (
    "You are a precise research assistant. "
    "Always respond with valid JSON only — no markdown, no explanation, no code fences."
)


def _chat(system: str, user: str, max_tokens: int = 2000) -> str:
    """Raw LLM call with basic retry on rate-limit."""
    for attempt in range(3):
        try:
            resp = _client.chat.completions.create(
                model=settings.openai_model,
                temperature=settings.openai_temperature,
                max_tokens=max_tokens,
                messages=[
                    {"role": "system", "content": system},
                    {"role": "user", "content": user},
                ],
            )
            return resp.choices[0].message.content or ""
        except RateLimitError:
            import time
            wait = 2 ** attempt
            logger.warning("Rate limit hit — waiting %ss", wait)
            time.sleep(wait)
        except APIError as e:
            logger.error("OpenAI API error: %s", e)
            raise
    raise RuntimeError("LLM call failed after 3 attempts")


def _parse_json(raw: str) -> Any:
    raw = raw.strip()
    if raw.startswith("```"):
        raw = raw.split("```")[1]
        if raw.startswith("json"):
            raw = raw[4:]
    return json.loads(raw.strip())


def call_structured(prompt: str, schema: Type[T], system: str = SYSTEM_JSON, max_tokens: int = 2000) -> T:
    """Call LLM and parse response into *schema*. Retries once on parse failure."""
    for attempt in range(2):
        raw = _chat(system, prompt, max_tokens)
        try:
            data = _parse_json(raw)
            return schema.model_validate(data)
        except (json.JSONDecodeError, ValidationError) as e:
            logger.warning("LLM parse attempt %d failed: %s", attempt + 1, e)
            if attempt == 1:
                raise
    raise RuntimeError("Unreachable")


def call_json(prompt: str, system: str = SYSTEM_JSON, max_tokens: int = 2000) -> Any:
    """Call LLM and return raw parsed JSON (dict or list)."""
    for attempt in range(2):
        raw = _chat(system, prompt, max_tokens)
        try:
            return _parse_json(raw)
        except json.JSONDecodeError as e:
            logger.warning("JSON parse attempt %d failed: %s", attempt + 1, e)
            if attempt == 1:
                raise
    raise RuntimeError("Unreachable")
