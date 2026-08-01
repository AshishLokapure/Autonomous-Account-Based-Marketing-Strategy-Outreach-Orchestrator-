# AccountPilot AI — Architecture

## System Flow

```text
CRM / Email / Meetings / Websites / News / Documents
                         ↓
                Ingestion and normalization
                         ↓
      PostgreSQL + vector store + source metadata
                         ↓
 Research → Stakeholder → Intent → Strategy → Outreach
                         ↓
               Verification and citation guardrail
                         ↓
          FastAPI API → Next.js enterprise workspace
```

## Technology Stack

| Layer | Technology |
| --- | --- |
| Web application | Next.js App Router, React, TypeScript |
| Styling | Tailwind CSS plus the shared application stylesheet |
| UI icons | Lucide React |
| API | FastAPI and Python |
| Asynchronous work | Celery workers with Redis |
| Relational data | PostgreSQL |
| Retrieval | pgvector, Qdrant, or comparable vector store |
| AI orchestration | LangGraph or CrewAI |
| LLM | OpenAI, Claude, or local Llama model behind a provider interface |
| Deployment | Docker, with future ECS/Kubernetes infrastructure |

## Repository Layout

```text
apps/
  web/                  Next.js product workspace
  api/                  FastAPI API service (planned)
  worker/               Celery task workers (planned)
packages/
  ui/ types/ utils/ config/ prompts/  Shared packages (planned)
infrastructure/
  docker/ kubernetes/ terraform/ nginx/  Deployment assets (planned)
docs/ scripts/ datasets/                 Supporting material (planned)
```

## Web Application Layout

```text
apps/web/
  app/                  Routes and global styles
  components/
    layout/              Sidebar and app shell
    dashboard/           Dashboard composition
    common/              Reusable feature-page composition
    account/ research/ stakeholder/ strategy/ outreach/
    analytics/ agents/ charts/ tables/ timeline/ ui/
  hooks/ lib/ services/ stores/ providers/ styles/ types/ constants/
  public/
```

## Data and AI Design Principles

- Store source provenance, timestamps, and document identifiers with extracted facts.
- Require an evidence retrieval step before strategy or outreach generation.
- Give each agent a constrained responsibility and typed input/output schema.
- Pass only verified claims into the content generator.
- Log agent run status, confidence, source coverage, and unsupported-claim rejections.
