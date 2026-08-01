"""ABM Research Pipeline — main orchestrator.

Usage:
    python main.py

Or import and call run_pipeline() programmatically.
"""
import json
import logging
import sys
import concurrent.futures
from datetime import datetime, timezone

from config import settings
from models.product import ProductInput
from models.research_result import (
    CompanyResult, ResearchMetadata, ResearchResult,
    WebsiteIntelligence, RedditIntelligence, RedditSignalItem,
)
from agents.product_analyzer import analyze_product
from agents.company_discovery import discover_companies
from agents.signal_analyzer import extract_signals
from agents.relevance_ranker import rank_companies
from collectors.website_collector import collect_website
from collectors.reddit_collector import collect_reddit
from processors.relevance_filter import filter_relevant_content
from processors.deduplicator import deduplicate_signals
from utils.dates import unix_to_iso, utc_now_iso
from utils.json_writer import write_results

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)-8s | %(name)s | %(message)s",
    handlers=[logging.StreamHandler(sys.stdout)],
)
logger = logging.getLogger(__name__)


def run_pipeline(
    product_input: dict,
    industry_category: str,
    target_company_count: int = 50,
) -> ResearchResult:
    """Run the full ABM research pipeline.

    Args:
        product_input: dict matching ProductInput schema
        industry_category: e.g. "FinTech", "B2B SaaS"
        target_company_count: how many companies to research

    Returns:
        ResearchResult with ranked companies and all intelligence.
    """
    logger.info("=== ABM Research Pipeline Starting ===")
    logger.info("Industry: %s | Target companies: %d", industry_category, target_company_count)

    # ── Step 1: Product Intelligence ─────────────────────────────────────────
    logger.info("Step 1: Analyzing product...")
    product = analyze_product(ProductInput(**product_input))
    logger.info("Product profile built — %d keyword groups", 6)

    # ── Step 2: Company Discovery ─────────────────────────────────────────────
    logger.info("Step 2: Discovering companies in '%s'...", industry_category)
    companies = discover_companies(industry_category, product, target_company_count)
    logger.info("Discovered %d valid companies", len(companies))

    # ── Step 3: Research each company ─────────────────────────────────────────
    logger.info("Step 3: Researching %d companies...", len(companies))
    results: list[CompanyResult] = []

    with concurrent.futures.ThreadPoolExecutor(max_workers=settings.concurrency_limit) as executor:
        futures = {
            executor.submit(_research_company, company, product): company
            for company in companies
        }
        for future in concurrent.futures.as_completed(futures):
            company = futures[future]
            try:
                result = future.result()
                results.append(result)
                logger.info("Researched: %s (signals: %d)", company.name, len(result.signals))
            except Exception as e:
                logger.error("Failed to research %s: %s", company.name, e)
                # Add empty result so company is still in output
                results.append(CompanyResult(
                    company={"name": company.name, "website": company.website, "domain": company.domain, "industry": company.industry, "description": ""},
                    research_gaps=["Research failed: " + str(e)[:100]],
                ))

    # ── Step 4: Rank companies ────────────────────────────────────────────────
    logger.info("Step 4: Ranking %d companies...", len(results))
    ranked = rank_companies(results, product)

    # ── Step 5: Build final output ────────────────────────────────────────────
    result = ResearchResult(
        research_metadata=ResearchMetadata(
            generated_at=utc_now_iso(),
            industry_category=industry_category,
            companies_requested=target_company_count,
            companies_discovered=len(companies),
            companies_researched=len(results),
        ),
        product_context={
            "name": product.name,
            "website": product.website,
            "description": product.description,
            "features": product.features,
            "value_proposition": product.value_proposition,
            "pain_keywords": product.keywords.pain_keywords,
            "solution_keywords": product.keywords.solution_keywords,
            "growth_keywords": product.keywords.growth_keywords,
            "hiring_keywords": product.keywords.hiring_keywords,
            "technology_keywords": product.keywords.technology_keywords,
            "intent_keywords": product.keywords.intent_keywords,
        },
        companies=ranked,
    )

    write_results(result, settings.output_path)
    logger.info("=== Pipeline Complete — results saved to %s ===", settings.output_path)
    return result


def _research_company(company, product) -> CompanyResult:
    """Research a single company — website + Reddit — and return CompanyResult."""
    name = company.name

    # ── Website research ──────────────────────────────────────────────────────
    pages = []
    relevant_pages = []
    evidence_chunks = []

    try:
        pages = collect_website(company.website)
        for page in pages:
            filtered = filter_relevant_content(page["text"], product)
            if filtered:
                relevant_pages.append(page["url"])
                for chunk in filtered[:5]:  # max 5 chunks per page
                    evidence_chunks.append({
                        "text": chunk["text"],
                        "source_url": page["url"],
                        "source_type": "website",
                        "published_at": None,
                    })
    except Exception as e:
        logger.warning("Website research failed for %s: %s", name, e)

    # ── Reddit research ───────────────────────────────────────────────────────
    reddit_posts = []
    reddit_queries = []
    try:
        reddit_posts, reddit_queries = collect_reddit(name, product)
        for post in reddit_posts:
            evidence_chunks.append({
                "text": f"{post.title}. {post.body}",
                "source_url": post.permalink,
                "source_type": "reddit",
                "published_at": unix_to_iso(post.created_utc),
            })
    except Exception as e:
        logger.warning("Reddit research failed for %s: %s", name, e)

    # ── Signal extraction ─────────────────────────────────────────────────────
    signals = []
    if evidence_chunks:
        raw_signals = extract_signals(name, evidence_chunks, product)
        signals = deduplicate_signals(raw_signals)

    # ── Build Reddit intelligence ─────────────────────────────────────────────
    reddit_signal_items = [
        RedditSignalItem(
            signal_class=p.signal_class,
            subreddit=p.subreddit,
            title=p.title,
            summary=p.body[:200],
            evidence=p.body[:300],
            permalink=p.permalink,
            created_at=unix_to_iso(p.created_utc),
            score=p.score,
            num_comments=p.num_comments,
            relevance_score=p.relevance_score,
        )
        for p in reddit_posts
    ]

    # ── Key findings from website ─────────────────────────────────────────────
    key_findings = list({s.title for s in signals if s.source_type == "website"})[:5]

    return CompanyResult(
        company={
            "name": name,
            "website": company.website,
            "domain": company.domain,
            "industry": company.industry,
            "description": company.description,
        },
        signals=signals,
        website_intelligence=WebsiteIntelligence(
            pages_checked=len(pages),
            relevant_pages=relevant_pages,
            key_findings=key_findings,
        ),
        reddit_intelligence=RedditIntelligence(
            queries_used=reddit_queries,
            posts_checked=len(reddit_posts),
            relevant_posts=len([p for p in reddit_posts if p.relevance_score >= 0.4]),
            signals=reddit_signal_items,
        ),
        research_gaps=_identify_gaps(signals, pages, reddit_posts),
    )


def _identify_gaps(signals, pages, reddit_posts) -> list[str]:
    gaps = []
    if not pages:
        gaps.append("Website could not be accessed")
    if not signals:
        gaps.append("No relevant signals found")
    if not reddit_posts:
        gaps.append("No Reddit data found")
    if len(signals) < 3:
        gaps.append("Limited evidence — manual research recommended")
    return gaps


# ── CLI entry point ───────────────────────────────────────────────────────────

if __name__ == "__main__":
    EXAMPLE_INPUT = {
        "product": {
            "name": "AccountPilot AI",
            "website": "https://accountpilot.ai",
            "description": "AI-powered Account-Based Marketing platform that autonomously researches enterprise accounts, identifies buying intent, and generates personalized outreach",
            "features": ["AI account research", "buying intent detection", "stakeholder mapping", "personalized outreach generation", "multi-agent pipeline"],
            "value_proposition": "Reduce sales research time by 80% and increase pipeline conversion with AI-generated account intelligence",
        },
        "industry_category": "B2B SaaS",
        "target_company_count": 10,
    }

    result = run_pipeline(
        product_input=EXAMPLE_INPUT["product"],
        industry_category=EXAMPLE_INPUT["industry_category"],
        target_company_count=EXAMPLE_INPUT["target_company_count"],
    )

    print(f"\n✓ Pipeline complete — {len(result.companies)} companies ranked")
    print(f"  Top company: {result.companies[0].company['name']} (score: {result.companies[0].scores.product_relevance_score})")
    print(f"  Results saved to: {settings.output_path}")
