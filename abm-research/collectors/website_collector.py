"""Website Collector.

Fetches a company's homepage, discovers priority internal links,
and collects text from the most relevant pages only.
"""
import logging
import re
import time
from urllib.parse import urljoin, urlparse
from urllib.robotparser import RobotFileParser

import httpx
from bs4 import BeautifulSoup

from config import settings

logger = logging.getLogger(__name__)

PRIORITY_SLUGS = [
    "about", "product", "products", "solution", "solutions", "platform",
    "customer", "customers", "case-study", "case-studies", "blog", "news",
    "press", "careers", "jobs", "partner", "partners", "pricing",
]

SKIP_SLUGS = [
    "privacy", "terms", "cookie", "legal", "login", "signup", "sign-up",
    "register", "gdpr", "accessibility", "sitemap", "404",
]

HEADERS = {"User-Agent": "Mozilla/5.0 (compatible; ABMResearchBot/1.0; +https://accountpilot.ai)"}


def fetch_page_text(url: str) -> str:
    """Fetch a single page and return cleaned text."""
    try:
        with httpx.Client(timeout=settings.request_timeout, follow_redirects=True) as client:
            resp = client.get(url, headers=HEADERS)
            if resp.status_code >= 400:
                return ""
            return _extract_text(resp.text)
    except Exception as e:
        logger.debug("fetch_page_text failed for %s: %s", url, e)
        return ""


def collect_website(base_url: str) -> list[dict]:
    """Collect text from up to MAX_PAGES_PER_COMPANY priority pages.

    Returns list of {url, title, text, fetched_at}.
    """
    pages: list[dict] = []
    visited: set[str] = set()
    domain = urlparse(base_url).netloc

    robot_parser = _load_robots(base_url)

    with httpx.Client(timeout=settings.request_timeout, follow_redirects=True, headers=HEADERS) as client:
        # Always fetch homepage
        home = _fetch_page(client, base_url, robot_parser)
        if home:
            pages.append(home)
            visited.add(base_url)

        # Discover and prioritize internal links
        links = _discover_links(home["raw_html"] if home else "", base_url, domain)
        priority_links = _prioritize_links(links)

        for url in priority_links:
            if len(pages) >= settings.max_pages_per_company:
                break
            if url in visited:
                continue
            visited.add(url)

            if not _is_allowed(robot_parser, url):
                continue

            page = _fetch_page(client, url, robot_parser)
            if page:
                pages.append(page)
            time.sleep(0.5)  # polite rate limiting

    logger.info("Collected %d pages from %s", len(pages), base_url)
    return pages


def _fetch_page(client: httpx.Client, url: str, robots: RobotFileParser) -> dict | None:
    try:
        resp = client.get(url)
        if resp.status_code >= 400:
            return None
        content_type = resp.headers.get("content-type", "")
        if "text/html" not in content_type:
            return None

        soup = BeautifulSoup(resp.text, "html.parser")
        title = soup.title.string.strip() if soup.title and soup.title.string else ""
        text = _extract_text_from_soup(soup)

        return {
            "url": str(resp.url),
            "title": title,
            "text": text[:settings.max_content_length],
            "raw_html": resp.text[:50000],
            "fetched_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        }
    except Exception as e:
        logger.debug("Page fetch failed %s: %s", url, e)
        return None


def _extract_text(html: str) -> str:
    soup = BeautifulSoup(html, "html.parser")
    return _extract_text_from_soup(soup)


def _extract_text_from_soup(soup: BeautifulSoup) -> str:
    for tag in soup(["script", "style", "nav", "footer", "header", "noscript", "iframe"]):
        tag.decompose()
    text = soup.get_text(separator=" ", strip=True)
    text = re.sub(r"\s{2,}", " ", text)
    return text.strip()


def _discover_links(html: str, base_url: str, domain: str) -> list[str]:
    if not html:
        return []
    soup = BeautifulSoup(html, "html.parser")
    links = []
    for a in soup.find_all("a", href=True):
        href = a["href"]
        full = urljoin(base_url, href)
        parsed = urlparse(full)
        if parsed.netloc == domain and parsed.scheme in ("http", "https"):
            clean = parsed._replace(fragment="", query="").geturl()
            links.append(clean)
    return list(set(links))


def _prioritize_links(links: list[str]) -> list[str]:
    priority, normal = [], []
    for link in links:
        path = urlparse(link).path.lower()
        if any(skip in path for skip in SKIP_SLUGS):
            continue
        if any(slug in path for slug in PRIORITY_SLUGS):
            priority.append(link)
        else:
            normal.append(link)
    return priority + normal


def _load_robots(base_url: str) -> RobotFileParser:
    rp = RobotFileParser()
    try:
        robots_url = urljoin(base_url, "/robots.txt")
        rp.set_url(robots_url)
        rp.read()
    except Exception:
        pass
    return rp


def _is_allowed(rp: RobotFileParser, url: str) -> bool:
    try:
        return rp.can_fetch("ABMResearchBot", url)
    except Exception:
        return True
