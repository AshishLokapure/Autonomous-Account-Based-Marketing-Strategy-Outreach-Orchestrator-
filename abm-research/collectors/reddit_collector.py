"""Reddit Collector using PRAW.

Generates smart search queries per company, fetches relevant posts,
classifies each post's signal type, and returns structured RedditPost objects.
"""
import logging
import os
from datetime import datetime, timezone

import praw
from praw.exceptions import PRAWException

from models.evidence import RedditPost
from models.product import ProductProfile
from services.llm_service import call_json
from config import settings

logger = logging.getLogger(__name__)


def _get_reddit() -> praw.Reddit:
    return praw.Reddit(
        client_id=os.getenv("REDDIT_CLIENT_ID", ""),
        client_secret=os.getenv("REDDIT_CLIENT_SECRET", ""),
        user_agent=os.getenv("REDDIT_USER_AGENT", settings.reddit_user_agent),
        read_only=True,
    )


def generate_reddit_queries(company_name: str, product: ProductProfile) -> list[str]:
    """Generate 3-8 high-value Reddit search queries for a company."""
    pain_kws = product.keywords.pain_keywords[:4]
    tech_kws = product.keywords.technology_keywords[:3]

    prompt = f"""Generate {settings.max_reddit_queries_per_company} Reddit search queries to find
discussions about "{company_name}" that are relevant to this product: {product.description}

Pain keywords: {', '.join(pain_kws)}
Technology keywords: {', '.join(tech_kws)}

Return a JSON array of query strings only. Each query should be 2-5 words.
Focus on: company problems, customer complaints, technology discussions, hiring signals.
Do NOT generate queries that are too generic or unrelated to the product.
Example format: ["CompanyName customer support", "CompanyName automation", ...]"""

    try:
        queries = call_json(prompt, max_tokens=300)
        if isinstance(queries, list):
            return [str(q) for q in queries[:settings.max_reddit_queries_per_company]]
    except Exception as e:
        logger.warning("Query generation failed for %s: %s", company_name, e)

    # Fallback: basic queries
    return [
        f"{company_name} {pain_kws[0]}" if pain_kws else company_name,
        f"{company_name} problems",
        f"{company_name} {tech_kws[0]}" if tech_kws else f"{company_name} software",
    ]


def collect_reddit(company_name: str, product: ProductProfile) -> tuple[list[RedditPost], list[str]]:
    """Collect Reddit posts for a company. Returns (posts, queries_used)."""
    try:
        reddit = _get_reddit()
    except Exception as e:
        logger.error("PRAW init failed: %s", e)
        return [], []

    queries = generate_reddit_queries(company_name, product)
    all_posts: list[RedditPost] = []
    seen_ids: set[str] = set()

    for query in queries:
        try:
            results = reddit.subreddit("all").search(
                query,
                limit=settings.max_reddit_results_per_query,
                sort="relevance",
                time_filter="year",
            )
            for submission in results:
                if submission.id in seen_ids:
                    continue
                seen_ids.add(submission.id)

                body = submission.selftext or ""
                if len(body) > 1000:
                    body = body[:1000]

                post = RedditPost(
                    post_id=submission.id,
                    title=submission.title,
                    subreddit=str(submission.subreddit),
                    body=body,
                    created_utc=submission.created_utc,
                    score=submission.score,
                    num_comments=submission.num_comments,
                    permalink=f"https://reddit.com{submission.permalink}",
                    search_query=query,
                )
                all_posts.append(post)

        except PRAWException as e:
            logger.warning("PRAW search failed for query '%s': %s", query, e)
        except Exception as e:
            logger.warning("Reddit search error for '%s': %s", query, e)

    # Classify signal types
    classified = _classify_posts(all_posts, company_name, product)
    relevant = [p for p in classified if p.signal_class != "irrelevant" and p.relevance_score >= 0.3]

    logger.info("Reddit: %d posts found, %d relevant for %s", len(all_posts), len(relevant), company_name)
    return relevant, queries


def _classify_posts(posts: list[RedditPost], company_name: str, product: ProductProfile) -> list[RedditPost]:
    """Classify each post's signal type using LLM."""
    if not posts:
        return []

    post_summaries = "\n".join(
        f"[{i}] Title: {p.title[:100]} | Body: {p.body[:150]}"
        for i, p in enumerate(posts[:20])
    )

    prompt = f"""Classify these Reddit posts about "{company_name}" for relevance to: {product.description}

Posts:
{post_summaries}

For each post index, return:
- signal_class: one of: direct_company_signal, customer_signal, market_signal, competitor_signal, irrelevant
- relevance_score: 0.0-1.0

Rules:
- direct_company_signal: employee/insider discussing company's internal problems
- customer_signal: customer discussing their experience with the company
- market_signal: general industry discussion (not specific to this company)
- competitor_signal: comparing this company to competitors
- irrelevant: not relevant to the product

Return JSON array: [{{"index": 0, "signal_class": "...", "relevance_score": 0.0}}, ...]"""

    try:
        results = call_json(prompt, max_tokens=800)
        if isinstance(results, list):
            for item in results:
                idx = int(item.get("index", -1))
                if 0 <= idx < len(posts):
                    posts[idx].signal_class = item.get("signal_class", "irrelevant")
                    posts[idx].relevance_score = float(item.get("relevance_score", 0.0))
    except Exception as e:
        logger.warning("Post classification failed: %s", e)

    return posts
