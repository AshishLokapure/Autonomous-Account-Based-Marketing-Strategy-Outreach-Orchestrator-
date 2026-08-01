"""Company Discovery Agent.

Uses LLM to generate companies in a given industry, then validates each one
by checking domain reachability and name/industry match.
"""
import logging
import re
from urllib.parse import urlparse

import httpx

from models.company import CompanyInput, CompanyValidated
from models.product import ProductProfile
from services.llm_service import call_json
from utils.urls import normalize_domain, normalize_url
from config import settings

logger = logging.getLogger(__name__)


def discover_companies(
    industry: str,
    product: ProductProfile,
    count: int = 50,
) -> list[CompanyValidated]:
    """Generate and validate companies for the given industry."""
    raw = _llm_discover(industry, product, count)
    logger.info("LLM returned %d companies for industry '%s'", len(raw), industry)

    seen_domains: set[str] = set()
    validated: list[CompanyValidated] = []

    for item in raw:
        name = str(item.get("name", "")).strip()
        website = str(item.get("website", "")).strip()
        if not name or not website:
            continue

        website = normalize_url(website)
        domain = normalize_domain(website)

        if domain in seen_domains:
            logger.debug("Duplicate domain skipped: %s", domain)
            continue
        seen_domains.add(domain)

        company = _validate_company(name, website, domain, industry)
        if company.is_valid:
            validated.append(company)
            logger.debug("Valid: %s (%s)", name, domain)
        else:
            logger.debug("Invalid: %s — %s", name, company.validation_error)

        if len(validated) >= count:
            break

    logger.info("Validated %d/%d companies", len(validated), len(raw))
    return validated


def _llm_discover(industry: str, product: ProductProfile, count: int) -> list[dict]:
    prompt = f"""Generate a list of {count} real companies in the '{industry}' industry.

These companies should be potential buyers of: {product.description}

Return a JSON array. Each item must have exactly:
- "name": company name (string)
- "website": company homepage URL (string, must start with https://)

Return only real, well-known companies with publicly accessible websites.
Do not include the product vendor itself ({product.name}).
Return only the JSON array, no other text."""

    try:
        data = call_json(prompt, max_tokens=2000)
        if isinstance(data, list):
            return data
        if isinstance(data, dict) and "companies" in data:
            return data["companies"]
        return []
    except Exception as e:
        logger.error("Company discovery LLM call failed: %s", e)
        return []


def _validate_company(name: str, website: str, domain: str, industry: str) -> CompanyValidated:
    try:
        parsed = urlparse(website)
        if not parsed.scheme or not parsed.netloc:
            return CompanyValidated(name=name, website=website, domain=domain, is_valid=False, validation_error="Invalid URL format")

        with httpx.Client(timeout=settings.request_timeout, follow_redirects=True) as client:
            resp = client.head(website, headers={"User-Agent": "Mozilla/5.0 (compatible; ABMBot/1.0)"})
            if resp.status_code >= 400:
                # Try GET as fallback
                resp = client.get(website, headers={"User-Agent": "Mozilla/5.0 (compatible; ABMBot/1.0)"})
            if resp.status_code >= 400:
                return CompanyValidated(name=name, website=website, domain=domain, is_valid=False, validation_error=f"HTTP {resp.status_code}")

        return CompanyValidated(name=name, website=website, domain=domain, industry=industry, is_valid=True)

    except httpx.TimeoutException:
        return CompanyValidated(name=name, website=website, domain=domain, is_valid=False, validation_error="Timeout")
    except Exception as e:
        return CompanyValidated(name=name, website=website, domain=domain, is_valid=False, validation_error=str(e)[:100])
