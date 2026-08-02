"""Intent Agent — scores buying intent from research signals.

Intent scores are computed from research_scores + hiring counts in the
research JSON so identical inputs always produce identical scores.
"""

import time

from app.core.logger import logger
from app.services.agents import (
    PRODUCT_JOB_FIELD,
    load_research_data,
    pick,
    seed,
    validate_product,
)

OBJECTIONS = [
    "Pricing transparency for enterprise tiers",
    "Data residency and compliance requirements",
    "Migration effort from current stack",
    "Vendor lock-in concerns",
    "Security review timelines",
]

TIMELINES = ["0–3 months", "3–6 months", "6–12 months"]


class IntentService:
    AGENT = "Intent Agent"

    def run(self, product: str) -> dict:
        started = time.perf_counter()
        validate_product(product)
        logger.info(f"{self.AGENT} started — product={product}")

        research = load_research_data(product)
        job_field = PRODUCT_JOB_FIELD[product]
        company_results = []

        for company in research["companies"]:
            name = company["company_profile"]["company_name"]
            s = seed(name)
            li = company["linkedin_analysis"]
            scores = company["research_scores"]

            # Deterministic intent model traced to research fields
            hiring_signal = min(20, round(li.get(job_field, 0) / 5))          # product-relevant hiring
            growth_signal = min(10, li.get("employee_growth", 0))             # org momentum
            sentiment_signal = round(company["reddit_analysis"]["positive"] / 10)  # community sentiment
            base = round(scores["overall_confidence"] * 0.6)
            intent_score = min(98, base + hiring_signal + growth_signal + sentiment_signal - 10)

            urgency = "High" if intent_score >= 85 else "Medium" if intent_score >= 72 else "Low"
            buying_signals = [
                {"signal": finding, "strength": pick(["Very High", "High", "Medium"], name, finding), "source": "Research Agent"}
                for finding in company["key_findings"][:4]
            ]

            company_results.append({
                "company_name": name,
                "intent_score": intent_score,
                "buying_score": min(97, intent_score - 2 + s % 5),
                "urgency": urgency,
                "buying_signals": buying_signals,
                "competitor_mentions": [
                    {"competitor": comp, "context": f"Referenced in {name} community and market discussions"}
                    for comp in company["market_intelligence"]["competitors"]
                ],
                "objections": [pick(OBJECTIONS, name, "obj1"), pick(OBJECTIONS, name, "obj2")],
                "predicted_timeline": TIMELINES[0] if urgency == "High" else TIMELINES[1] if urgency == "Medium" else TIMELINES[2],
                "evidence": [
                    {"source": "LinkedIn", "fact": f"{li.get(job_field, 0)} product-relevant open roles"},
                    {"source": "Reddit", "fact": f"{company['reddit_analysis']['positive']}% positive sentiment across {company['reddit_analysis']['posts_analyzed']} posts"},
                ],
            })

        avg_intent = round(sum(c["intent_score"] for c in company_results) / len(company_results))
        high_intent = sum(1 for c in company_results if c["intent_score"] >= 85)

        execution_time = round(time.perf_counter() - started, 3)
        logger.info(f"{self.AGENT} completed — avg intent {avg_intent} ({execution_time}s)")
        return {
            "agent": self.AGENT,
            "status": "completed",
            "execution_time": execution_time,
            "confidence": 88,
            "result": {
                "product": product,
                "totals": {
                    "average_intent_score": avg_intent,
                    "high_intent_accounts": high_intent,
                    "buying_signals_detected": sum(len(c["buying_signals"]) for c in company_results),
                },
                "companies": company_results,
            },
        }
