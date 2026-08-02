"""Outreach Agent — drafts personalized outreach from strategy output."""

import time

from app.core.logger import logger
from app.services.agents import load_research_data, validate_product
from app.services.agents.stakeholder_service import StakeholderService
from app.services.agents.strategy_service import StrategyService


class OutreachService:
    AGENT = "Outreach Agent"

    def run(self, product: str) -> dict:
        started = time.perf_counter()
        validate_product(product)
        logger.info(f"{self.AGENT} started — product={product}")

        research = load_research_data(product)
        organization = research["organization"]
        strategy = StrategyService().run(product)["result"]
        stakeholders = StakeholderService().run(product)["result"]
        strategy_by_company = {c["company_name"]: c for c in strategy["companies"]}
        stakeholders_by_company = {c["company_name"]: c for c in stakeholders["companies"]}

        company_results = []
        for company in research["companies"]:
            name = company["company_profile"]["company_name"]
            st = strategy_by_company[name]
            committee = stakeholders_by_company[name]["stakeholders"]
            champion = next((p for p in committee if p["type"] == "champion"), committee[0])
            decision_maker = next((p for p in committee if p["type"] == "decision_maker"), committee[0])
            focus = company["company_summary"]["cloud_focus"][0]
            primary_opp = company["business_opportunities"][0]
            finding = company["key_findings"][0]

            company_results.append({
                "company_name": name,
                "executive_email": {
                    "to": f"{decision_maker['name']} · {decision_maker['title']}",
                    "subject": f"{primary_opp} for {name}'s {focus} roadmap",
                    "body": (
                        f"Hi {decision_maker['name'].split()[0]},\n\n"
                        f"I noticed {name} is investing in {focus} — {finding.rstrip('.')}. "
                        f"Teams with a similar footprint have used {primary_opp} to accelerate that roadmap "
                        f"while keeping governance intact.\n\n{st['recommended_pitch']}.\n\n"
                        f"Open to a 20-minute conversation this week?\n\nBest,\n{organization} Account Team"
                    ),
                },
                "linkedin_message": {
                    "to": f"{champion['name']} · {champion['title']}",
                    "body": (
                        f"Hi {champion['name'].split()[0]} — saw {name}'s momentum around {focus}. "
                        f"We're helping similar teams ship {primary_opp} use cases in weeks, not quarters. "
                        f"Worth a quick chat?"
                    ),
                },
                "call_script": {
                    "opening": f"Reference {name}'s {focus} initiative and the signal: {finding}",
                    "discovery_questions": [
                        f"How is the team prioritizing {primary_opp} this quarter?",
                        f"What would block a {focus} rollout — {st['risks'][0].lower()}?",
                    ],
                    "close": "Propose a scoped proof-of-value with success criteria.",
                },
                "next_best_action": st["next_actions"][0],
                "evidence": [
                    {"source": "Strategy Agent", "fact": st["recommended_pitch"]},
                    {"source": "Research Agent", "fact": finding},
                ],
            })

        assets = len(company_results) * 3
        execution_time = round(time.perf_counter() - started, 3)
        logger.info(f"{self.AGENT} completed — {assets} assets ({execution_time}s)")
        return {
            "agent": self.AGENT,
            "status": "completed",
            "execution_time": execution_time,
            "confidence": 90,
            "result": {
                "product": product,
                "totals": {
                    "emails_generated": len(company_results),
                    "linkedin_messages": len(company_results),
                    "call_scripts": len(company_results),
                    "total_assets": assets,
                },
                "companies": company_results,
            },
        }
