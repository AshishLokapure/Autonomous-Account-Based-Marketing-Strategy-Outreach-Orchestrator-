# AccountPilot AI — Deployment & Setup Guide

## 1. Prerequisites & System Requirements

### Minimum Software Requirements
- **Python**: 3.11 or higher
- **Node.js**: v18.17.0 or higher (pnpm package manager recommended)
- **Database**: PostgreSQL 15+ with `pgvector` extension (or Supabase Cloud Project)
- **Cache & Queue**: Redis v7.0+
- **Docker**: Docker Engine v24.0+ & Docker Compose v2.20+

---

## 2. Environment Variables Configuration

Create an `.env` file inside `apps/api/`:

```env
# Application Settings
ENVIRONMENT=production
DEBUG=false
SECRET_KEY=your_super_secret_jwt_key_here

# Supabase Integration
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key

# Database Connection (Direct or Supabase Transaction Pooler)
DATABASE_URL=postgresql://postgres.xxx:password@aws-0-us-east-1.pooler.supabase.com:6543/postgres

# Redis & Celery
REDIS_URL=redis://localhost:6379/0

# LLM & Embedding Providers
OPENAI_API_KEY=sk-proj-your-openai-api-key
OPENAI_MODEL=gpt-4o
EMBEDDING_MODEL=text-embedding-3-large
```

---

## 3. Local Development Setup

### 3.1 Backend FastAPI Setup (`apps/api`)

```bash
cd apps/api

# Create & activate virtual environment
python -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Run database migrations
alembic upgrade head

# Start development API server
uvicorn app.main:app --reload --port 8000
```

### 3.2 Celery Worker Setup

In a separate terminal window:

```bash
cd apps/api
source .venv/bin/activate
celery -A app.core.celery_app worker --loglevel=info
```

### 3.3 Frontend Web Setup (`apps/web`)

```bash
cd apps/web
pnpm install
pnpm dev
```

---

## 4. Production Deployment with Docker Compose

A production `docker-compose.yml` configuration is provided in the repository root:

```yaml
version: '3.8'

services:
  api:
    build:
      context: ./apps/api
      dockerfile: Dockerfile
    command: uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 4
    ports:
      - "8000:8000"
    env_file:
      - ./apps/api/.env
    depends_on:
      - redis

  worker:
    build:
      context: ./apps/api
      dockerfile: Dockerfile
    command: celery -A app.core.celery_app worker --loglevel=info -c 4
    env_file:
      - ./apps/api/.env
    depends_on:
      - redis

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
```

To deploy using Docker Compose:

```bash
docker-compose up -d --build
```

---

## 5. Database Schema Initialization (Supabase)

Run the SQL migration scripts in order against your Supabase project:
1. `supabase/migrations/001_core_schema.sql` (Creates core tables & RLS policies)
2. Enable `pgvector` extension: `CREATE EXTENSION IF NOT EXISTS vector;`
3. Execute function definition for `hybrid_match_chunks` in the Supabase SQL Editor.
