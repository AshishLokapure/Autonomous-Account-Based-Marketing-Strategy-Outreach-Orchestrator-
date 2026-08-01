# AccountPilot AI — API Reference

## 1. Overview & Base URL

The AccountPilot AI API is built with **FastAPI**. All API routes are versioned under `/api/v1`.

- **Base URL**: `http://localhost:8000/api/v1` (Development) / `https://api.accountpilot.ai/api/v1` (Production)
- **Authentication**: Bearer Token in HTTP Authorization Header (`Authorization: Bearer <SUPABASE_JWT_TOKEN>`)
- **Content Type**: `application/json`

---

## 2. Endpoint Groups

### 2.1 Authentication & Profile (`/api/v1/auth`)

| Method | Endpoint | Description | Auth Required |
| --- | --- | --- | --- |
| `GET` | `/auth/me` | Fetch active user profile and workspace permissions | Yes |
| `POST` | `/auth/sync-profile` | Sync Supabase Auth user record to `profiles` table | Yes |

---

### 2.2 Workspaces & Products (`/api/v1/workspaces`, `/api/v1/products`)

| Method | Endpoint | Description | Auth Required |
| --- | --- | --- | --- |
| `GET` | `/workspaces` | List user workspaces | Yes |
| `POST` | `/workspaces` | Create new workspace | Yes |
| `GET` | `/products` | List workspace products | Yes |
| `POST` | `/products` | Create product profile with features/pain points | Yes |
| `GET` | `/products/{id}` | Get detailed product profile & collateral count | Yes |

---

### 2.3 Knowledge Base & Document Management (`/api/v1/documents`)

| Method | Endpoint | Description | Auth Required |
| --- | --- | --- | --- |
| `POST` | `/documents/upload` | Upload collateral file (PDF/Docx) and trigger RAG indexing | Yes |
| `GET` | `/documents` | List uploaded workspace documents | Yes |
| `DELETE`| `/documents/{id}` | Delete document and associated vector chunks | Yes |

#### Request Example: Document Upload (`POST /documents/upload`)
```text
Content-Type: multipart/form-data

file: (binary)
product_id: "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d"
```

---

### 2.4 Target Accounts & Stakeholders (`/api/v1/accounts`)

| Method | Endpoint | Description | Auth Required |
| --- | --- | --- | --- |
| `GET` | `/accounts` | List target accounts with intent scores | Yes |
| `POST` | `/accounts` | Register new target account domain | Yes |
| `GET` | `/accounts/{id}` | Fetch account intelligence & stakeholder map | Yes |
| `GET` | `/accounts/{id}/signals` | List detected intent signals for account | Yes |

---

### 2.5 Agent Pipeline Execution (`/api/v1/agents`)

| Method | Endpoint | Description | Auth Required |
| --- | --- | --- | --- |
| `POST` | `/agents/run` | Trigger full 7-agent ABM pipeline for target account | Yes |
| `GET` | `/agents/status/{run_id}` | Fetch real-time agent execution status & diagnostic logs | Yes |

#### Request Example: Run Agent Pipeline (`POST /agents/run`)
```json
{
  "account_id": "c7a8b9f0-1234-5678-9abc-def012345678",
  "product_id": "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
  "playbook_override": null
}
```

#### Response Example (`POST /agents/run`)
```json
{
  "run_id": "run-8829-4910-abcd",
  "status": "QUEUED",
  "message": "Multi-agent pipeline execution started.",
  "estimated_duration_seconds": 45
}
```

---

### 2.6 Outreach & Campaign Management (`/api/v1/campaigns`)

| Method | Endpoint | Description | Auth Required |
| --- | --- | --- | --- |
| `GET` | `/campaigns/{id}/messages` | List generated outreach messages with citations | Yes |
| `PUT` | `/messages/{id}` | Update/edit outreach copy | Yes |
| `POST` | `/messages/{id}/reverify` | Re-trigger Verification Agent check on edited copy | Yes |
