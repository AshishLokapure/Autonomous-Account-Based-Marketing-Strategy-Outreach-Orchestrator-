# AccountPilot — Stage 1 Implementation Plan

## Codebase Analysis Summary

| Layer | Stack | Key Files |
|-------|-------|-----------|
| **Frontend** | Next.js 15, React 19, TailwindCSS 3, Lucide icons, Recharts | `apps/web/` — App Router with `(auth)`, `dashboard`, `onboarding`, etc. |
| **Backend** | FastAPI, SQLAlchemy, Alembic, bcrypt, python-jose JWT | `apps/api/` — Custom JWT auth, User model, PostgreSQL |
| **Styling** | Vanilla CSS in `globals.css` + CSS Modules for onboarding; TailwindCSS configured but barely used | Dark navy sidebar, white cards, `#f6f8fc` canvas, `#2563eb` blue CTAs |
| **State** | No state management library (no Zustand/Redux) — `stores/`, `services/`, `hooks/`, `providers/` all empty `.gitkeep` | |
| **Database** | PostgreSQL via Docker or Supabase; single `User` model with integer PK | |
| **Infra** | Docker Compose (PG, Redis, Qdrant), pnpm monorepo | |

### Key Architectural Decision: Supabase Migration

The user requests **Supabase Auth, Supabase Storage, and Supabase Database (with RLS, pgvector)**. The existing backend uses a **custom FastAPI JWT + SQLAlchemy** auth system with integer PKs. This is fundamentally incompatible with Supabase Auth which uses UUID-based `auth.users`.

**Recommended approach**: Keep the existing FastAPI API backend for business logic endpoints, but:
1. **Replace custom auth** with Supabase Auth on the frontend (client-side `@supabase/supabase-js`) and validate Supabase JWTs on the FastAPI backend
2. **Use Supabase's PostgreSQL** as the database (replace Docker PG), with RLS policies for multi-tenant security
3. **Use Supabase Storage** for document uploads
4. **Use pgvector** in Supabase PostgreSQL for RAG embeddings

> [!IMPORTANT]
> The existing `User` model uses integer PKs and custom password hashing. With Supabase Auth, users are managed in `auth.users` (UUID PKs). We'll create a `profiles` table linked to `auth.users.id` and deprecate the old User model. The existing API auth endpoints will be superseded by Supabase Auth on the frontend.

## Open Questions

> [!IMPORTANT]
> **1. Supabase Project Credentials**: Do you already have a Supabase project created? I'll need the `SUPABASE_URL` and `SUPABASE_ANON_KEY` to configure the frontend, and `SUPABASE_SERVICE_ROLE_KEY` for the backend. If not, please create one at [supabase.com](https://supabase.com).

> [!IMPORTANT]
> **2. LLM Provider**: The `.env` has `OPENAI_API_KEY` and `OPENAI_MODEL=gpt-5`. Should I use OpenAI for the Product Intelligence and ICP agents, or do you prefer Google Gemini / another provider? This affects the backend AI service implementation.

> [!IMPORTANT]
> **3. Existing API Backend**: The current FastAPI backend has custom JWT auth. Should I:
> - **(A) Keep FastAPI** as the backend API, update it to validate Supabase JWTs, and add product/workspace/ICP endpoints there? (Recommended — preserves existing architecture)
> - **(B) Replace with Supabase Edge Functions** and Next.js API Routes for everything?

> [!IMPORTANT]
> **4. Embedding Provider**: For RAG document embeddings, should I use OpenAI `text-embedding-3-large` (as configured in `.env`) or another embedding model?

---

## Proposed Changes

### Phase 1: Supabase Integration & Authentication

---

#### Frontend — Supabase Client Setup

##### [NEW] [supabase.ts](file:///d:/Hackathon/InnovoHack%20Final/Autonomous-Account-Based-Marketing-Strategy-Outreach-Orchestrator-/apps/web/lib/supabase.ts)
- Create browser Supabase client using `@supabase/ssr`
- Server-side helper using cookies for SSR auth

##### [NEW] [supabase-server.ts](file:///d:/Hackathon/InnovoHack%20Final/Autonomous-Account-Based-Marketing-Strategy-Outreach-Orchestrator-/apps/web/lib/supabase-server.ts)
- Server component Supabase client

##### [MODIFY] [middleware.ts](file:///d:/Hackathon/InnovoHack%20Final/Autonomous-Account-Based-Marketing-Strategy-Outreach-Orchestrator-/apps/web/middleware.ts)
- Add Supabase session refresh
- Protect all routes except `/login`, `/register`, `/forgot-password`, `/reset-password`, `/auth/callback`
- Redirect unauthenticated users to `/login`
- Redirect authenticated users without workspace to `/onboarding`

##### [NEW] [AuthProvider.tsx](file:///d:/Hackathon/InnovoHack%20Final/Autonomous-Account-Based-Marketing-Strategy-Outreach-Orchestrator-/apps/web/providers/auth-provider.tsx)
- React context for auth state (user, session, profile, workspace)
- Listen to Supabase auth state changes
- Provide `signIn`, `signUp`, `signOut`, `resetPassword` methods

##### [MODIFY] [layout.tsx](file:///d:/Hackathon/InnovoHack%20Final/Autonomous-Account-Based-Marketing-Strategy-Outreach-Orchestrator-/apps/web/app/layout.tsx)
- Wrap app in `AuthProvider`

---

#### Auth Pages (Upgrade Existing)

##### [MODIFY] [login/template.tsx](file:///d:/Hackathon/InnovoHack%20Final/Autonomous-Account-Based-Marketing-Strategy-Outreach-Orchestrator-/apps/web/app/(auth)/login/template.tsx)
- Convert to `"use client"` with actual Supabase auth calls
- Wire up email/password form submission
- Add Google OAuth button functionality
- Add "Remember me" checkbox
- Handle redirects: workspace exists → `/dashboard`, no workspace → `/onboarding`

##### [MODIFY] [login/page.tsx](file:///d:/Hackathon/InnovoHack%20Final/Autonomous-Account-Based-Marketing-Strategy-Outreach-Orchestrator-/apps/web/app/(auth)/login/page.tsx)
- Simplify to just render (template.tsx handles the actual UI and is already rich)

##### [MODIFY] [register/page.tsx](file:///d:/Hackathon/InnovoHack%20Final/Autonomous-Account-Based-Marketing-Strategy-Outreach-Orchestrator-/apps/web/app/(auth)/register/page.tsx)
- Full registration form: Name, Work email, Password, Confirm password
- Match login template's split-screen design language
- Wire to Supabase `signUp` with user metadata (full_name)
- After signup → create profile → redirect to `/onboarding`

##### [NEW] [register/template.tsx](file:///d:/Hackathon/InnovoHack%20Final/Autonomous-Account-Based-Marketing-Strategy-Outreach-Orchestrator-/apps/web/app/(auth)/register/template.tsx)
- Split-screen layout matching login template visual design

##### [MODIFY] [forgot-password/page.tsx](file:///d:/Hackathon/InnovoHack%20Final/Autonomous-Account-Based-Marketing-Strategy-Outreach-Orchestrator-/apps/web/app/(auth)/forgot-password/page.tsx)
- Wire to Supabase `resetPasswordForEmail`

##### [NEW] [reset-password/page.tsx](file:///d:/Hackathon/InnovoHack%20Final/Autonomous-Account-Based-Marketing-Strategy-Outreach-Orchestrator-/apps/web/app/(auth)/reset-password/page.tsx)
- Password reset form after clicking email link

##### [NEW] [auth/callback/route.ts](file:///d:/Hackathon/InnovoHack%20Final/Autonomous-Account-Based-Marketing-Strategy-Outreach-Orchestrator-/apps/web/app/auth/callback/route.ts)
- OAuth callback handler for Google sign-in and email confirmation

---

### Phase 2: Database Schema (Supabase SQL Migrations)

---

##### [NEW] `supabase/migrations/001_core_schema.sql`

Creates all Stage 1 tables with RLS:

```
profiles (id UUID PK → auth.users, full_name, avatar_url, created_at, updated_at)

workspaces (id UUID PK, name, website, industry, company_size, country, logo_url, created_at, updated_at)

workspace_members (id, workspace_id FK, user_id FK → auth.users, role ENUM[owner,admin,manager,member], joined_at)

products (id UUID PK, workspace_id FK, name, product_type, category, website, short_description, detailed_description, primary_problem, pricing_model, deal_size, status ENUM, created_at, updated_at)

product_features (id, product_id FK, feature TEXT)
product_pain_points (id, product_id FK, pain_point TEXT)
product_outcomes (id, product_id FK, outcome TEXT)
product_differentiators (id, product_id FK, differentiator TEXT)
product_competitors (id, product_id FK, competitor TEXT)
product_buying_triggers (id, product_id FK, trigger TEXT)

product_target_industries (id, product_id FK, industry TEXT)
product_target_geographies (id, product_id FK, geography TEXT)
product_target_technologies (id, product_id FK, technology TEXT)
product_target_personas (id, product_id FK, persona TEXT)
product_exclusion_rules (id, product_id FK, rule TEXT)
product_target_company_types (id, product_id FK, company_type TEXT)
product_target_company_sizes (id, product_id FK, min_employees INT, max_employees INT)

product_value_context (id, product_id FK, primary_value_proposition, existing_customer_types, typical_sales_cycle, customer_requirements)

knowledge_documents (id UUID, workspace_id FK, product_id FK nullable, filename, original_name, file_type, file_size, storage_path, status ENUM[uploading,processing,indexed,failed], doc_type, page_count, created_at)

document_chunks (id UUID, document_id FK, workspace_id FK, product_id FK, content TEXT, page INT, section TEXT, chunk_index INT, embedding VECTOR(3072), metadata JSONB, created_at)

icp_profiles (id UUID, product_id FK, workspace_id FK, status ENUM[draft,generating,ready,approved], min_employees INT, max_employees INT, ai_recommendations JSONB, approved_at, created_at, updated_at)

icp_industries (id, icp_id FK, industry, source ENUM[user,ai])
icp_geographies (id, icp_id FK, geography, source)
icp_technologies (id, icp_id FK, technology, source)
icp_personas (id, icp_id FK, persona, title, source)
icp_signals (id, icp_id FK, signal, signal_type ENUM[buying,pain,positive,negative], source)
icp_exclusions (id, icp_id FK, rule, source)
icp_company_types (id, icp_id FK, company_type, source)
icp_discovery_keywords (id, icp_id FK, keyword, source)

jobs (id UUID, workspace_id FK, job_type ENUM, status ENUM[queued,running,completed,failed,retrying], product_id FK nullable, account_id FK nullable, progress INT 0-100, started_at, completed_at, error TEXT, retry_count INT, metadata JSONB, created_at, updated_at)

agent_runs (id UUID, workspace_id FK, job_id FK nullable, agent_type TEXT, task TEXT, status ENUM, product_id FK nullable, account_id FK nullable, input JSONB, output JSONB, error TEXT, started_at, completed_at, duration_ms INT, created_at)

agent_events (id UUID, agent_run_id FK, event_type TEXT, message TEXT, data JSONB, created_at)

evidence_sources (id UUID, workspace_id FK, source_type, source_url, source_title, reliability_score, created_at)

evidence_items (id UUID, workspace_id FK, product_id FK nullable, account_id FK nullable, source_id FK, excerpt TEXT, evidence_class ENUM[fact,signal,inference], confidence FLOAT, source_date, retrieved_at, metadata JSONB, created_at)

product_intelligence (id UUID, product_id FK, workspace_id FK, raw_output JSONB, category, summary, problems_solved JSONB, capabilities JSONB, business_outcomes JSONB, ideal_industries JSONB, ideal_company_sizes JSONB, ideal_geographies JSONB, relevant_technologies JSONB, likely_pain_points JSONB, buying_triggers JSONB, decision_makers JSONB, technical_champions JSONB, end_users JSONB, competitor_categories JSONB, differentiators JSONB, discovery_keywords JSONB, negative_fit_conditions JSONB, created_at, updated_at)
```

**RLS Policies**: Every table gets policies scoped to `workspace_id` via `workspace_members`:
- Users can only SELECT/INSERT/UPDATE/DELETE rows where they are a member of the matching workspace
- `profiles` table: users can only read/update their own profile

##### [NEW] `supabase/migrations/002_storage.sql`
- Create `product-documents` storage bucket
- RLS policy: only workspace members can upload/read files for their workspace

##### [NEW] `supabase/migrations/003_pgvector.sql`
- Enable `vector` extension
- Create embedding index on `document_chunks.embedding` using `ivfflat` or `hnsw`

---

### Phase 3: Workspace & Onboarding

---

##### [MODIFY] [onboarding/page.tsx](file:///d:/Hackathon/InnovoHack%20Final/Autonomous-Account-Based-Marketing-Strategy-Outreach-Orchestrator-/apps/web/app/onboarding/page.tsx)
- Simplify to workspace creation flow (Step 1 only from existing 4 steps)
- Fields: Company/Workspace Name*, Website, Industry, Company Size, Country
- On submit: create workspace + workspace_member (owner role) in Supabase
- After creation → redirect to `/dashboard`
- Remove existing Steps 2-4 (Goals, Products, Connect) — these are now handled by Products & ICP page

---

### Phase 4: Sidebar & Navigation Update

---

##### [MODIFY] [sidebar.tsx](file:///d:/Hackathon/InnovoHack%20Final/Autonomous-Account-Based-Marketing-Strategy-Outreach-Orchestrator-/apps/web/components/layout/sidebar.tsx)
- Add "Products & ICP" nav item with `Sparkles` or `Package` icon under new "PRODUCT INTELLIGENCE" section
- Group navigation items into sections:
  - Dashboard (ungrouped)
  - PRODUCT INTELLIGENCE: Products & ICP
  - ACCOUNT INTELLIGENCE: Accounts, Research Center, Stakeholders, Intent Signals
  - EXECUTION: Strategy Center, Outreach Studio
  - KNOWLEDGE: Documents
  - OPERATIONS: Analytics, Agent Monitor, Notifications, Settings
- Replace hardcoded "Northstar Revenue" / "John Smith" with dynamic workspace/user data from auth context
- Wire logout button to Supabase `signOut`
- Keep identical visual styling (same CSS classes, same spacing, same colors)

##### [MODIFY] [app-shell.tsx](file:///d:/Hackathon/InnovoHack%20Final/Autonomous-Account-Based-Marketing-Strategy-Outreach-Orchestrator-/apps/web/components/layout/app-shell.tsx)
- Replace hardcoded "JS" avatar with user initials from auth context
- Make it a client component to access auth state

---

### Phase 5: Products & ICP Page

---

##### [NEW] [products/page.tsx](file:///d:/Hackathon/InnovoHack%20Final/Autonomous-Account-Based-Marketing-Strategy-Outreach-Orchestrator-/apps/web/app/products/page.tsx)
- Product list page with AppShell
- Eyebrow: "PRODUCT INTELLIGENCE"
- Title: "Products & ICP"
- Top-right: "+ Add Product" button
- Shows product cards if products exist (fetched from Supabase)
- Shows empty state if no products
- Each product card: name, category, target market, ICP status, accounts found, last analysis, status
- Action buttons: View, Edit, Find Accounts

##### [NEW] [products/new/page.tsx](file:///d:/Hackathon/InnovoHack%20Final/Autonomous-Account-Based-Marketing-Strategy-Outreach-Orchestrator-/apps/web/app/products/new/page.tsx)
- 4-step product creation wizard
- Step 1: Product Details (name, type, category, website, descriptions, problem, features, outcomes, pricing)
- Step 2: Value & Sales Context (value prop, pain points, differentiators, competitors, buying triggers, sales cycle)
- Step 3: Target Customer (industries, company size, geography, company type, technologies, personas, requirements, exclusions)
- Step 4: Knowledge & Documents (file uploads to Supabase Storage)
- Final review screen with summary
- "Create Product & Generate ICP" button → saves to database, kicks off background jobs

##### [NEW] [products/[productId]/page.tsx](file:///d:/Hackathon/InnovoHack%20Final/Autonomous-Account-Based-Marketing-Strategy-Outreach-Orchestrator-/apps/web/app/products/[productId]/page.tsx)
- Product detail/edit page

##### [NEW] [products/[productId]/icp/page.tsx](file:///d:/Hackathon/InnovoHack%20Final/Autonomous-Account-Based-Marketing-Strategy-Outreach-Orchestrator-/apps/web/app/products/[productId]/icp/page.tsx)
- ICP review page showing generated ICP
- Sections: Industries, Company Size, Geography, Technologies, Buying Signals, Personas, Exclusions, AI Recommendations
- Edit ICP button
- "Find Target Accounts" button (disabled/placeholder for Stage 2)

---

### Phase 6: Backend Services (FastAPI)

---

##### [MODIFY] [config.py](file:///d:/Hackathon/InnovoHack%20Final/Autonomous-Account-Based-Marketing-Strategy-Outreach-Orchestrator-/apps/api/app/core/config.py)
- Add Supabase settings: `supabase_url`, `supabase_anon_key`, `supabase_service_role_key`, `supabase_jwt_secret`
- Add OpenAI/LLM settings

##### [NEW] `apps/api/app/core/supabase.py`
- Supabase admin client (service role) for server-side operations

##### [MODIFY] [dependencies.py](file:///d:/Hackathon/InnovoHack%20Final/Autonomous-Account-Based-Marketing-Strategy-Outreach-Orchestrator-/apps/api/app/auth/dependencies.py)
- Add Supabase JWT validation (verify Supabase-issued tokens)
- New `get_current_user_supabase` dependency

##### [NEW] `apps/api/app/api/v1/workspaces.py`
- CRUD endpoints for workspaces

##### [NEW] `apps/api/app/api/v1/products.py`
- CRUD endpoints: create, list, get, update, archive products
- Trigger product analysis job

##### [NEW] `apps/api/app/api/v1/documents.py`
- Upload, list, delete, process documents
- Signed URL generation for Supabase Storage

##### [NEW] `apps/api/app/api/v1/intelligence.py`
- Trigger product analysis, check status, get results
- Generate/get/update ICP

##### [NEW] `apps/api/app/api/v1/jobs.py`
- Job status endpoints

##### [NEW] `apps/api/app/api/v1/agents.py`
- Agent runs and events endpoints (for Agent Monitor)

##### [NEW] `apps/api/app/services/product_service.py`
- Business logic for product CRUD

##### [NEW] `apps/api/app/services/intelligence_service.py`
- Product Intelligence Agent orchestration
- LLM calls for product analysis
- Strict JSON schema validation of output

##### [NEW] `apps/api/app/services/icp_service.py`
- ICP Engine: combines seller-defined targets + product intelligence
- Distinguishes USER REQUIREMENT vs AI RECOMMENDATION

##### [NEW] `apps/api/app/services/document_service.py`
- Document parsing (PDF, DOCX, TXT, CSV)
- Chunking strategy
- Embedding generation
- pgvector storage

##### [NEW] `apps/api/app/services/job_service.py`
- Background job management
- Job state machine (QUEUED → RUNNING → COMPLETED/FAILED/RETRYING)

---

### Phase 7: Background Job Architecture

---

##### [NEW] `apps/api/app/workers/` directory
- `base.py` — Abstract worker class with retry, logging, state management
- `product_analysis_worker.py` — Product Intelligence Agent pipeline
- `icp_generation_worker.py` — ICP generation pipeline
- `document_indexing_worker.py` — Document parsing + embedding pipeline

Use Python's `asyncio` + `BackgroundTasks` (FastAPI) for job execution. For production, this would migrate to Celery/Redis, but for Stage 1, FastAPI BackgroundTasks + a jobs table provides the required async behavior.

---

### Phase 8: Agent Monitor Integration

---

##### [MODIFY] [agent-monitor/page.tsx](file:///d:/Hackathon/InnovoHack%20Final/Autonomous-Account-Based-Marketing-Strategy-Outreach-Orchestrator-/apps/web/app/agent-monitor/page.tsx)
- Replace static demo data with real `agent_runs` from database
- Show: Agent type, Task, Status, Started, Duration, Product, Error
- Poll for updates or use Supabase Realtime
- Stage 1 agents: Product Intelligence Agent, ICP Agent, Document Processing Agent

---

### Phase 9: Evidence System Foundation

---

##### Tables already included in migration (Phase 2)
- `evidence_sources` and `evidence_items` tables
- Support for FACT, SIGNAL, INFERENCE classification
- Nullable `account_id` for future Stage 2

---

### Phase 10: Environment & Configuration

---

##### [MODIFY] [.env.example](file:///d:/Hackathon/InnovoHack%20Final/Autonomous-Account-Based-Marketing-Strategy-Outreach-Orchestrator-/.env.example)
Add:
```
SUPABASE_URL=
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
SUPABASE_JWT_SECRET=
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

##### [NEW] [.env.local.example](file:///d:/Hackathon/InnovoHack%20Final/Autonomous-Account-Based-Marketing-Strategy-Outreach-Orchestrator-/apps/web/.env.local.example)
Frontend env vars (public Supabase keys only)

---

## Verification Plan

### Automated Tests
```bash
# Backend API tests
cd apps/api && python -m pytest

# Frontend build verification
cd apps/web && npm run build
```

### Manual Verification (E2E Flow)
1. **Signup**: New user → `/register` → creates account in Supabase Auth + profile row
2. **Login**: Existing user → `/login` → session established, redirects correctly
3. **Google OAuth**: Click "Continue with Google" → completes auth flow
4. **Forgot Password**: Submit email → receives reset link
5. **Workspace Creation**: Post-signup → `/onboarding` → create workspace "Northstar Revenue"
6. **Products Empty State**: Navigate to Products → "Add your first product" shown
7. **Add Product Flow**: 4-step wizard with all fields, document uploads
8. **Product Intelligence**: Background job runs, agent_runs created, status visible in Agent Monitor
9. **ICP Generation**: ICP generated from product + seller input, review page loads
10. **ICP Review**: Edit ICP, "Find Target Accounts" button present (Stage 2 placeholder)
11. **RLS Verification**: Create second user/workspace → confirm data isolation
12. **Route Protection**: Unauthenticated access to `/dashboard` → redirect to `/login`
13. **Refresh Persistence**: Refresh any page → data persists, session maintained
14. **Agent Monitor**: Shows real agent runs with correct status/duration

### Database Verification
- All tables created with correct constraints
- RLS policies enforce workspace isolation
- Storage bucket with access policies
- pgvector extension enabled and indexes created

---

## Implementation Order

| # | Task | Estimated Complexity |
|---|------|---------------------|
| 1 | Install Supabase packages (frontend + backend) | Low |
| 2 | Create Supabase client utilities | Low |
| 3 | Database migrations (all tables + RLS + storage) | High |
| 4 | Auth provider + middleware (route protection) | Medium |
| 5 | Upgrade login page with Supabase Auth | Medium |
| 6 | Create register page with Supabase Auth | Medium |
| 7 | Forgot/reset password pages | Low |
| 8 | OAuth callback route | Low |
| 9 | Workspace onboarding (simplify existing) | Medium |
| 10 | Sidebar navigation update | Low |
| 11 | Products list page (empty + populated states) | Medium |
| 12 | Product creation wizard (4 steps + review) | High |
| 13 | Backend product endpoints | Medium |
| 14 | Document upload + Supabase Storage | Medium |
| 15 | Background job system | Medium |
| 16 | Product Intelligence Agent (LLM) | High |
| 17 | ICP Engine | High |
| 18 | ICP Review page | Medium |
| 19 | Document processing + RAG pipeline | High |
| 20 | Agent Monitor integration | Medium |
| 21 | Update .env files | Low |
| 22 | Testing + verification | Medium |

---

## Key Design Decisions

1. **Supabase Auth replaces custom JWT**: Frontend uses `@supabase/ssr` for auth. Backend validates Supabase JWTs. Existing FastAPI auth code will be preserved but superseded.

2. **Multi-tenant via RLS**: Every table has `workspace_id`. RLS policies enforce that queries only return data for workspaces the authenticated user belongs to. This is enforced at the database level, not just application level.

3. **Background jobs via FastAPI BackgroundTasks + jobs table**: Not using Celery for Stage 1 to avoid infrastructure complexity. Jobs are tracked in the `jobs` table with state machine logic. The API returns immediately and the frontend polls for status.

4. **ICP distinguishes user vs AI input**: Every ICP child record has a `source` column (`user` or `ai`) so the system never silently overrides user requirements.

5. **Sidebar grouped with section labels**: Navigation items grouped into functional areas with small gray labels, matching the existing `nav-label` CSS class already in globals.css.

6. **Preserve existing pages**: Dashboard, Accounts, Research, etc. remain untouched. Only sidebar navigation and route protection are added.
