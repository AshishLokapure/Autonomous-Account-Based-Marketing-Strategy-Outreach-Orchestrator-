# AccountPilot AI — Verification Agent Documentation

## 1. Overview & Purpose

The **Verification Agent** (`app.agents.verification`) acts as the mandatory quality gatekeeper and hallucination blocker. It intercepts draft outreach messages produced by the Outreach Agent, extracts every factual claim and citation tag, and verifies them against the source document chunks in the vector database.

If any claim is unsupported, hallucinated, or miscited, the Verification Agent fails the check and passes actionable feedback back to the pipeline for regeneration.

---

## 2. Verification Criteria & Rules

1. **Citation Existence**: Every citation tag (e.g., `[Doc-102:Chunk-1]`) must resolve to a valid chunk in `AgentState["retrieved_documents"]`.
2. **Entailment / Grounding Check**: The statement containing the citation must be logically entailed by the text in the cited chunk.
3. **Tone & Compliance Check**: Validates that no forbidden terms, misleading guarantees, or spam trigger words are present.
4. **ICP & Product Alignment**: Ensures key product names and stakeholder titles match registered workspace records.

---

## 3. Execution & Verification Flow

```text
[Receive Draft Outreach Messages]
               ↓
Extract Sentences & Citation Tags via Regex / AST
               ↓
For Each Citation Tag:
  ├─ Lookup Chunk in Retrieved Context
  └─ Run Entailment Classifier (LLM / Cross-Encoder)
               ↓
    ┌───────────────────────────┐
    │  Are All Claims Grounded? │
    └─────────────┬─────────────┘
                  │
        ┌─────────┴─────────┐
        ▼                   ▼
    [YES: PASSED]       [NO: FAILED]
        │                   │
  Approve Drafts      Generate Feedback List
        │                   │
  End Pipeline        Loop Back to OutreachAgent
                      (Max 3 retries)
```

---

## 4. Input & Output Schemas

### Output Schema (`VerificationOutput`)

```json
{
  "status": "FAILED",
  "overall_grounding_score": 0.68,
  "verified_claims_count": 2,
  "flagged_issues": [
    {
      "message_id": "msg-001",
      "flagged_sentence": "We helped Global FinTech Corp reduce audit cycles by 85% within 30 days [Doc-882:Chunk-2].",
      "citation_tag": "[Doc-882:Chunk-2]",
      "error_type": "HALLUCINATED_METRIC",
      "explanation": "Doc-882:Chunk-2 states audit cycles were reduced by 60%, not 85%.",
      "remediation_instruction": "Correct the reduction metric from 85% to 60% based on Chunk 2."
    }
  ]
}
```

---

## 5. Feedback Loop & Rejection Protocol

When `status == "FAILED"`, the LangGraph execution graph triggers a conditional routing edge back to `OutreachAgent`. The `remediation_instruction` list is appended to the system prompt of the Outreach Agent, ensuring the next generation strictly corrects the cited errors.
