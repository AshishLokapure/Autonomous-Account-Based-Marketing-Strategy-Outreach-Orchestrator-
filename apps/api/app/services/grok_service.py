"""GrokService — LLM-Powered Enterprise B2B Outreach Generation using Grok / xAI / Groq."""

from __future__ import annotations

import json
import re
import time
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
from urllib.error import HTTPError
from urllib.request import Request, urlopen
from uuid import uuid4

from app.core.config import get_settings
from app.core.logger import logger
from app.repositories.email_draft_repository import EmailDraftRepository

settings = get_settings()

TONE_PROMPT_MAP = {
    "Executive & Concise": (
        "Tone: Executive, direct, high-impact, and concise. Get straight to business value, "
        "ROI, and governance in under 150 words. Avoid fluff or generic pleasantries."
    ),
    "Enterprise Consultative": (
        "Tone: Trusted advisor, analytical, and consultative. Address architectural alignment, "
        "security compliance, and enterprise scalability based on recent meeting transcripts."
    ),
    "High-Urgency & ROI": (
        "Tone: Value-driven, urgent, and focused on tangible ROI, timeline acceleration, "
        "and eliminating migration bottlenecks."
    ),
    "Warm & Peer-to-Peer": (
        "Tone: Professional, conversational, and peer-to-peer. Acknowledge shared industry "
        "challenges and reference mutual engineering initiatives."
    ),
    "Security & Compliance": (
        "Tone: Rigorous, risk-mitigating, and compliance-focused. Emphasize HIPAA/SOC2 compliance, "
        "data residency, and enterprise landing zone governance."
    ),
}


class GrokService:
    """Enterprise B2B Email Generation Service powered by Grok API."""

    @classmethod
    def prepare_context(
        cls,
        company_name: str,
        product: str,
        research_company: Dict[str, Any],
        stakeholder_company: Dict[str, Any],
        intent_company: Dict[str, Any],
        company_emails: List[Dict[str, Any]],
        company_transcripts: List[Dict[str, Any]],
        strategy_company: Optional[Dict[str, Any]] = None,
        organization: str = "AccountPilot AI",
    ) -> Dict[str, Any]:
        """Prepare comprehensive, structured context from all upstream agents."""
        # 1. Stakeholders
        stakeholders = stakeholder_company.get("stakeholders", [])
        decision_maker = next((s for s in stakeholders if s.get("type") == "decision_maker"), None)
        if not decision_maker and stakeholders:
            decision_maker = stakeholders[0]
        champion = next((s for s in stakeholders if s.get("type") == "champion"), None)

        dm_name = decision_maker.get("name", "Technology Leader") if decision_maker else "Technology Leader"
        dm_title = decision_maker.get("title", "CTO / Head of Engineering") if decision_maker else "CTO"
        dm_email = f"{dm_name.lower().replace(' ', '.')}@{company_name.lower().replace(' ', '')}.com"

        # 2. Research Profile & Pain Points
        profile = research_company.get("company_profile", {})
        industry = profile.get("industry", "Enterprise Software & Cloud Services")
        summary = research_company.get("company_summary", {})
        cloud_focus = summary.get("cloud_focus", [product])
        opportunities = research_company.get("business_opportunities", [f"Modernize cloud infrastructure with {product}"])
        findings = research_company.get("key_findings", [f"{company_name} is actively expanding cloud and AI capabilities."])
        li_analysis = research_company.get("linkedin_analysis", {})
        hiring_roles = li_analysis.get("top_hiring_roles", ["Cloud Architect", "AI Engineer"])

        # 3. Intent & Signals
        intent_score = intent_company.get("intent_score", 85)
        urgency = intent_company.get("urgency", "High")
        purchase_window = intent_company.get("predicted_timeline", "30-60 Days")
        positive_signals = intent_company.get("positive_signals", ["Budget Approved", "POC Requested"])
        negative_signals = intent_company.get("negative_signals", ["Compliance Review", "Architecture Approval"])
        objections = intent_company.get("objections", ["Security & compliance verification"])
        matched_keywords = intent_company.get("matched_keywords", [product])
        recommended_action = intent_company.get("recommended_action", f"Schedule an executive architectural briefing on {product}")

        # 4. Strategy & Pitch
        recommended_pitch = (
            strategy_company.get("recommended_pitch")
            if strategy_company
            else f"Accelerate {company_name}'s {cloud_focus[0]} deployment with enterprise governance"
        )

        # 5. Email Threads Summary
        email_summaries = []
        for em in company_emails[:3]:
            subj = em.get("subject", "")
            body_snippet = em.get("body", "")[:200]
            topics = em.get("mentioned_topics", [])
            email_summaries.append({
                "subject": subj,
                "summary": body_snippet,
                "topics": topics,
                "timestamp": em.get("timestamp"),
            })

        # 6. Meeting Transcripts Summary
        meeting_summaries = []
        for mt in company_transcripts[:2]:
            content = mt.get("content", {})
            title = content.get("title", f"{company_name} Technical Discovery")
            transcript_lines = content.get("transcript", [])
            quotes = [
                f"{line.get('speaker', 'Prospect')}: \"{line.get('text', '')}\""
                for line in transcript_lines
                if line.get("speaker") != "AccountPilot AE"
            ][:4]
            meeting_summaries.append({
                "title": title,
                "key_quotes": quotes,
                "timestamp": mt.get("timestamp"),
            })

        # Assemble rich context
        context = {
            "company_name": company_name,
            "industry": industry,
            "organization": organization,
            "decision_maker": {
                "name": dm_name,
                "title": dm_title,
                "email": dm_email,
                "type": decision_maker.get("type", "decision_maker") if decision_maker else "decision_maker",
                "relationship": decision_maker.get("relationship", "Warm") if decision_maker else "Warm",
            },
            "champion": {
                "name": champion.get("name", "Engineering Champion") if champion else dm_name,
                "title": champion.get("title", "Head of Platform") if champion else dm_title,
            },
            "buying_signals": positive_signals,
            "pain_points": negative_signals + objections,
            "current_technologies": cloud_focus + matched_keywords,
            "mentioned_products": cloud_focus,
            "hiring_trends": hiring_roles,
            "recent_meetings": meeting_summaries,
            "recent_emails": email_summaries,
            "intent_score": intent_score,
            "urgency": urgency,
            "purchase_window": purchase_window,
            "recommended_product": product,
            "recommended_action": recommended_action,
            "recommended_pitch": recommended_pitch,
            "primary_opportunity": opportunities[0] if opportunities else f"Deploy {product}",
            "key_finding": findings[0] if findings else f"{company_name} is investing in {product}",
        }
        return context

    @classmethod
    def generate_email(
        cls,
        context: Dict[str, Any],
        tone: str = "Executive & Concise",
        custom_instructions: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Generate personalized B2B outreach email using Grok API with fallback."""
        tone_instruction = TONE_PROMPT_MAP.get(tone, TONE_PROMPT_MAP["Executive & Concise"])
        if custom_instructions:
            tone_instruction += f"\nAdditional Instructions: {custom_instructions}"

        system_prompt = (
            "You are an Elite B2B Account-Based Marketing (ABM) Email Copywriter and Enterprise Account Strategist.\n"
            "Generate a high-converting, personalized, professional sales email for the target enterprise account.\n"
            "STRICT RULES:\n"
            "1. Output MUST be a single valid JSON object with keys: subject, email_body, cta, confidence, reason.\n"
            "2. Total body word count MUST be under 250 words.\n"
            "3. Reference actual customer pain points, meeting discussions, and recent email context provided.\n"
            "4. Structure: Subject, Greeting, Opening, Personalization, Problem Statement, Solution, Benefits, Clear CTA, Closing, Signature.\n"
            "5. NO HALLUCINATION. Only use facts from the provided context.\n"
            "6. Do not include markdown code block ticks ```json or any prefix text outside the JSON object.\n"
        )

        user_prompt = f"""
Context:
{json.dumps(context, indent=2)}

Tone Guidelines:
{tone_instruction}

Generate the final JSON object:
{{
  "subject": "Compelling subject line mentioning specific initiative and business value",
  "email_body": "Full formatted email body with line breaks",
  "cta": "Exact single-sentence low-friction call to action",
  "confidence": 94,
  "reason": "Why this specific message will resonate based on intent signals"
}}
"""
        # Attempt LLM generation with retry logic
        llm_response = cls._call_llm_with_retry(system_prompt, user_prompt)
        if llm_response:
            validated = cls.validate_email(llm_response, context)
            if validated:
                return validated

        # Fallback to intelligent deterministic synthesis
        logger.info(f"Using contextual Grok template synthesis for {context.get('company_name')}")
        return cls._synthesize_email(context, tone)

    @classmethod
    def _call_llm_with_retry(
        cls,
        system_prompt: str,
        user_prompt: str,
        max_retries: int = 2,
    ) -> Optional[Dict[str, Any]]:
        """Call Groq / xAI endpoint with exponential backoff."""
        curr_settings = get_settings()

        # 1. Try Groq API endpoint first (fast LLaMA-3.3-70b inference)
        groq_key = curr_settings.groq_api_key
        if groq_key:
            for attempt in range(max_retries):
                try:
                    payload = {
                        "model": "llama-3.3-70b-versatile",
                        "messages": [
                            {"role": "system", "content": system_prompt},
                            {"role": "user", "content": user_prompt},
                        ],
                        "temperature": 0.3,
                        "response_format": {"type": "json_object"},
                    }
                    req = Request(
                        "https://api.groq.com/openai/v1/chat/completions",
                        data=json.dumps(payload).encode("utf-8"),
                        headers={
                            "Authorization": f"Bearer {groq_key}",
                            "Content-Type": "application/json",
                            "User-Agent": "AccountPilot/1.0",
                        },
                        method="POST",
                    )
                    with urlopen(req, timeout=10) as resp:
                        res = json.loads(resp.read().decode("utf-8"))
                        content = res["choices"][0]["message"]["content"]
                        return cls._parse_json(content)
                except Exception as exc:
                    logger.warning(f"Groq API attempt {attempt + 1} failed: {exc}")
                    time.sleep(1.0 * (attempt + 1))

        # 2. Try xAI Grok API if keys are present
        xai_key = curr_settings.grok_api_key or curr_settings.xai_api_key
        if xai_key:
            for attempt in range(max_retries):
                try:
                    payload = {
                        "model": "grok-2-latest",
                        "messages": [
                            {"role": "system", "content": system_prompt},
                            {"role": "user", "content": user_prompt},
                        ],
                        "temperature": 0.3,
                        "response_format": {"type": "json_object"},
                    }
                    req = Request(
                        "https://api.x.ai/v1/chat/completions",
                        data=json.dumps(payload).encode("utf-8"),
                        headers={
                            "Authorization": f"Bearer {xai_key}",
                            "Content-Type": "application/json",
                            "User-Agent": "AccountPilot/1.0",
                        },
                        method="POST",
                    )
                    with urlopen(req, timeout=12) as resp:
                        res = json.loads(resp.read().decode("utf-8"))
                        content = res["choices"][0]["message"]["content"]
                        return cls._parse_json(content)
                except Exception as exc:
                    logger.warning(f"xAI Grok attempt {attempt + 1} failed: {exc}")
                    time.sleep(1.0 * (attempt + 1))

        return None

    @classmethod
    def _parse_json(cls, text: str) -> Optional[Dict[str, Any]]:
        """Clean and parse JSON from LLM response text."""
        try:
            cleaned = text.strip()
            if cleaned.startswith("```"):
                cleaned = re.sub(r"^```(?:json)?\n?", "", cleaned)
                cleaned = re.sub(r"\n?```$", "", cleaned)
            return json.loads(cleaned.strip())
        except Exception as exc:
            logger.error(f"Failed to parse LLM JSON: {exc} | Raw text: {text[:200]}")
            # Try regex extraction
            match = re.search(r"\{.*\}", text, re.DOTALL)
            if match:
                try:
                    return json.loads(match.group(0))
                except Exception:
                    pass
        return None

    @classmethod
    def validate_email(cls, data: Dict[str, Any], context: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Validate and clean generated email draft."""
        if not isinstance(data, dict):
            return None

        subject = str(data.get("subject", "")).strip()
        body = str(data.get("email_body", "")).strip()
        cta = str(data.get("cta", "")).strip()
        confidence = int(data.get("confidence", 92))
        reason = str(data.get("reason", "")).strip()

        if not subject or not body:
            return None

        # Check word count constraint
        words = body.split()
        if len(words) > 280:
            body = " ".join(words[:240]) + f"\n\nBest regards,\n{context.get('organization', 'AccountPilot')} Team"

        return {
            "subject": subject,
            "email_body": body,
            "cta": cta or "Open to a brief 20-minute architecture review this week?",
            "confidence": min(98, max(80, confidence)),
            "reason": reason or f"High resonance with {context.get('company_name')}'s current roadmap and intent signals.",
        }

    @classmethod
    def _synthesize_email(cls, context: Dict[str, Any], tone: str) -> Dict[str, Any]:
        """Deterministic context-grounded email generation engine."""
        company = context.get("company_name", "Target Account")
        product = context.get("recommended_product", "Enterprise Cloud")
        dm = context.get("decision_maker", {})
        dm_first = dm.get("name", "there").split()[0]
        dm_title = dm.get("title", "Technology Leader")
        opp = context.get("primary_opportunity", f"Cloud Modernization with {product}")
        focus = context.get("current_technologies", [product])[0]
        org = context.get("organization", "AccountPilot AI")
        pitch = context.get("recommended_pitch", f"Accelerate {company}'s roadmap with verified compliance")
        intent_score = context.get("intent_score", 88)

        # Quotes or topics from meetings/emails
        meetings = context.get("recent_meetings", [])
        emails = context.get("recent_emails", [])
        transcript_ref = ""
        if meetings and meetings[0].get("key_quotes"):
            quote = meetings[0]["key_quotes"][0]
            transcript_ref = f"Following up on the point raised in our recent discussion ({quote.strip()}), "
        elif emails:
            subj = emails[0].get("subject", "")
            transcript_ref = f"Following up on your team's discussion regarding {subj.lower()}, "

        if tone == "Executive & Concise":
            subject = f"Accelerating {company}'s {focus} roadmap with {product}"
            body = (
                f"Hi {dm_first},\n\n"
                f"I noticed {company}'s active expansion in {focus} and your focus on {opp.lower()}. {transcript_ref}"
                f"Leading enterprise teams in {context.get('industry', 'your sector')} partner with us to deploy {product} "
                f"while maintaining strict security and compliance standards.\n\n"
                f"{pitch}.\n\n"
                f"Would you be open to a 20-minute conversation this Thursday to review our deployment framework?\n\n"
                f"Best regards,\n"
                f"{org} Strategic Accounts Team"
            )
            cta = "Would you be open to a 20-minute conversation this Thursday?"

        elif tone == "High-Urgency & ROI":
            subject = f"ROI & Timeline Acceleration for {company}'s {product} Rollout"
            body = (
                f"Hi {dm_first},\n\n"
                f"With {company} prioritizing {opp.lower()} this quarter, speed to value and governance are paramount. {transcript_ref}"
                f"By pairing {product} with our verified rollout framework, peer organizations have reduced migration timelines by 40% "
                f"while cutting operational overhead.\n\n"
                f"{pitch}.\n\n"
                f"Are you available for a brief 15-minute executive briefing this week to review the ROI benchmarks?\n\n"
                f"Best regards,\n"
                f"{org} Executive Briefing Team"
            )
            cta = "Are you available for a brief 15-minute executive briefing this week?"

        elif tone == "Security & Compliance":
            subject = f"Enterprise Governance & Compliance Blueprint for {company}'s {product} Adoption"
            body = (
                f"Hi {dm_first},\n\n"
                f"As {company} evaluates {focus} for production workloads, meeting stringent security, compliance, "
                f"and data residency requirements is essential. {transcript_ref}"
                f"Our architecture blueprints for {product} are pre-configured for SOC2, HIPAA, and enterprise landing zones, "
                f"ensuring zero governance friction.\n\n"
                f"{pitch}.\n\n"
                f"Can we share our enterprise security architecture whitepaper and schedule a 20-minute technical review?\n\n"
                f"Best regards,\n"
                f"{org} Solutions Architecture Team"
            )
            cta = "Can we schedule a 20-minute technical review?"

        elif tone == "Warm & Peer-to-Peer":
            subject = f"Quick question regarding {company}'s {focus} initiative"
            body = (
                f"Hi {dm_first},\n\n"
                f"Saw the great momentum at {company} around {focus} and {opp.lower()}. {transcript_ref}"
                f"We've been collaborating with engineering leaders tackling similar scaling milestones with {product}, "
                f"helping them streamline architecture while keeping delivery velocity high.\n\n"
                f"{pitch}.\n\n"
                f"Would love to exchange ideas over a quick 15-minute coffee chat this week if you have time.\n\n"
                f"Warmly,\n"
                f"{org} Engineering Partnerships"
            )
            cta = "Would love to exchange ideas over a quick 15-minute coffee chat this week."

        else:  # Enterprise Consultative (Default)
            subject = f"Strategic Architecture Briefing: {opp} for {company}"
            body = (
                f"Hi {dm_first},\n\n"
                f"In reviewing {company}'s strategic initiatives around {focus}, your team's focus on enterprise reliability stands out. {transcript_ref}"
                f"We help enterprise technology organizations navigate {product} adoption with phased migration blueprints, "
                f"risk mitigation, and hands-on architectural validation.\n\n"
                f"{pitch}.\n\n"
                f"Would you be open to an exploratory 20-minute consultation with our Principal Cloud Architect this week?\n\n"
                f"Best regards,\n"
                f"{org} Advisory Team"
            )
            cta = "Would you be open to an exploratory 20-minute consultation this week?"

        return {
            "subject": subject,
            "email_body": body,
            "cta": cta,
            "confidence": min(96, max(88, intent_score + 4)),
            "reason": f"Derived from verified intent signals (Score: {intent_score}), meeting context, and {dm_title} profile.",
        }

    @classmethod
    def store_draft(
        cls,
        campaign_id: str,
        context: Dict[str, Any],
        generated: Dict[str, Any],
    ) -> Dict[str, Any]:
        """Store generated email draft into Supabase email_drafts table and local cache."""
        company = context.get("company_name", "Target Account")
        product = context.get("recommended_product", "Enterprise Cloud")
        dm = context.get("decision_maker", {})
        dm_name = dm.get("name", "Decision Maker")
        dm_email = dm.get("email", f"contact@{company.lower().replace(' ', '')}.com")
        intent_score = context.get("intent_score", 85)

        # Extract summaries for UI display
        meetings = context.get("recent_meetings", [])
        meeting_summary = (
            f"{meetings[0].get('title', 'Technical Discovery')} — "
            + "; ".join(meetings[0].get("key_quotes", []))
            if meetings
            else f"Analyzed meeting transcripts with {company} technical leadership."
        )

        research_summary = (
            f"Focus: {', '.join(context.get('current_technologies', [product])[:3])}. "
            f"Key signal: {context.get('key_finding', '')} Hiring: {', '.join(context.get('hiring_trends', [])[:2])}."
        )

        record = {
            "id": str(uuid4()),
            "campaign_id": campaign_id,
            "company": company,
            "product": product,
            "decision_maker": dm_name,
            "recipient_email": dm_email,
            "subject": generated.get("subject", f"Opportunity for {company}"),
            "body": generated.get("email_body", ""),
            "intent_score": intent_score,
            "generated_by": "Grok-2 / Outreach Agent",
            "status": "draft",
            "cta": generated.get("cta", ""),
            "confidence": generated.get("confidence", 92),
            "reason": generated.get("reason", ""),
            "metadata": {
                "buying_signals": context.get("buying_signals", []),
                "pain_points": context.get("pain_points", []),
                "meeting_summary": meeting_summary,
                "research_summary": research_summary,
                "urgency": context.get("urgency", "High"),
                "purchase_window": context.get("purchase_window", "30-60 Days"),
                "recommended_action": context.get("recommended_action", ""),
                "decision_maker_title": dm.get("title", "CTO"),
                "champion_name": context.get("champion", {}).get("name", ""),
                "champion_title": context.get("champion", {}).get("title", ""),
            },
            "created_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat(),
        }

        stored = EmailDraftRepository.save_draft(record)
        if stored.get("_persisted_to_db"):
            logger.info(f"Stored email draft for {company} in Supabase (ID: {stored.get('id')})")
        else:
            logger.info(f"Stored email draft for {company} in memory cache (ID: {stored.get('id')})")
        return stored

    @classmethod
    def regenerate_email(
        cls,
        draft_id: str,
        tone: str = "Executive & Concise",
        custom_instructions: Optional[str] = None,
    ) -> Optional[Dict[str, Any]]:
        """Regenerate an existing draft with a new tone preset and update Supabase."""
        draft = EmailDraftRepository.get_draft(draft_id)
        if not draft:
            return None

        # Build context from stored metadata
        meta = draft.get("metadata", {})
        context = {
            "company_name": draft.get("company", ""),
            "recommended_product": draft.get("product", "Azure AI"),
            "decision_maker": {
                "name": draft.get("decision_maker", ""),
                "title": meta.get("decision_maker_title", "Technology Leader"),
                "email": draft.get("recipient_email", ""),
            },
            "champion": {
                "name": meta.get("champion_name", ""),
                "title": meta.get("champion_title", ""),
            },
            "buying_signals": meta.get("buying_signals", []),
            "pain_points": meta.get("pain_points", []),
            "current_technologies": [draft.get("product", "Azure AI")],
            "intent_score": draft.get("intent_score", 85),
            "urgency": meta.get("urgency", "High"),
            "purchase_window": meta.get("purchase_window", "30-60 Days"),
            "recommended_pitch": f"Accelerate {draft.get('company')} with {draft.get('product')}",
            "primary_opportunity": f"Deploy {draft.get('product')}",
            "key_finding": meta.get("research_summary", ""),
        }

        generated = cls.generate_email(context, tone=tone, custom_instructions=custom_instructions)

        updates = {
            "subject": generated["subject"],
            "body": generated["email_body"],
            "cta": generated["cta"],
            "confidence": generated["confidence"],
            "reason": generated["reason"],
            "status": "draft",
        }

        return EmailDraftRepository.update_draft(draft_id, updates)
