"""Strategy Agent - turns research + intent context into account strategy."""

import time

from app.core.logger import logger
from app.services.agents import load_research_data, pick, seed, validate_product
from app.services.agents.intent_service import IntentService

CHANNELS = ["Executive email + LinkedIn", "Warm intro via champion", "Technical workshop first", "Executive briefing"]

PITCH_TEMPLATES = [
    "Lead with {opp} outcomes - anchor on their announced {focus} initiatives",
    "Position {opp} as the fastest path to their {focus} roadmap",
    "Open with a {opp} proof-of-value tied to current {focus} hiring",
]


class StrategyService:
    AGENT = "Strategy Agent"

    def run(self, product: str) -> dict:
        started = time.perf_counter()
        validate_product(product)
        logger.info("%s started - product=%s", self.AGENT, product)

        research = load_research_data(product)
        intent = IntentService().run(product)["result"]
        intent_by_company = {c["company_name"]: c for c in intent["companies"]}

        company_results = []
        for company in research["companies"]:
            name = company["company_profile"]["company_name"]
            s = seed(name)
            opportunities = company["business_opportunities"]
            focus = company["company_summary"]["cloud_focus"][0]
            ci = intent_by_company[name]

            primary_opp = opportunities[0]
            template = pick(PITCH_TEMPLATES, name, "pitch")
            priority_score = min(98, round(ci["intent_score"] * 0.7 + company["research_scores"]["overall_confidence"] * 0.3))

            company_results.append({
                "company_name": name,
                "priority_score": priority_score,
                "priority_tier": "P1" if priority_score >= 85 else "P2" if priority_score >= 75 else "P3",
                "account_strategy": (
                    f"Target {name}'s active {focus} modernization with {primary_opp}. "
                    f"Multi-thread the buying committee and address '{ci['objections'][0]}' early."
                ),
                "recommended_pitch": template.format(opp=primary_opp, focus=focus),
                "channel_strategy": pick(CHANNELS, name, "channel"),
                "whitespace_opportunities": opportunities[1:4],
                "risks": ci["objections"],
                "timeline": ci["predicted_timeline"],
                "next_actions": [
                    f"Book discovery call with the {name} platform team",
                    f"Share {primary_opp} case study relevant to {company['company_profile']['industry']}",
                    "Prepare objection-handling brief for procurement",
                ][: 2 + s % 2],
                "evidence": [
                    {"source": "Research Agent", "fact": f"Business opportunities: {', '.join(opportunities[:3])}"},
                    {"source": "Intent Agent", "fact": f"Intent score {ci['intent_score']}/100, urgency {ci['urgency']}"},
                ],
            })

        company_results.sort(key=lambda c: c["priority_score"], reverse=True)

        execution_time = round(time.perf_counter() - started, 3)
        logger.info("%s completed - %s strategies (%ss)", self.AGENT, len(company_results), execution_time)
        return {
            "agent": self.AGENT,
            "status": "completed",
            "execution_time": execution_time,
            "confidence": 92,
            "result": {
                "product": product,
                "totals": {
                    "strategies_generated": len(company_results),
                    "p1_accounts": sum(1 for c in company_results if c["priority_tier"] == "P1"),
                },
                "companies": company_results,
            },
        }

