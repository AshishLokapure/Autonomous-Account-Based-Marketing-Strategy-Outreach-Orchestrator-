# AccountPilot AI — Intent Agent Documentation

## 1. Overview & Purpose

The **Intent Agent** (`app.agents.intent`) detects and quantifies buying signals, active commercial intent, organizational urgency, and timing triggers for target accounts. It scans external signal streams (job board postings, tech stack changes, funding events) and internal signal streams (website visits, content downloads, email opens).

---

## 2. Signal Classification & Taxonomy

| Signal Type | Description | Intent Weight | Decay Half-Life |
| --- | --- | --- | --- |
| **Active Hiring Trigger** | Target company hiring 5+ engineers in a relevant domain | `HIGH` (0.85) | 30 days |
| **Tech Migration Trigger** | Migration from legacy competitor or sunsetting product | `CRITICAL` (0.95) | 14 days |
| **Leadership Change** | New VP or C-level hired within the last 90 days | `HIGH` (0.80) | 60 days |
| **Funding / M&A** | Series C+ funding or strategic acquisition | `MEDIUM` (0.70) | 90 days |
| **Pricing Page Visit** | Target account IP visiting pricing page multiple times | `CRITICAL` (0.90) | 7 days |

---

## 3. Input & Output Schemas

### Output Schema (`IntentOutput`)

```json
{
  "composite_intent_score": 88,
  "intent_tier": "HIGH_INTENT",
  "detected_signals": [
    {
      "signal_id": "sig-001",
      "category": "HIRING_VELOCITY",
      "headline": "Posted 6 positions for 'Senior Kubernetes Security Engineer'",
      "date_detected": "2026-07-20",
      "urgency": "HIGH",
      "implication": "Active initiatives to harden cloud infrastructure and implement Zero Trust access."
    },
    {
      "signal_id": "sig-002",
      "category": "TECH_EXPANSION",
      "headline": "Adopted Snowflake data warehouse in Q2 2026",
      "date_detected": "2026-06-15",
      "urgency": "MEDIUM",
      "implication": "High potential demand for Snowflake native integrations and pipeline governance."
    }
  ],
  "recommended_outreach_window": "IMMEDIATE (Within 48 Hours)"
}
```

---

## 4. Scoring Algorithm

The composite intent score \(S\) is computed using weighted signal aggregation with exponential time-decay:

\[
S = \min\left(100, \sum_{i=1}^{n} W_i \cdot e^{-\lambda t_i}\right)
\]

where:
- \(W_i\) is the base weight of signal \(i\).
- \(\lambda\) is the decay coefficient.
- \(t_i\) is the age of the signal in days.
