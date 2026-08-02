"""Deterministic Intent Agent built from research and stakeholder outputs."""

from __future__ import annotations

import re
import time
from collections import Counter
from dataclasses import dataclass

from app.core.logger import logger
from app.repositories.intent_repository import IntentRepository
from app.services.agents import load_research_data, validate_product
from app.services.agents.stakeholder_service import StakeholderService

POSITIVE_SIGNAL_DEFINITIONS = (
    ("budget_approved", "Budget Approved", 35, (r"\bbudget approved\b", r"\bapproved budget\b")),
    ("poc_requested", "POC Requested", 20, (r"\bpoc\b", r"\bproof of concept\b", r"\bpilot\b")),
    ("demo_requested", "Demo Requested", 18, (r"\bdemo requested\b", r"\bschedule (a )?demo\b", r"\bdemo\b")),
    ("migration_planned", "Migration Planned", 15, (r"\bmigration\b", r"\bmodernization\b", r"\bmove to\b")),
    ("security_review", "Security Review", 10, (r"\bsecurity review\b", r"\bsecurity\b")),
    ("architecture_review", "Architecture Review", 10, (r"\barchitecture review\b", r"\barchitecture\b")),
    ("pricing_requested", "Pricing Requested", 10, (r"\bpricing\b", r"\bquote\b", r"\bcommercials\b")),
    ("executive_meeting", "Executive Meeting", 15, (r"\bexecutive\b", r"\bcto\b", r"\bcio\b", r"\bvp engineering\b")),
    ("technical_evaluation", "Technical Evaluation", 12, (r"\bevaluation\b", r"\btechnical evaluation\b")),
    ("procurement_discussion", "Procurement Discussion", 10, (r"\bprocurement\b", r"\bpurchasing\b")),
    ("timeline_mention", "Timeline Mention", 8, (r"\bthis quarter\b", r"\bq[1-4]\b", r"\b30 days\b", r"\b60 days\b", r"\b90 days\b")),
    ("vendor_comparison", "Vendor Comparison", 8, (r"\bcompare\b", r"\bcomparison\b", r"\bversus\b", r"\bvs\b")),
    ("cloud_expansion", "Cloud Expansion", 10, (r"\bcloud expansion\b", r"\bscale\b", r"\bexpansion\b")),
    ("hiring_azure_engineers", "Hiring Azure Engineers", 12, (r"\bazure engineer", r"\bazure architect", r"\baks\b")),
    ("hiring_aws_engineers", "Hiring AWS Engineers", 12, (r"\baws engineer", r"\beks\b", r"\blambda\b")),
    ("hiring_ai_engineers", "Hiring AI Engineers", 12, (r"\bai engineer", r"\bml engineer", r"\brag\b", r"\bmcp\b")),
)

NEGATIVE_SIGNAL_DEFINITIONS = (
    ("budget_freeze", "Budget Freeze", -25, (r"\bbudget freeze\b", r"\bfrozen budget\b")),
    ("migration_delayed", "Migration Delayed", -18, (r"\bdelay(ed)? migration\b", r"\bpostpone\b")),
    ("security_concern", "Security Concern", -12, (r"\bsecurity concern\b", r"\bsecurity blocker\b")),
    ("compliance_blocker", "Compliance Blocker", -15, (r"\bcompliance blocker\b", r"\bdata residency\b", r"\bregulatory\b")),
    ("negative_sentiment", "Negative Sentiment", -12, (r"\bnegative sentiment\b", r"\bconcern\b", r"\brisk\b")),
    ("competitor_selected", "Competitor Selected", -30, (r"\bselected competitor\b", r"\bchose aws\b", r"\bchose azure\b", r"\bchose claude\b")),
    ("project_cancelled", "Project Cancelled", -35, (r"\bproject cancelled\b", r"\bcancelled\b")),
    ("leadership_not_interested", "Leadership Not Interested", -20, (r"\bnot interested\b", r"\bno executive sponsor\b")),
)

KEYWORD_GROUPS = {
    "Azure AI": {
        "technology": {"Azure", "Azure OpenAI", "Azure AI", "AKS", "Microsoft Fabric", "Cloud Modernization", "Azure Security"},
        "competitors": {"AWS", "Amazon Bedrock", "Amazon EKS", "SageMaker", "Lambda", "Claude", "Claude Enterprise"},
    },
    "AWS Cloud": {
        "technology": {"AWS", "Amazon Bedrock", "Amazon EKS", "SageMaker", "Lambda", "Security Hub", "Cost Optimization"},
        "competitors": {"Azure", "Azure OpenAI", "Azure AI", "AKS", "Claude", "Claude Enterprise"},
    },
    "Claude Enterprise": {
        "technology": {"Claude", "Claude Enterprise", "Long Context", "Knowledge Assistant", "RAG", "MCP", "Document Intelligence", "AI Coding Assistant"},
        "competitors": {"Azure OpenAI", "Amazon Bedrock", "SageMaker", "Microsoft Fabric"},
    },
}


@dataclass(frozen=True)
class SignalMatch:
    signal: str
    weight: int
    source: str
    confidence: int
    evidence: str
    occurrences: int


def _normalize_whitespace(value: str) -> str:
    return re.sub(r"\s+", " ", value).strip()


def _extract_text_sections(company: dict, stakeholder_company: dict) -> dict[str, str]:
    profile = company["company_profile"]
    summary = company["company_summary"]
    website = company["website_analysis"]
    linkedin = company["linkedin_analysis"]
    reddit = company["reddit_analysis"]

    research_chunks = [
        profile["company_name"],
        summary["overview"],
        " ".join(summary["cloud_focus"]),
        " ".join(website["products"]),
        " ".join(website["services"]),
        " ".join(website["technology_stack"]),
        " ".join(website["recent_announcements"]),
        " ".join(company["key_findings"]),
        " ".join(company["business_opportunities"]),
        " ".join(item["fact"] for item in company.get("evidence", [])),
        " ".join(reddit["top_discussions"]),
        " ".join(reddit["community_feedback"]),
        " ".join(linkedin["top_hiring_roles"]),
        " ".join(linkedin["recent_posts"]),
    ]

    stakeholder_lines = []
    for stakeholder in stakeholder_company["stakeholders"]:
        stakeholder_lines.append(
            " ".join(
                [
                    stakeholder["title"],
                    stakeholder["type"],
                    stakeholder["influence"],
                    stakeholder["relationship"],
                    stakeholder["recent_engagement"],
                ]
            )
        )

    stakeholder_lines.extend(stakeholder_company["meeting_analytics"]["key_topics"])
    stakeholder_lines.extend(item["fact"] for item in stakeholder_company.get("evidence", []))

    meeting_summary = " ".join(
        [
            stakeholder_company["meeting_analytics"]["avg_sentiment"],
            " ".join(stakeholder_company["meeting_analytics"]["key_topics"]),
            f"{stakeholder_company['meeting_analytics']['meetings_held']} meetings held",
        ]
    )
    email_summary = " ".join(
        [
            f"{stakeholder_company['email_analytics']['threads_analyzed']} email threads",
            f"{stakeholder_company['email_analytics']['reply_rate']} percent reply rate",
            stakeholder_company["email_analytics"]["last_contact"],
        ]
    )

    return {
        "research": _normalize_whitespace(" ".join(research_chunks)),
        "stakeholder": _normalize_whitespace(" ".join(stakeholder_lines)),
        "meetings": _normalize_whitespace(meeting_summary),
        "emails": _normalize_whitespace(email_summary),
    }


def _find_signal_matches(
    text_sections: dict[str, str],
    definitions: tuple[tuple[str, str, int, tuple[str, ...]], ...],
) -> list[SignalMatch]:
    matches: list[SignalMatch] = []
    for _, label, weight, patterns in definitions:
        for source, text in text_sections.items():
            occurrences = sum(len(re.findall(pattern, text, flags=re.IGNORECASE)) for pattern in patterns)
            if not occurrences:
                continue
            confidence = min(95, 55 + occurrences * 10 + (8 if source in {"meetings", "emails"} else 0))
            matches.append(
                SignalMatch(
                    signal=label,
                    weight=weight,
                    source=source,
                    confidence=confidence,
                    evidence=f"{label} matched {occurrences} time(s) in {source}",
                    occurrences=occurrences,
                )
            )
    return matches


def _keyword_matches(product: str, text_sections: dict[str, str]) -> list[dict]:
    matches: list[dict] = []
    combined = " ".join(text_sections.values())
    groups = KEYWORD_GROUPS.get(product, KEYWORD_GROUPS["Azure AI"])
    for category, keywords in groups.items():
        for keyword in sorted(keywords):
            occurrences = len(re.findall(rf"\b{re.escape(keyword)}\b", combined, flags=re.IGNORECASE))
            if occurrences:
                matches.append(
                    {
                        "keyword": keyword,
                        "category": category,
                        "occurrences": occurrences,
                        "sources": [
                            source
                            for source, text in text_sections.items()
                            if re.search(rf"\b{re.escape(keyword)}\b", text, flags=re.IGNORECASE)
                        ],
                    }
                )
    return matches


def _stakeholder_importance(stakeholders: list[dict]) -> tuple[float, list[dict], int]:
    influence_map = {"High": 1.0, "Medium": 0.65, "Low": 0.35}
    type_map = {"decision_maker": 1.0, "champion": 0.85, "influencer": 0.55, "blocker": 0.25}
    scored = []
    executive_count = 0
    for stakeholder in stakeholders:
        title = stakeholder["title"]
        executive = bool(re.search(r"\b(chief|cto|cio|vp|head)\b", title, flags=re.IGNORECASE))
        executive_count += int(executive)
        score = 100 * influence_map[stakeholder["influence"]] * type_map[stakeholder["type"]]
        if executive:
            score += 8
        scored.append(
            {
                "name": stakeholder["name"],
                "title": title,
                "type": stakeholder["type"],
                "influence": stakeholder["influence"],
                "score": round(min(100, score)),
                "executive": executive,
            }
        )

    aggregate = round(sum(item["score"] for item in scored) / len(scored), 2) if scored else 0.0
    return aggregate, sorted(scored, key=lambda item: item["score"], reverse=True), executive_count


def _intent_level(score: int) -> str:
    if score <= 25:
        return "Very Low"
    if score <= 50:
        return "Low"
    if score <= 70:
        return "Medium"
    if score <= 85:
        return "High"
    return "Very High"


def _purchase_window(score: int) -> str:
    if score > 90:
        return "7-30 Days"
    if score > 80:
        return "30-60 Days"
    if score > 70:
        return "60-90 Days"
    if score > 50:
        return "3-6 Months"
    return "Unknown"


def _buying_stage(score: int, positive_count: int, negative_count: int) -> str:
    if score >= 86 and positive_count >= 4:
        return "Procurement"
    if score >= 71:
        return "Technical Evaluation"
    if score >= 51:
        return "Discovery"
    if negative_count >= positive_count and negative_count > 0:
        return "Blocked"
    return "Awareness"


def _priority(level: str) -> str:
    return {
        "Very High": "P1",
        "High": "P1",
        "Medium": "P2",
        "Low": "P3",
        "Very Low": "P3",
    }[level]


class IntentService:
    AGENT = "Intent Agent"

    def __init__(self, repository: IntentRepository | None = None) -> None:
        self.repository = repository or IntentRepository()

    def run(self, product: str, campaign_id: str | None = None) -> dict:
        started = time.perf_counter()
        validate_product(product)
        logger.info("%s started - product=%s campaign_id=%s", self.AGENT, product, campaign_id)

        research = load_research_data(product)
        stakeholder = StakeholderService().run(product)["result"]
        stakeholder_by_company = {company["company_name"]: company for company in stakeholder["companies"]}

        company_results = []
        score_totals = []
        confidence_totals = []
        purchase_probability_totals = []
        high_intent_companies = []
        purchase_windows = []
        all_signal_counter: Counter[str] = Counter()

        for company in research["companies"]:
            company_name = company["company_profile"]["company_name"]
            stakeholder_company = stakeholder_by_company[company_name]
            text_sections = _extract_text_sections(company, stakeholder_company)
            positive_matches = _find_signal_matches(text_sections, POSITIVE_SIGNAL_DEFINITIONS)
            negative_matches = _find_signal_matches(text_sections, NEGATIVE_SIGNAL_DEFINITIONS)
            matched_keywords = _keyword_matches(product, text_sections)
            stakeholder_score, executive_involvement, executive_count = _stakeholder_importance(
                stakeholder_company["stakeholders"]
            )

            research_confidence = company["research_scores"]["overall_confidence"]
            product_keywords = [match for match in matched_keywords if match["category"] == "technology"]
            technology_match = min(100, sum(min(15, match["occurrences"] * 6) for match in product_keywords))
            urgency = min(
                100,
                len(
                    [
                        match
                        for match in positive_matches
                        if match.signal in {"Timeline Mention", "Migration Planned", "POC Requested"}
                    ]
                )
                * 28
                + max(0, company["linkedin_analysis"]["employee_growth"]) * 3,
            )
            positive_sentiment = max(
                0,
                company["reddit_analysis"]["positive"]
                - company["reddit_analysis"]["negative"]
                + (
                    10
                    if stakeholder_company["meeting_analytics"]["avg_sentiment"] in {"Positive", "Very Positive"}
                    else 0
                ),
            )
            buying_signal_score = min(100, sum(min(40, match.weight + match.occurrences * 4) for match in positive_matches))
            negative_signal_score = min(100, sum(min(35, abs(match.weight) + match.occurrences * 4) for match in negative_matches))
            executive_score = min(100, executive_count * 35)

            weighted_total = (
                buying_signal_score * 0.35
                + stakeholder_score * 0.20
                + research_confidence * 0.15
                + technology_match * 0.10
                + executive_score * 0.10
                + urgency * 0.05
                + positive_sentiment * 0.05
            )
            intent_score = max(0, min(100, round(weighted_total - negative_signal_score * 0.22)))
            intent_level = _intent_level(intent_score)
            purchase_window = _purchase_window(intent_score)
            buying_stage = _buying_stage(intent_score, len(positive_matches), len(negative_matches))
            purchase_probability = max(0, min(100, round(intent_score * 0.92 + stakeholder_score * 0.08)))
            confidence = max(
                45,
                min(98, round((research_confidence + stakeholder_score + min(100, len(matched_keywords) * 8)) / 3)),
            )

            primary_positive = sorted(
                positive_matches,
                key=lambda match: (match.weight, match.confidence, match.occurrences),
                reverse=True,
            )
            primary_negative = sorted(
                negative_matches,
                key=lambda match: (abs(match.weight), match.confidence, match.occurrences),
                reverse=True,
            )

            signal_breakdown = {
                "buying_signals": round(buying_signal_score, 2),
                "stakeholder_importance": round(stakeholder_score, 2),
                "research_confidence": round(research_confidence, 2),
                "technology_match": round(technology_match, 2),
                "executive_participation": round(executive_score, 2),
                "urgency": round(urgency, 2),
                "positive_sentiment": round(positive_sentiment, 2),
                "negative_signals": round(negative_signal_score, 2),
            }

            explanation_items = []
            for match in primary_positive[:5]:
                explanation_items.append(f"+{match.weight} {match.signal} ({match.source})")
            for match in primary_negative[:3]:
                explanation_items.append(f"{match.weight} {match.signal} ({match.source})")

            recommendations = {
                "Very High": "Prioritize an executive meeting and move directly into commercial planning.",
                "High": "Run a technical workshop with the decision maker and champion this week.",
                "Medium": "Nurture the champion with a focused migration or ROI conversation.",
                "Low": "Continue qualification and watch for budget, executive, or timing signals.",
                "Very Low": "Keep the account in monitor mode until new intent evidence appears.",
            }

            company_result = {
                "company": company_name,
                "company_name": company_name,
                "product": product,
                "intent_score": intent_score,
                "intent_level": intent_level,
                "purchase_probability": purchase_probability,
                "buying_score": purchase_probability,
                "confidence": confidence,
                "buying_stage": buying_stage,
                "purchase_window": purchase_window,
                "positive_signals": [match.__dict__ for match in primary_positive],
                "negative_signals": [match.__dict__ for match in primary_negative],
                "signal_breakdown": signal_breakdown,
                "matched_keywords": matched_keywords,
                "executive_involvement": executive_involvement,
                "recommended_action": recommendations[intent_level],
                "recommended_priority": _priority(intent_level),
                "explanation": {
                    "summary": f"{company_name} scored {intent_score}/100 because of {', '.join(explanation_items[:4]) or 'limited intent evidence'}.",
                    "line_items": explanation_items,
                    "final_score": intent_score,
                },
                "urgency": "High" if intent_score >= 71 else "Medium" if intent_score >= 51 else "Low",
                "predicted_timeline": purchase_window,
                "objections": [match.signal for match in primary_negative[:3]] or ["No active blockers detected"],
                "evidence": company.get("evidence", []) + stakeholder_company.get("evidence", []),
            }

            company_results.append(company_result)
            score_totals.append(intent_score)
            confidence_totals.append(confidence)
            purchase_probability_totals.append(purchase_probability)
            if intent_score >= 71:
                high_intent_companies.append(company_name)
            if purchase_window != "Unknown":
                purchase_windows.append(purchase_window)
            for signal in primary_positive:
                all_signal_counter[signal.signal] += signal.occurrences

        company_results.sort(key=lambda item: item["intent_score"], reverse=True)

        average_intent = round(sum(score_totals) / len(score_totals)) if score_totals else 0
        average_purchase_probability = (
            round(sum(purchase_probability_totals) / len(purchase_probability_totals))
            if purchase_probability_totals
            else 0
        )
        average_confidence = round(sum(confidence_totals) / len(confidence_totals)) if confidence_totals else 0
        average_buying_window = purchase_windows[0] if purchase_windows else "Unknown"

        response_payload = {
            "company": "All Campaign Companies",
            "product": product,
            "campaign_id": campaign_id,
            "status": "completed",
            "execution_time": round(time.perf_counter() - started, 3),
            "companies": len(company_results),
            "average_intent": average_intent,
            "high_intent_companies": high_intent_companies,
            "intent_analysis": company_results,
            "totals": {
                "average_intent_score": average_intent,
                "high_intent_accounts": len(high_intent_companies),
                "average_purchase_probability": average_purchase_probability,
                "average_confidence": average_confidence,
                "expected_revenue_opportunity": round(sum(item["purchase_probability"] for item in company_results) * 1250, 2),
                "average_buying_window": average_buying_window,
                "signal_frequency": dict(all_signal_counter),
            },
            "companies_summary": [
                {
                    "company_name": item["company_name"],
                    "intent_score": item["intent_score"],
                    "purchase_probability": item["purchase_probability"],
                    "buying_stage": item["buying_stage"],
                    "recommended_priority": item["recommended_priority"],
                    "recommended_action": item["recommended_action"],
                    "urgency": item["urgency"],
                    "predicted_timeline": item["predicted_timeline"],
                    "positive_signals": item["positive_signals"],
                    "negative_signals": item["negative_signals"],
                    "matched_keywords": item["matched_keywords"],
                    "explanation": item["explanation"],
                    "executive_involvement": item["executive_involvement"],
                    "objections": item["objections"],
                    "evidence": item["evidence"],
                }
                for item in company_results
            ],
        }

        stored_result = self.repository.save(product=product, campaign_id=campaign_id, payload=response_payload)

        logger.info(
            "%s completed - avg intent=%s high_intent=%s stored=%s",
            self.AGENT,
            average_intent,
            len(high_intent_companies),
            stored_result["path"],
        )
        return {
            "agent": self.AGENT,
            "status": "completed",
            "execution_time": response_payload["execution_time"],
            "confidence": average_confidence,
            "result": {
                "product": product,
                "campaign_id": campaign_id,
                "totals": response_payload["totals"],
                "companies": response_payload["companies_summary"],
                "average_intent": average_intent,
                "high_intent_companies": high_intent_companies,
                "stored_result": stored_result,
            },
        }


