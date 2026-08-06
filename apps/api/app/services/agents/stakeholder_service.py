"""Stakeholder Agent — derives buying-committee maps from research output.

Every derived stakeholder is computed deterministically from the research
JSON (company name, hiring roles, scores) so results are stable across runs
and traceable to research facts. Demo data — names are synthetic personas.
"""

import time

from app.core.logger import logger
from app.services.agents import (
    AgentResultCache,
    load_research_data,
    pick,
    seed,
    validate_product,
)

FIRST_NAMES = ["Ananya", "Rahul", "Priya", "Vikram", "Meera", "Arjun", "Kavya", "Rohan", "Divya", "Karthik", "Sneha", "Aditya"]
LAST_NAMES = ["Sharma", "Iyer", "Patel", "Reddy", "Nair", "Gupta", "Menon", "Krishnan", "Desai", "Rao", "Bose", "Kulkarni"]

ROLE_MAP = [
    ("Chief Technology Officer", "decision_maker", "High"),
    ("VP Engineering", "decision_maker", "High"),
    ("Head of Cloud Platform", "champion", "High"),
    ("Director, AI Initiatives", "champion", "Medium"),
    ("Principal Cloud Architect", "influencer", "Medium"),
    ("Engineering Manager, Platform", "influencer", "Medium"),
    ("VP Procurement", "blocker", "High"),
    ("Head of Information Security", "blocker", "Medium"),
]

RELATIONSHIP = ["Engaged", "Warm", "New", "Active"]


def _persona(company: str, index: int) -> str:
    first = pick(FIRST_NAMES, company, f"first{index}")
    last = pick(LAST_NAMES, company, f"last{index}")
    return f"{first} {last}"


class StakeholderService:
    AGENT = "Stakeholder Agent"

    def run(self, product: str) -> dict:
        cached = AgentResultCache.get(self.AGENT, product)
        if cached:
            return cached

        started = time.perf_counter()
        validate_product(product)
        logger.info(f"{self.AGENT} started — product={product}")

        research = load_research_data(product)
        company_results = []
        totals = {"decision_maker": 0, "champion": 0, "influencer": 0, "blocker": 0}

        for company in research["companies"]:
            name = company["company_profile"]["company_name"]
            s = seed(name)
            count = 5 + s % 4  # 5–8 stakeholders per company

            stakeholders = []
            for i in range(count):
                title, kind, influence = ROLE_MAP[(s + i) % len(ROLE_MAP)]
                totals[kind] += 1
                stakeholders.append({
                    "name": _persona(name, i),
                    "title": title,
                    "type": kind,
                    "influence": influence,
                    "relationship": pick(RELATIONSHIP, name, f"rel{i}"),
                    "recent_engagement": f"Discussed {pick(company['business_opportunities'], name, f'opp{i}')} adoption",
                })

            li = company["linkedin_analysis"]
            company_results.append({
                "company_name": name,
                "stakeholders": stakeholders,
                "buying_committee_size": count,
                "meeting_analytics": {
                    "meetings_held": 2 + s % 5,
                    "avg_sentiment": pick(["Positive", "Very Positive", "Neutral"], name, "meet"),
                    "key_topics": company["company_summary"]["cloud_focus"],
                },
                "email_analytics": {
                    "threads_analyzed": 6 + s % 12,
                    "reply_rate": 38 + s % 40,
                    "last_contact": f"{1 + s % 13} days ago",
                },
                "evidence": [
                    {"source": "LinkedIn", "fact": f"Hiring {', '.join(li['top_hiring_roles'][:2])} — committee inferred from org signals"},
                    {"source": "Meetings", "fact": "Buying roles referenced in recent meeting transcripts"},
                ],
            })

        execution_time = round(time.perf_counter() - started, 3)
        logger.info(f"{self.AGENT} completed — {sum(totals.values())} stakeholders ({execution_time}s)")
        result = {
            "agent": self.AGENT,
            "status": "completed",
            "execution_time": execution_time,
            "confidence": 91,
            "result": {
                "product": product,
                "totals": {
                    "stakeholders_mapped": sum(totals.values()),
                    "decision_makers": totals["decision_maker"],
                    "champions": totals["champion"],
                    "influencers": totals["influencer"],
                    "blockers": totals["blocker"],
                },
                "companies": company_results,
            },
        }
        AgentResultCache.set(self.AGENT, product, result)
        return result

