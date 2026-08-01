# 🚀 AccountPilot AI

<div align="center">

### Autonomous Account-Based Marketing Strategy & Outreach Orchestrator

**An Enterprise-Grade Multi-Agent AI Platform for Intelligent Account-Based Marketing (ABM), Sales Intelligence, and Personalized Customer Outreach.**

---

![Next.js](https://img.shields.io/badge/Next.js-15-black?style=for-the-badge&logo=next.js)
![FastAPI](https://img.shields.io/badge/FastAPI-0.115-009688?style=for-the-badge&logo=fastapi)
![Python](https://img.shields.io/badge/Python-3.12-blue?style=for-the-badge&logo=python)
![LangGraph](https://img.shields.io/badge/LangGraph-Agentic_AI-purple?style=for-the-badge)
![OpenAI](https://img.shields.io/badge/OpenAI-GPT--5-green?style=for-the-badge)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-blue?style=for-the-badge&logo=postgresql)
![Docker](https://img.shields.io/badge/Docker-Containerized-blue?style=for-the-badge&logo=docker)
![AWS](https://img.shields.io/badge/AWS-Cloud-orange?style=for-the-badge&logo=amazonaws)

</div>

---

# 📌 Overview

AccountPilot AI is an **Agentic AI-powered Account-Based Marketing (ABM) Platform** that autonomously researches enterprise accounts, identifies buying intent, maps stakeholders, generates personalized outreach, and recommends next-best sales actions.

The platform consolidates fragmented customer intelligence from:

- CRM Systems
- Emails
- Meeting Transcripts
- Company Websites
- News Articles
- Internal Documents
- Sales Notes

into a **single intelligent account view** powered by **Retrieval-Augmented Generation (RAG)** and **Multi-Agent AI**.

---

# 🎯 Problem Statement

Enterprise sales teams struggle because customer information is scattered across multiple systems.

Sales representatives often waste hours searching through:

- CRM records
- Email conversations
- Meeting notes
- Internal documents
- Company websites
- Market news

This results in:

- Generic outreach
- Poor account prioritization
- Weak stakeholder mapping
- Missed buying signals
- Outdated account plans
- Low conversion rates

AccountPilot AI solves this by providing **AI-generated, evidence-backed account intelligence** and personalized sales strategies.

---

# ✨ Key Features

## 🔍 AI Research

- CRM Intelligence
- Website Analysis
- News Monitoring
- Company Research
- Technology Stack Detection
- Competitor Analysis

---

## 👥 Stakeholder Mapping

Automatically identifies

- Decision Makers
- Champions
- Influencers
- Procurement Teams
- Finance Teams
- Legal Teams
- Missing Personas

---

## 📈 Buying Intent Detection

Detects signals such as

- Pricing Requests
- Multiple Meetings
- Funding Announcements
- Hiring Trends
- Leadership Changes
- Competitor Mentions
- Security Discussions
- Cloud Migration Plans

---

## 🎯 Strategy Generation

AI automatically recommends

- Pain Points
- Business Goals
- Opportunity Score
- Whitespace Opportunities
- Competitive Positioning
- Sales Strategy
- Channel Strategy
- Next Best Action

---

## ✉ Personalized Outreach

Generate

- Executive Emails
- LinkedIn Messages
- Cold Outreach
- Call Scripts
- Meeting Agendas
- Proposal Summaries

---

## ✅ AI Verification

Every AI recommendation is verified against retrieved evidence.

Unsupported claims are automatically removed.

---

## 📊 Executive Dashboard

Professional dashboards including

- Account Health
- Intent Score
- Opportunity Score
- Relationship Score
- Revenue Pipeline
- Buying Signals
- Stakeholder Graph
- Timeline
- AI Recommendations

---

# 🤖 Multi-Agent Architecture

The system consists of six specialized AI agents.

```
User
   │
   ▼
Research Agent
   │
   ▼
Stakeholder Agent
   │
   ▼
Intent Agent
   │
   ▼
Strategy Agent
   │
   ▼
Outreach Agent
   │
   ▼
Verification Agent
   │
   ▼
Final Account Strategy
```

---

## 🧠 Research Agent

Collects and consolidates

- CRM
- Websites
- Emails
- Meeting Transcripts
- Internal Documents
- News

---

## 👥 Stakeholder Agent

Identifies

- Decision Makers
- Champions
- Influencers
- Budget Owners
- Procurement
- Legal

---

## 📊 Intent Agent

Detects

- Buying Signals
- Urgency
- Objections
- Customer Intent
- Opportunity Score

---

## 🎯 Strategy Agent

Generates

- Sales Strategy
- Messaging
- Pitch Angle
- Competitive Positioning
- Next Best Actions

---

## 📨 Outreach Agent

Creates

- Personalized Emails
- LinkedIn Messages
- Call Scripts
- Executive Summaries

---

## 🛡 Verification Agent

Ensures

- No Hallucinations
- Evidence-backed Recommendations
- Source Verification
- Confidence Scores

---

# 🏗 System Architecture

```
                        Users
                           │
                           ▼
                    Next.js Frontend
                           │
                           ▼
                    FastAPI Backend
                           │
             LangGraph Agent Orchestrator
                           │
    ┌──────────┬──────────┬──────────┬──────────┐
    ▼          ▼          ▼          ▼          ▼
Research   Stakeholder   Intent   Strategy   Verification
 Agent       Agent       Agent      Agent        Agent
                           │
                           ▼
                    RAG Pipeline
                           │
       ┌───────────────────┴────────────────────┐
       ▼                                        ▼
 PostgreSQL                              Qdrant Vector DB
       │                                        │
       └───────────────────┬────────────────────┘
                           ▼
                    GPT-5 / Azure OpenAI
```

---

# 🛠 Technology Stack

## Frontend

- Next.js 15
- TypeScript
- Tailwind CSS
- shadcn/ui
- Framer Motion
- Recharts
- Zustand

---

## Backend

- FastAPI
- Python 3.12
- SQLAlchemy
- Pydantic
- JWT Authentication
- Redis
- Celery

---

## Artificial Intelligence

- LangGraph
- LangChain
- GPT-5
- OpenAI Embeddings
- Tavily Search API

---

## RAG

- Qdrant
- Hybrid Search
- Semantic Search
- Metadata Filtering

---

## Database

- PostgreSQL
- Redis

---

## Cloud

- Docker
- AWS ECS
- AWS RDS
- AWS S3
- AWS ECR
- GitHub Actions

---

# 📂 Project Structure

```
accountpilot-ai/

apps/
    web/
    api/
    worker/

packages/
    ui/
    utils/
    types/
    prompts/

datasets/

docs/

infrastructure/

scripts/
```

---

# 🚀 Getting Started

Clone Repository

```bash
git clone https://github.com/yourusername/accountpilot-ai.git
```

Install Dependencies

```bash
pnpm install
```

Create Environment File

```bash
cp .env.example .env
```

Run Docker

```bash
docker compose up --build
```

Frontend

```
http://localhost:3000
```

Backend

```
http://localhost:8000
```

Swagger

```
http://localhost:8000/docs
```

---

# 📊 Dashboard Modules

- Executive Dashboard
- Account Intelligence
- Research Center
- Stakeholder Mapping
- Intent Signals
- Strategy Center
- Outreach Studio
- Analytics
- AI Chat
- Agent Monitor
- Notifications
- Settings

---

# 🔒 Security

- JWT Authentication
- OAuth Login
- RBAC
- Secure API Keys
- HTTPS Ready
- Environment Variables
- AWS Secrets Manager

---

# 📈 Future Roadmap

- Salesforce Integration
- HubSpot Integration
- Microsoft Dynamics Integration
- Gmail Integration
- Outlook Integration
- Zoom Integration
- Microsoft Teams Integration
- Slack Integration
- Salesforce Einstein Support
- Predictive Revenue Forecasting
- Voice AI Sales Assistant
- Autonomous Meeting Scheduling
- Multi-Language Support

---

# 👨‍💻 Development Team

| Role | Responsibility |
|------|----------------|
| AI/ML Engineer | Multi-Agent AI, RAG, LLM |
| Backend Engineer | APIs, Database, Authentication |
| Frontend Engineer | Dashboard, UI/UX |
| DevOps Engineer | Docker, AWS, CI/CD |
| QA Engineer | Testing & Validation |

---

# 📜 License

This project is licensed under the **MIT License**.

---

# ⭐ Acknowledgements

Built using

- OpenAI
- LangGraph
- LangChain
- Next.js
- FastAPI
- PostgreSQL
- Qdrant
- Docker
- AWS

---

<div align="center">

### ⭐ If you like this project, don't forget to star the repository!

**Built with ❤️ using Agentic AI**

</div>