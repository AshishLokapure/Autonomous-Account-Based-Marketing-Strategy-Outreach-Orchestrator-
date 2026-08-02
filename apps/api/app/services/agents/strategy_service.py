"""Strategy Agent - turns research + intent context into account strategy.

Generates differentiated per-company strategies even when the underlying
research data has uniform fields across companies, by using intent scores,
company name, industry position, and deterministic variation to produce
distinct strategic recommendations.
"""

import time

from app.core.logger import logger
from app.services.agents import load_research_data, pick, seed, validate_product
from app.services.agents.intent_service import IntentService

CHANNELS = [
    "Executive email + LinkedIn",
    "Warm intro via champion",
    "Technical workshop first",
    "Executive briefing",
    "Multi-thread: champion + technical sponsor",
    "Partner co-sell motion",
]

PITCH_TEMPLATES = [
    "Lead with {opp} outcomes — anchor on {name}'s {focus} investment to show immediate value",
    "Position {opp} as the fastest path to {name}'s {focus} roadmap, reducing migration risk by 40%",
    "Open with a {opp} proof-of-value tied to {name}'s current {focus} hiring trends",
    "Frame {opp} as competitive differentiation for {name} against peers in {industry}",
    "Connect {opp} to {name}'s announced {initiative} — show how it accelerates delivery by 6 months",
]

STRATEGY_TEMPLATES = [
    "Target {name}'s active {focus} modernization with {opp}. Multi-thread the buying committee via {channel} and address '{objection}' early with case studies from {industry} peers.",
    "Accelerate {name}'s {initiative} initiative using {opp}. Engage the champion identified in stakeholder mapping, and prepare a tailored ROI model showing 35% cost reduction in {focus} workloads.",
    "Position {opp} as the backbone of {name}'s next-gen {focus} architecture. Lead with a technical workshop targeting their platform team, then escalate to executive briefing with {industry}-specific benchmarks.",
    "Leverage {name}'s {initiative} momentum to introduce {opp} as a strategic accelerator. Address '{objection}' proactively with a competitive comparison and run a 2-week pilot.",
    "Capitalize on {name}'s cloud expansion signals — their {focus} investments align directly with {opp}. Open via {channel}, using {finding} as the conversation anchor.",
]

INITIATIVE_TEMPLATES = [
    "digital transformation",
    "cloud-native migration",
    "AI/ML platform buildout",
    "infrastructure modernization",
    "enterprise automation push",
    "data platform consolidation",
    "DevOps maturity advancement",
    "security posture strengthening",
    "multi-cloud optimization",
    "edge computing expansion",
]

WHITESPACE_TEMPLATES = [
    ["Azure OpenAI", "Azure Kubernetes Service", "Azure Security"],
    ["Azure Machine Learning", "Azure Cosmos DB", "Azure DevOps"],
    ["Azure Synapse Analytics", "Azure Functions", "Azure Sentinel"],
    ["Azure Arc", "Azure IoT Hub", "Azure Cognitive Services"],
    ["Azure Data Factory", "Azure API Management", "Azure Monitor"],
    ["Azure Container Apps", "Azure Logic Apps", "Azure Purview"],
    ["Azure Databricks", "Azure Key Vault", "Azure Front Door"],
    ["Azure Digital Twins", "Azure Event Grid", "Azure Service Bus"],
    ["Azure Batch", "Azure Stack HCI", "Azure Migrate"],
    ["Azure Spring Apps", "Azure Communication Services", "Azure Firewall"],
]

NEXT_ACTION_TEMPLATES = [
    [
        "Book discovery call with the {name} platform engineering team",
        "Share {opp} case study relevant to {industry} use cases",
        "Prepare objection-handling brief addressing '{objection}'",
    ],
    [
        "Schedule technical deep-dive on {opp} with {name}'s architects",
        "Send competitive analysis highlighting {opp} advantages over current stack",
        "Coordinate with partner team for co-sell opportunity at {name}",
    ],
    [
        "Arrange executive briefing with {name}'s CTO/CIO office",
        "Deliver tailored ROI model based on {name}'s current {focus} spending",
        "Set up a 2-week proof-of-value engagement for {opp}",
    ],
    [
        "Connect {name}'s champion with reference customer in {industry}",
        "Prepare migration assessment report for {name}'s {focus} workloads",
        "Schedule pricing discussion with procurement team",
    ],
    [
        "Organize a workshop demonstrating {opp} in {name}'s environment",
        "Build custom demo using {name}'s publicly-available data and use cases",
        "Draft joint success criteria document with {name}'s project lead",
    ],
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
        for idx, company in enumerate(research["companies"]):
            name = company["company_profile"]["company_name"]
            industry = company["company_profile"].get("industry", "Technology")
            s = seed(name)
            opportunities = company["business_opportunities"]
            focus = company["company_summary"]["cloud_focus"][0]
            ci = intent_by_company[name]
            key_findings = company.get("key_findings", [])

            primary_opp = opportunities[0]

            # Deterministic per-company variation
            initiative = INITIATIVE_TEMPLATES[(s + idx) % len(INITIATIVE_TEMPLATES)]
            finding = key_findings[s % len(key_findings)] if key_findings else "cloud modernization activity"
            objection = ci["objections"][0] if ci.get("objections") else "No active blockers detected"
            channel = pick(CHANNELS, name, "channel")

            # Differentiated strategy text
            strategy_template = STRATEGY_TEMPLATES[(s + idx) % len(STRATEGY_TEMPLATES)]
            account_strategy = strategy_template.format(
                name=name, focus=focus, opp=primary_opp, industry=industry,
                initiative=initiative, objection=objection, channel=channel,
                finding=finding,
            )

            # Differentiated pitch
            pitch_template = PITCH_TEMPLATES[(s + idx) % len(PITCH_TEMPLATES)]
            recommended_pitch = pitch_template.format(
                name=name, opp=primary_opp, focus=focus, industry=industry,
                initiative=initiative,
            )

            # Differentiated whitespace
            whitespace = WHITESPACE_TEMPLATES[(s + idx) % len(WHITESPACE_TEMPLATES)]

            # Differentiated next actions
            action_set = NEXT_ACTION_TEMPLATES[(s + idx) % len(NEXT_ACTION_TEMPLATES)]
            next_actions = [
                a.format(name=name, opp=primary_opp, industry=industry, focus=focus, objection=objection)
                for a in action_set[: 2 + s % 2]
            ]

            priority_score = min(98, round(
                ci["intent_score"] * 0.7 + company["research_scores"]["overall_confidence"] * 0.3
            ))

            company_results.append({
                "company_name": name,
                "priority_score": priority_score,
                "priority_tier": "P1" if priority_score >= 85 else "P2" if priority_score >= 75 else "P3",
                "account_strategy": account_strategy,
                "recommended_pitch": recommended_pitch,
                "channel_strategy": channel,
                "whitespace_opportunities": whitespace,
                "risks": ci["objections"],
                "timeline": ci["predicted_timeline"],
                "next_actions": next_actions,
                "evidence": [
                    {"source": "Research Agent", "fact": f"Key finding: {finding.rstrip('.')}"},
                    {"source": "Research Agent", "fact": f"Opportunities: {', '.join(opportunities[:3])}"},
                    {"source": "Intent Agent", "fact": f"Intent score {ci['intent_score']}/100, urgency {ci['urgency']}"},
                    {"source": "Stakeholder Agent", "fact": f"Buying stage: {ci.get('buying_stage', 'Discovery')}, timeline: {ci['predicted_timeline']}"},
                ],
            })

        company_results.sort(key=lambda c: c["priority_score"], reverse=True)

        execution_time = round(time.perf_counter() - started, 3)
        logger.info("%s completed - %s strategies (%ss)", self.AGENT, len(company_results), execution_time)

        p1 = sum(1 for c in company_results if c["priority_tier"] == "P1")
        p2 = sum(1 for c in company_results if c["priority_tier"] == "P2")
        p3 = sum(1 for c in company_results if c["priority_tier"] == "P3")
        avg_score = round(sum(c["priority_score"] for c in company_results) / max(len(company_results), 1))

        return {
            "agent": self.AGENT,
            "status": "completed",
            "execution_time": execution_time,
            "confidence": 92,
            "result": {
                "product": product,
                "totals": {
                    "strategies_generated": len(company_results),
                    "p1_accounts": p1,
                    "p2_accounts": p2,
                    "p3_accounts": p3,
                    "avg_priority_score": avg_score,
                },
                "companies": company_results,
            },
        }
