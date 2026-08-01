# AccountPilot AI — System Architecture

## 1. Executive Overview

**AccountPilot AI** is an autonomous Account-Based Marketing (ABM) Strategy & Outreach Orchestrator. It connects fragmented enterprise data (CRMs, emails, meeting transcripts, annual reports, market news, internal product collateral), builds evidence-backed target account profiles, maps decision-maker committees, identifies intent signals and pain points, and synthesizes hyper-personalized, source-cited outreach strategies.

The system is designed with a **decoupled, multi-agent AI architecture** operating on top of a robust FastAPI backend service, a Next.js 15 enterprise frontend, and a Supabase PostgreSQL vector database for high-precision Retrieval-Augmented Generation (RAG).

---

## 2. High-Level Architecture Diagram

```text
┌──────────────────────────────────────────────────────────────────────────────────┐
│                                 CLIENT LAYER                                     │
│  Next.js 15 App Router | React 19 | Tailwind CSS | Supabase Auth Client         │
└────────────────────────────────────────┬─────────────────────────────────────────┘
                                         │ HTTPS / REST / WebSockets / Supabase JWT
┌────────────────────────────────────────▼─────────────────────────────────────────┐
│                                 FASTAPI API LAYER                                │
│  FastAPI 0.110+ | Pydantic v2 | Supabase JWT Auth Middleware | CORS              │
│                                                                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐  │
│  │ Account API  │  │ Product API  │  │ Document API │  │ Agent Execution API  │  │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘  └──────────┬───────────┘  │
└─────────┼─────────────────┼─────────────────┼─────────────────────┼──────────────┘
          │                 │                 │                     │
┌─────────▼─────────────────▼─────────────────▼─────────────────────▼──────────────┐
│                               SERVICE & DOMAIN LAYER                             │
│  AccountService | ProductService | DocumentService | AgentOrchestrator           │
└─────────┬───────────────────────────────────┬─────────────────────┬──────────────┘
          │                                   │                     │
┌─────────▼───────────────────────────┐ ┌─────▼───────────────────┐ ┌▼─────────────┐
│      MULTI-AGENT PIPELINE           │ │      RAG ENGINE         │ │ TASK QUEUE   │
│  LangGraph StateGraph / LangChain   │ │  PyPDF / Docling        │ │ Celery       │
│                                     │ │  OpenAI Embeddings      │ │ Redis        │
│  ResearchAgent  → StakeholderAgent │ │  (3072-dim vector)      │ │ Background   │
│  IntentAgent    → PainPointAgent   │ │  Hybrid Vector Search    │ │ Execution    │
│  StrategyAgent  → OutreachAgent     │ └─────────┬───────────────┘ └──────────────┘
│            ↓                        │           │
│    VerificationAgent (Guardrail)    │           │
└─────────────────┬───────────────────┘           │
                  │                               │
┌─────────────────▼───────────────────────────────▼────────────────────────────────┐
│                              PERSISTENCE LAYER                                  │
│  Supabase PostgreSQL (Postgres 15+) with pgvector                                │
│  - Relational Schema (Accounts, Stakeholders, Products, Campaigns, Agent Runs)   │
│  - Document Chunks Vector Store (HNSW index)                                     │
│  - Row Level Security (RLS) Multi-Tenant Data Isolation                          │
└──────────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Key Components & Responsibilities

### 3.1 Web Application (`apps/web`)
- Built with **Next.js 15 (App Router)** and **React 19**.
- Manages authentication sessions via `@supabase/ssr`.
- Displays real-time agent execution visualizers, evidence drawers, account health dashboards, ICP configuration, and multi-channel campaign managers.

### 3.2 Backend API (`apps/api`)
- Built with **FastAPI** (Python 3.11+).
- Provides RESTful API endpoints for target account management, product catalog configuration, document ingestion, and multi-agent execution triggering.
- Validates Supabase JWT tokens via security middleware.
- Structured following Domain-Driven Design (DDD) principles: `api/`, `core/`, `models/`, `repositories/`, `schemas/`, `services/`.

### 3.3 Multi-Agent Orchestration (`apps/api/app/agents/`)
- Built with **LangGraph** / **LangChain**.
- State Machine managing execution order across 7 specialized agents:
  1. **Research Agent**: Scrapes and aggregates company background, news, and tech stack.
  2. **Stakeholder Agent**: Maps buying committees and profiles key contacts.
  3. **Intent Agent**: Identifies buying signals and urgency metrics.
  4. **Pain Point Agent**: Maps target operational friction to product solutions.
  5. **Strategy Agent**: Selects ABM playbooks and positioning angles.
  6. **Outreach Agent**: Synthesizes hyper-personalized messages.
  7. **Verification Agent**: Grounding guardrail blocking unsupported claims.

### 3.4 RAG Engine & Vector Search
- Handles document chunking (500–1000 tokens with 100 token overlap).
- Generates 3072-dimensional embeddings via OpenAI `text-embedding-3-large`.
- Stores vectors in Supabase PostgreSQL using `pgvector` with HNSW indexing for sub-10ms retrieval latency.

### 3.5 Asynchronous Task Queue (`apps/worker`)
- Powered by **Celery** with **Redis** broker.
- Offloads long-running tasks: web scraping, batch embedding generation, heavy multi-agent orchestration pipelines, and PDF parsing.

---

## 4. Multi-Tenant Security & Isolation

- **Authentication**: User authentication is handled via Supabase Auth (JWT).
- **Row Level Security (RLS)**: Every query executed against PostgreSQL is restricted to `workspace_id = current_workspace()`.
- **API Authorization**: FastAPI middleware extracts the Supabase bearer token, decodes the claims, verifies active workspace membership, and injects workspace scope into database queries.

---

## 5. Architectural Principles

1. **Evidence-Grounded Intelligence**: Every generated outreach email or strategy document must cite underlying document chunks or data sources.
2. **Deterministic Guardrails**: The Verification Agent operates as a final circuit breaker before content delivery.
3. **Fail-Safe & Idempotent**: Agent steps save intermediate state to `agent_runs` table, allowing resume-on-failure execution.
