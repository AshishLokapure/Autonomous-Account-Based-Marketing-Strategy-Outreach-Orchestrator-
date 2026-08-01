# AccountPilot AI — Strategy Agent Documentation

## 1. Overview & Purpose

The **Strategy Agent** (`app.agents.strategy`) serves as the master campaign planner. It ingests all prior intelligence (Research, Stakeholders, Intent Signals, and Pain Point Mappings) and formulates an actionable ABM Playbook Strategy for the target account.

---

## 2. ABM Playbook Framework

The agent selects between three standard ABM Playbook Tiers:

1. **Tier 1: 1-to-1 Hyper-Personalized Executive Track**
   - *Target*: High-value accounts ($100k+ ACV) with high intent.
   - *Strategy*: Executive-to-Executive tailored brief, bespoke landing page angle, technical workshop pitch.
2. **Tier 2: 1-to-Few Cluster Track**
   - *Target*: Accounts in specific industry verticals with moderate intent.
   - *Strategy*: Industry-specific pain point sequences, peer case studies, solution webinars.
3. **Tier 3: 1-to-Many Programmatic Track**
   - *Target*: Broad target accounts meeting baseline ICP criteria.
   - *Strategy*: Automated value-based nurture sequences and feature highlight campaigns.

---

## 3. Output Schema (`StrategyOutput`)

```json
{
  "selected_playbook": "TIER_1_HYPER_PERSONALIZED",
  "strategic_positioning": "Position product as the missing compliance-automation layer for Acme Corp's European expansion.",
  "messaging_matrix": [
    {
      "persona": "Economic Buyer (CIO)",
      "core_hook": "De-risk European expansion by automating compliance and cutting cloud costs by 25%.",
      "recommended_channel": "Executive Email & LinkedIn InMail",
      "call_to_action": "30-minute Peer-to-Peer Executive Strategy Session"
    },
    {
      "persona": "Technical Evaluator (DevOps Lead)",
      "core_hook": "Eliminate 4 weeks of manual SOC2 audit prep with automated evidence pipelines.",
      "recommended_channel": "Technical Email & Direct Sandbox Access Link",
      "call_to_action": "Self-Guided Interactive Sandbox Tour"
    }
  ],
  "campaign_timeline": [
    {"day": 1, "action": "Executive Brief Email to CIO"},
    {"day": 3, "action": "LinkedIn Connection request from VP of Sales"},
    {"day": 5, "action": "Technical Email to Head of DevOps with Case Study link"},
    {"day": 8, "action": "Follow-up email with ROI Calculator attachment"}
  ]
}
```

---

## 4. Key Execution Steps

1. **Playbook Selection Logic**: Evaluates account priority score, estimated deal size, and intent score.
2. **Angle Formulation**: Selects primary value proposition driver (e.g., Cost Savings vs. Revenue Acceleration vs. Risk Mitigation).
3. **Messaging Matrix Construction**: Generates tailored hooks per stakeholder persona.
4. **State Update**: Writes structured strategy plan to `AgentState["strategy_plan"]`.
