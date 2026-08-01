# AccountPilot AI — Pain Point Agent Documentation

## 1. Overview & Purpose

The **Pain Point Agent** (`app.agents.pain_point`) bridges the gap between target account challenges and the workspace product offerings. It synthesizes research facts, stakeholder priorities, and intent signals to isolate specific operational, financial, and technical pain points, mapping each pain point directly to proven product capabilities and outcomes.

---

## 2. Core Functional Requirements

- **Friction Identification**: Distills underlying organizational bottlenecks (e.g., slow deployment cycles, high compliance overhead, data silos).
- **Stakeholder Mapping**: Associates pain points with specific stakeholder personas (e.g., CIO cares about budget predictability; DevOps Lead cares about tool complexity).
- **Solution Alignment**: Queries internal product collateral via RAG to retrieve exact feature matches, case study benchmarks, and ROI claims.

---

## 3. Input & Output Schemas

### Output Schema (`PainPointOutput`)

```json
{
  "pain_points": [
    {
      "pain_point_id": "pp-1",
      "category": "OPERATIONAL_EFFICIENCY",
      "headline": "Manual Compliance Audits Delay Deployment Cycles by 4 Weeks",
      "severity": "CRITICAL",
      "target_stakeholder_persona": "Technical Evaluator (DevOps Lead)",
      "evidence_quote": "Job postings emphasize requirement to reduce audit preparation time for SOC2/ISO27001.",
      "product_solution_mapping": {
        "matched_feature": "Automated Security & Compliance Evidence Collection",
        "value_proposition": "Continuous audit readiness with automated evidence collection, reducing audit cycles from 4 weeks to 2 hours.",
        "supporting_case_study_chunk_id": "doc-chunk-882"
      }
    },
    {
      "pain_point_id": "pp-2",
      "category": "COST_OVERRUNS",
      "headline": "Unpredictable Cloud Infrastructure Spend on Legacy Tooling",
      "severity": "HIGH",
      "target_stakeholder_persona": "Economic Buyer (CIO)",
      "product_solution_mapping": {
        "matched_feature": "Smart Workload Cost Optimization",
        "value_proposition": "Guaranteed 25% cost reduction on cloud computing via dynamic autoscaling.",
        "supporting_case_study_chunk_id": "doc-chunk-104"
      }
    }
  ]
}
```

---

## 4. Execution Logic

1. Extract all raw pain point candidates from `research_facts` and `intent_signals`.
2. Perform RAG Vector Search against `document_chunks` for the active product using query vectors derived from the pain points.
3. Use LLM semantic matching to filter out weak matches (similarity score < 0.75).
4. Construct structured mapping dictionary into `AgentState["pain_points"]`.
