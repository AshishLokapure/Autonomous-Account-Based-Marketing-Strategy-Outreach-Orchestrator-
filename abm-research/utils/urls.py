"""URL utilities."""
import re
from urllib.parse import urlparse


def normalize_url(url: str) -> str:
    url = url.strip()
    if not url.startswith(("http://", "https://")):
        url = "https://" + url
    return url.rstrip("/")


def normalize_domain(url: str) -> str:
    try:
        parsed = urlparse(normalize_url(url))
        domain = parsed.netloc.lower()
        return re.sub(r"^www\.", "", domain)
    except Exception:
        return url.lower()
