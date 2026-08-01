# AccountPilot AI — Stakeholder Agent Documentation

## 1. Overview & Purpose

The **Stakeholder Agent** (`app.agents.stakeholder`) maps the buying committee within a target enterprise account. In B2B ABM, decisions are made by multi-disciplinary teams (Economic Buyer, Technical Evaluator, User Champion, Executive Sponsor, Gatekeeper). This agent discovers key personnel, evaluates their influence levels, and matches them to defined ICP personas.

---

## 2. Key Capabilities

- **Buying Committee Mapping**: Identifies executives, VPs, Directors, and Tech Leads.
- **Persona Matching**: Maps raw job titles and job descriptions to ICP Personas (e.g., "VP of Infrastructure" → "Technical Decision Maker").
- **Influence & Champion Scoring**: Assigns buying power scores and estimates champion potential based on LinkedIn activities, public speaking, and role responsibility.
- **Engagement Tracking**: Integrates historical touchpoints from CRM/Email logs to identify warm vs. cold contacts.

---

## 3. Input & Output Schemas

### Input State Requirements
- `state["research_facts"]`: Output from Research Agent
- `state["icp_criteria"]`: ICP Target Personas defined in Workspace

### Output Schema (`StakeholderOutput`)

```json
{
  "stakeholders": [
    {
      "full_name": "Jane Doe",
      "job_title": "Chief Information Officer",
      "department": "Information Technology",
      "persona_category": "Economic Buyer",
      "influence_level": "HIGH",
      "perceived_priority": "Cloud Cost Optimization & Zero Trust Security",
      "recent_activity": "Spoke at CloudCon 2026 on enterprise AI security models.",
      "contact_information": {
        "email": "j.doe@acme-corp.com",
        "linkedin_url": "https://linkedin.com/in/janedoe-example"
      },
      "champion_score": 0.85
    },
    {
      "full_name": "Mark Smith",
      "job_title": "Head of DevOps & Platform Engineering",
      "department": "Engineering",
      "persona_category": "Technical Evaluator",
      "influence_level": "MEDIUM",
      "perceived_priority": "Developer productivity and CI/CD pipeline automation",
      "champion_score": 0.92
    }
  ],
  "committee_coverage_score": 0.88
}
```

---

## 4. Execution Workflow

1. **CRM & Ingestion Lookup**: Query internal CRM records and meeting notes for known contacts.
2. **Web / Public Profile Search**: Search public web data for leadership listings and engineering org structures.
3. **Persona Categorization**: Run LLM classification prompt against target ICP personas.
4. **Relationship Matrix Synthesis**: Construct relationship tree and output structured JSON into `AgentState["stakeholders"]`.
