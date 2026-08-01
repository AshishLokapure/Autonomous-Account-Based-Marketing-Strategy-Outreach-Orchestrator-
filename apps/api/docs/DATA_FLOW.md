# AccountPilot AI — Data Flow & Lifecycle

## 1. End-to-End Data Lifecycle Overview

AccountPilot AI processes data across four primary lifecycle stages:
1. **Product & Context Ingestion Stage** (Product collateral, ICP definitions, battlecards, PDF case studies).
2. **Account Discovery & Context Harvesting Stage** (CRM data, company websites, news feeds, LinkedIn profiles).
3. **Multi-Agent Pipeline Orchestration Stage** (Agent-to-agent state propagation).
4. **Verification, Citation & Delivery Stage** (Guardrail validation and frontend rendering).

---

## 2. Stage-by-Stage Data Flow

### 2.1 Stage 1: Document & Knowledge Base Ingestion Flow

```text
[User Upload (PDF/MD/Docx)] → Next.js Client → FastAPI /api/v1/documents/upload
                                                   ↓
                                         Supabase Storage Bucket
                                                   ↓
                                        Celery Asynchronous Task
                                                   ↓
                                    Docling / PyPDF Parser & Text Extractor
                                                   ↓
                                    Recursive Character Text Splitter
                                   (Chunk Size: 800, Overlap: 100)
                                                   ↓
                                    OpenAI Embeddings API (3072-dim)
                                                   ↓
                                  Supabase pgvector (document_chunks)
```

1. **Upload**: User uploads product collateral or case study.
2. **Storage**: File is stored in Supabase Storage (`workspace-{id}/documents/`).
3. **Parsing**: Celery worker parses text content, preserving metadata (page numbers, headers).
4. **Chunking**: Text is split into semantic chunks.
5. **Vector Embedding**: Chunks are sent to OpenAI `text-embedding-3-large`.
6. **Persistence**: Chunks and vectors are inserted into `document_chunks` table with `workspace_id` and `product_id`.

---

### 2.2 Stage 2: Account Intelligence Harvesting Flow

```text
[Target Account URL / Domain] → FastAPI /api/v1/accounts/research
                                          ↓
                                Celery Research Task
                                          ↓
             ┌────────────────────────────┼────────────────────────────┐
             ↓                            ↓                            ↓
     Web Scraper Service          News / Press API          Firmographic Data API
    (Homepage & About Us)       (Recent announcements)      (Tech stack & Employee size)
             └────────────────────────────┬────────────────────────────┘
                                          ↓
                             Raw Account Fact Collection
                                          ↓
                           PostgreSQL (target_accounts)
```

1. **Domain Input**: User inputs target account domain (e.g., `acme.com`).
2. **Scraping**: Worker fetches site content, press releases, product offerings, leadership bios.
3. **Structuring**: Extracted facts are stored structured in `target_accounts` and `account_signals` tables.

---

### 2.3 Stage 3: Multi-Agent Orchestration Pipeline Flow

```text
                               ┌──────────────────┐
                               │  AgentState Dict │
                               └─────────┬────────┘
                                         │
 ┌───────────────────────────────────────┼───────────────────────────────────────┐
 │                                       │                                       │
 │  1. RESEARCH AGENT                    ▼                                       │
 │     Retrieves account facts, tech stack, company news.                        │
 │     Writes `state["research_facts"]`.                                         │
 │                                       │                                       │
 │  2. STAKEHOLDER AGENT                 ▼                                       │
 │     Identifies key decision-makers & maps roles to ICP personas.              │
 │     Writes `state["stakeholders"]`.                                           │
 │                                       │                                       │
 │  3. INTENT AGENT                      ▼                                       │
 │     Extracts hiring velocity, tech migration, and expansion signals.          │
 │     Writes `state["intent_signals"]`.                                         │
 │                                       │                                       │
 │  4. PAIN POINT AGENT                  ▼                                       │
 │     Correlates target friction with workspace product capabilities.           │
 │     Writes `state["pain_points"]`.                                            │
 │                                       │                                       │
 │  5. STRATEGY AGENT                    ▼                                       │
 │     Selects ABM Playbook and messaging matrix.                                │
 │     Writes `state["strategy_plan"]`.                                          │
 │                                       │                                       │
 │  6. OUTREACH AGENT                    ▼                                       │
 │     Generates multi-touch draft sequence with inline citation keys `[Ref-X]`.  │
 │     Writes `state["draft_outreach"]`.                                         │
 └───────────────────────────────────────┬───────────────────────────────────────┘
                                         │
                                         ▼
                             7. VERIFICATION AGENT
                      Compares claims against Vector Store
                                         │
                    ┌────────────────────┴────────────────────┐
                    │                                         │
             [Claims Verified]                      [Unsupported Claims]
                    │                                         │
                    ▼                                         ▼
            Approve & Save                        Regenerate / Flag
      (outreach_messages table)               (state["verification_errors"])
```

---

## 3. Data Schemas & Intermediate State

The internal pipeline state is maintained in a typed Python dictionary `AgentState`:

```python
class AgentState(TypedDict):
    account_id: str
    workspace_id: str
    product_id: str
    target_account: Dict[str, Any]
    product_context: Dict[str, Any]
    retrieved_chunks: List[Dict[str, Any]]
    research_facts: List[Dict[str, Any]]
    stakeholders: List[Dict[str, Any]]
    intent_signals: List[Dict[str, Any]]
    pain_points: List[Dict[str, Any]]
    strategy_plan: Dict[str, Any]
    draft_outreach: List[Dict[str, Any]]
    verification_status: str  # "PENDING" | "PASSED" | "FAILED"
    verification_errors: List[str]
    citation_map: Dict[str, str]  # Map [Ref-1] -> Document Chunk ID
```

---

## 4. Citation and Evidence Tracking

To prevent AI hallucinations:
1. Every piece of knowledge extracted during RAG retrieval is assigned a unique Citation Key (`[Doc-123:Chunk-4]`).
2. When the Outreach Agent generates content, it is strictly instructed to append citation keys after any factual statement.
3. The Verification Agent verifies that:
   - The citation key exists in `state["retrieved_chunks"]`.
   - The claims made in the sentence logically follow from the cited text snippet.
