"""Outreach Agent — 9-Step DAG Context-Driven Email Generation with Grok & Supabase."""

from __future__ import annotations

import re
import time
from typing import Any, Dict, List

from app.core.logger import logger
from app.services.agents import (
    load_company_emails,
    load_meeting_transcripts,
    load_research_data,
    validate_product,
)
from app.services.agents.intent_service import IntentService
from app.services.agents.stakeholder_service import StakeholderService
from app.services.agents.strategy_service import StrategyService
from app.services.grok_service import GrokService


class OutreachService:
    AGENT = "Outreach Agent"

    def run(self, product: str, campaign_id: str = "default-campaign") -> dict[str, Any]:
        started = time.perf_counter()
        validate_product(product)
        logger.info(f"{self.AGENT} started — product={product}, campaign_id={campaign_id}")

        # ── 1. Load Research Report ──────────────────────────────────────────
        research = load_research_data(product)
        organization = research.get("organization", "AccountPilot AI")

        # ── 2. Load Stakeholder Report ───────────────────────────────────────
        stakeholders_report = StakeholderService().run(product)["result"]
        stakeholders_by_company = {c["company_name"]: c for c in stakeholders_report["companies"]}

        # ── 3. Load Intent Report ────────────────────────────────────────────
        intent_report = IntentService().run(product)["result"]
        intent_by_company = {c["company_name"]: c for c in intent_report["companies"]}

        # ── 4. Load Strategy Report ──────────────────────────────────────────
        strategy_report = StrategyService().run(product)["result"]
        strategy_by_company = {c["company_name"]: c for c in strategy_report["companies"]}

        # ── 5. Load Company Emails ───────────────────────────────────────────
        all_emails = load_company_emails(product)

        # ── 6. Load Meeting Transcripts ──────────────────────────────────────
        all_transcripts = load_meeting_transcripts(product)

        company_results = []
        for company in research["companies"]:
            c_profile = company.get("company_profile", {})
            name = c_profile.get("company_name", "Unknown Account")
            slug = re.sub(r"[^a-z0-9]", "", name.lower())

            st = strategy_by_company.get(name, {})
            stakeholder_comp = stakeholders_by_company.get(name, {"stakeholders": []})
            intent_comp = intent_by_company.get(name, {})

            # Filter emails for this company
            c_emails = [
                em for em in all_emails
                if slug in em.get("email_id", "").lower()
                or slug in str(em.get("from_person_id", "")).lower()
                or slug in " ".join(em.get("to_person_ids", [])).lower()
            ]

            # Filter transcripts for this company
            c_transcripts = [
                tr for tr in all_transcripts
                if slug in str(tr.get("source_id", "")).lower()
                or slug in str(tr.get("account", {}).get("name", "")).lower()
                or slug in str(tr.get("account", {}).get("domain", "")).lower()
                or slug in str(tr.get("content", {}).get("title", "")).lower()
            ]

            # ── 7. Build Rich Context ────────────────────────────────────────
            context = GrokService.prepare_context(
                company_name=name,
                product=product,
                research_company=company,
                stakeholder_company=stakeholder_comp,
                intent_company=intent_comp,
                company_emails=c_emails,
                company_transcripts=c_transcripts,
                strategy_company=st,
                organization=organization,
            )

            # ── 8. Call Grok API & Generate Personalized Email ───────────────
            generated_email = GrokService.generate_email(
                context=context,
                tone="Executive & Concise",
            )

            # ── 9. Store Draft in Supabase email_drafts Table ────────────────
            stored_draft = GrokService.store_draft(
                campaign_id=campaign_id,
                context=context,
                generated=generated_email,
            )

            # Extract stakeholders
            committee = stakeholder_comp.get("stakeholders", [])
            champion = next((p for p in committee if p.get("type") == "champion"), committee[0] if committee else {"name": "Champion", "title": "VP Engineering"})
            decision_maker = next((p for p in committee if p.get("type") == "decision_maker"), committee[0] if committee else {"name": "Decision Maker", "title": "CTO"})

            focus = company.get("company_summary", {}).get("cloud_focus", [product])[0]
            primary_opp = company.get("business_opportunities", [f"Deploy {product}"])[0]
            finding = company.get("key_findings", [f"Investing in {focus}"])[0]

            company_results.append({
                "company_name": name,
                "draft_id": stored_draft.get("id"),
                "intent_score": context.get("intent_score", 85),
                "urgency": context.get("urgency", "High"),
                "purchase_window": context.get("purchase_window", "30-60 Days"),
                "executive_email": {
                    "draft_id": stored_draft.get("id"),
                    "to": f"{decision_maker.get('name')} · {decision_maker.get('title')}",
                    "recipient_email": stored_draft.get("recipient_email"),
                    "decision_maker": decision_maker.get("name"),
                    "decision_maker_title": decision_maker.get("title"),
                    "subject": stored_draft.get("subject"),
                    "body": stored_draft.get("body"),
                    "cta": stored_draft.get("cta"),
                    "confidence": stored_draft.get("confidence", 92),
                    "reason": stored_draft.get("reason"),
                    "status": stored_draft.get("status", "draft"),
                    "generated_by": stored_draft.get("generated_by", "Grok-2 / Outreach Agent"),
                    "created_at": stored_draft.get("created_at"),
                },
                "context_summary": {
                    "buying_signals": context.get("buying_signals", []),
                    "pain_points": context.get("pain_points", []),
                    "meeting_summary": stored_draft.get("metadata", {}).get("meeting_summary", ""),
                    "research_summary": stored_draft.get("metadata", {}).get("research_summary", ""),
                    "recent_meetings_count": len(c_transcripts),
                    "recent_emails_count": len(c_emails),
                },
                "linkedin_message": {
                    "to": f"{champion.get('name')} · {champion.get('title')}",
                    "body": (
                        f"Hi {champion.get('name', '').split()[0]} — saw {name}'s momentum around {focus}. "
                        f"We're helping similar teams ship {primary_opp} use cases in weeks, not quarters. "
                        f"Worth a quick chat?"
                    ),
                },
                "call_script": {
                    "opening": f"Reference {name}'s {focus} initiative and the signal: {finding}",
                    "discovery_questions": [
                        f"How is the team prioritizing {primary_opp} this quarter?",
                        f"What would block a {focus} rollout — {st.get('risks', ['governance requirements'])[0].lower()}?",
                    ],
                    "close": "Propose a scoped proof-of-value with success criteria.",
                },
                "next_best_action": st.get("next_actions", [f"Schedule an executive architectural briefing on {product}"])[0],
                "evidence": [
                    {"source": "Strategy Agent", "fact": st.get("recommended_pitch", "")},
                    {"source": "Research Agent", "fact": finding},
                    {"source": "Intent Agent", "fact": f"Intent Score {context.get('intent_score', 85)}/100 · {context.get('urgency', 'High')} Urgency"},
                    {"source": "Transcripts & Emails", "fact": f"Grounded in {len(c_transcripts)} discovery transcripts & {len(c_emails)} email threads"},
                ],
            })

        assets = len(company_results) * 3
        execution_time = round(time.perf_counter() - started, 3)
        logger.info(f"{self.AGENT} completed — {assets} assets ({execution_time}s)")

        return {
            "agent": self.AGENT,
            "status": "completed",
            "execution_time": execution_time,
            "confidence": 92,
            "result": {
                "product": product,
                "campaign_id": campaign_id,
                "totals": {
                    "emails_generated": len(company_results),
                    "drafts_stored": len(company_results),
                    "linkedin_messages": len(company_results),
                    "call_scripts": len(company_results),
                    "total_assets": assets,
                },
                "companies": company_results,
            },
        }
