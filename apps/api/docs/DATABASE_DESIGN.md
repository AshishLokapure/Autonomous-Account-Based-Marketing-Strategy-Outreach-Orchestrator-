# AccountPilot AI — Database Design & Schema Reference

## 1. Overview

AccountPilot AI utilizes **Supabase PostgreSQL 15+** equipped with the `pgvector` extension for vector similarity search. Multi-tenancy and data isolation are strictly enforced via **Row Level Security (RLS)** policies on every table.

---

## 2. Entity-Relationship Diagram (ERD Summary)

```text
[auth.users] (Supabase Auth)
     │
     ├── 1:1 ──► [profiles]
     └── 1:N ──► [workspace_members] ◄── N:1 ── [workspaces]
                                                     │
        ┌────────────────────────────────────────────┼────────────────────────────────────────────┐
        │                                            │                                            │
        ▼                                            ▼                                            ▼
   [products]                                [target_accounts]                           [knowledge_documents]
        │                                            │                                            │
        ├── 1:N ──► [product_features]               ├── 1:N ──► [stakeholders]                   └── 1:N ──► [document_chunks]
        ├── 1:N ──► [product_pain_points]            ├── 1:N ──► [intent_signals]                              (VECTOR 3072)
        └── 1:N ──► [icp_profiles]                   └── 1:N ──► [campaigns]
                                                                     │
                                                                     └── 1:N ──► [outreach_messages]
```

---

## 3. Core Tables Reference

### 3.1 `profiles`
Stores extended user profile information linked to Supabase Auth.
- `id` (UUID, PK, FK -> `auth.users.id`)
- `full_name` (TEXT)
- `avatar_url` (TEXT)
- `created_at` (TIMESTAMPTZ)

### 3.2 `workspaces`
Tenant root entity.
- `id` (UUID, PK)
- `name` (TEXT, NOT NULL)
- `website` (TEXT)
- `industry` (TEXT)
- `created_at` (TIMESTAMPTZ)

### 3.3 `products`
Product catalog items registered in a workspace.
- `id` (UUID, PK)
- `workspace_id` (UUID, FK -> `workspaces.id`, NOT NULL)
- `name` (TEXT, NOT NULL)
- `short_description` (TEXT)
- `primary_problem` (TEXT)
- `pricing_model` (TEXT)
- `deal_size` (TEXT)

### 3.4 `knowledge_documents` & `document_chunks`
Stores parsed documents and 3072-dimensional vector embeddings.
```sql
CREATE TABLE knowledge_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  filename TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  file_type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'uploading', -- 'uploading' | 'processing' | 'indexed' | 'failed'
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE document_chunks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES knowledge_documents(id) ON DELETE CASCADE,
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  content TEXT NOT NULL,
  page_number INT,
  chunk_index INT NOT NULL,
  embedding VECTOR(3072),
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### 3.5 `target_accounts`
Enterprise accounts undergoing ABM targeting.
- `id` (UUID, PK)
- `workspace_id` (UUID, FK -> `workspaces.id`)
- `company_name` (TEXT, NOT NULL)
- `domain` (TEXT, NOT NULL)
- `industry` (TEXT)
- `employee_count` (INT)
- `status` (TEXT) -- 'discovered' | 'enriching' | 'targeted' | 'engaged'

### 3.6 `agent_runs` & `agent_run_steps`
Tracks multi-agent pipeline executions and diagnostic telemetry.
- `id` (UUID, PK)
- `workspace_id` (UUID, FK -> `workspaces.id`)
- `account_id` (UUID, FK -> `target_accounts.id`)
- `status` (TEXT) -- 'running' | 'completed' | 'failed'
- `execution_state` (JSONB)
- `error_log` (TEXT)

---

## 4. Multi-Tenant RLS Policy Pattern

Every workspace table is guarded by Row Level Security policies verifying membership:

```sql
ALTER TABLE target_accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can access target_accounts within their workspace"
ON target_accounts
FOR ALL
USING (
  workspace_id IN (
    SELECT workspace_id 
    FROM workspace_members 
    WHERE user_id = auth.uid()
  )
);
```
