# Research Agent

## Overview

The **Research Agent** is the first and most critical AI agent in the AccountPilot AI platform.

Its primary responsibility is to collect, consolidate, and validate all available information about a target company before any downstream AI reasoning begins.

Unlike other agents, the Research Agent **does not generate recommendations, strategies, or outreach content.**

Its sole responsibility is to produce a **fact-based, evidence-backed company profile** that becomes the foundation for all subsequent AI agents.

The quality of every other agent depends directly on the quality of the Research Agent's output.

---

# Purpose

The Research Agent answers one simple question:

> **"What do we know about this company based on available evidence?"**

It gathers information from multiple structured and unstructured sources and produces a unified research report.

---

# Responsibilities

The Research Agent is responsible for:

- Collecting company information
- Reading CRM records
- Reading uploaded documents
- Reading meeting transcripts
- Reading previous emails
- Searching the company website
- Retrieving recent company news
- Understanding technologies used
- Understanding business initiatives
- Identifying competitors
- Identifying AI initiatives
- Collecting evidence for every fact
- Returning structured research output

The Research Agent **must never**

- Generate sales strategies
- Recommend products
- Write emails
- Calculate buying intent
- Identify stakeholders
- Guess information
- Hallucinate facts

Those responsibilities belong to downstream agents.

---

# Position in the AI Pipeline

```
Campaign Created
        │
        ▼
Research Agent
        │
        ▼
Stakeholder Agent
        ▼
Intent Agent
        ▼
Pain Point Agent
        ▼
Strategy Agent
        ▼
Outreach Agent
        ▼
Verification Agent
```

The Research Agent is always executed first.

---

# Input

The Research Agent receives

```json
{
    "campaign_id":"123",
    "organization_id":"001",
    "account_id":"INFY001",
    "company_name":"Infosys"
}
```

---

# Data Sources

The Research Agent gathers information from multiple sources.

## 1. PostgreSQL

Reads

- Accounts
- Contacts
- Activities
- Previous Meetings
- Previous Emails
- Opportunities
- Previous AI Analysis

Purpose

Retrieve historical CRM information.

---

## 2. Qdrant Vector Database

Searches

- Meeting Notes
- PDF Documents
- CRM Notes
- Uploaded Files
- Previous Proposals
- Internal Knowledge Base

Purpose

Retrieve semantically relevant information.

---

## 3. Company Website

Collects

- About Us
- Products
- Services
- Leadership
- AI Initiatives
- Careers
- Press Releases
- Technology Stack

Purpose

Understand the company's current business.

---

## 4. News

Retrieves

- Recent Announcements
- Acquisitions
- Partnerships
- Product Launches
- AI Investments
- Funding
- Expansion

Purpose

Identify recent business activities.

---

## 5. Uploaded Documents

Processes

- Proposal PDFs
- Requirement Documents
- Architecture Documents
- Meeting Minutes
- Presentations
- Sales Notes

Purpose

Extract internal account intelligence.

---

# Tools Used

The Research Agent is an LLM enhanced with tools.

## PostgreSQL Tool

Responsibilities

- Fetch Account
- Fetch Contacts
- Fetch Activities
- Fetch CRM Notes

Technology

- SQLAlchemy
- Supabase PostgreSQL

---

## Website Tool

Responsibilities

- Scrape Company Website
- Extract Public Information

Technology

- BeautifulSoup
- Requests
- Playwright

---

## News Tool

Responsibilities

Retrieve recent company news.

Technology

- Tavily API

---

## Vector Search Tool

Responsibilities

Semantic retrieval from uploaded documents.

Technology

- LangChain
- Qdrant

---

## LLM

Responsibilities

Analyze retrieved information.

Technology

- GPT-5

---

# Technology Stack

| Component | Technology |
|------------|------------|
| Framework | LangGraph |
| LLM | GPT-5 |
| Prompt Management | LangChain |
| Database | Supabase PostgreSQL |
| Vector Database | Qdrant |
| News Search | Tavily API |
| Website Scraping | BeautifulSoup / Playwright |
| Validation | Pydantic |
| Backend | FastAPI |

---

# Internal Workflow

```
Receive Company

        │

        ▼

Load CRM Records

        │

        ▼

Retrieve Documents

        │

        ▼

Search Website

        │

        ▼

Retrieve News

        │

        ▼

Merge Context

        │

        ▼

Send Context to GPT-5

        │

        ▼

Validate Output

        │

        ▼

Return Structured Research
```

---

# Agent Prompt

The system prompt should instruct the model to:

- Only use retrieved information
- Never invent facts
- Never recommend products
- Never calculate intent
- Return structured JSON
- Cite evidence wherever possible

---

# Output

The Research Agent returns structured data.

Example

```json
{
  "company_name":"Infosys",

  "industry":"IT Services",

  "headquarters":"Bangalore",

  "employee_count":340000,

  "technologies":[
      "AWS",
      "Azure"
  ],

  "products":[
      "Consulting",
      "Cloud",
      "AI"
  ],

  "recent_news":[
      "Launched AI Innovation Center"
  ],

  "ai_initiatives":[
      "Enterprise AI"
  ],

  "documents_used":[
      "Meeting_12_July.pdf",
      "Proposal.pdf"
  ],

  "sources":[
      "Website",
      "CRM",
      "News",
      "Meeting Transcript"
  ]
}
```

---

# Shared State Update

The Research Agent only updates

```python
state["research"]
```

It never modifies

- Stakeholders
- Intent
- Strategy
- Outreach

This separation of responsibilities keeps the agent modular.

---

# Evaluation Criteria

The Research Agent is mainly responsible for:

✅ Data Grounding

Every fact must originate from

- CRM
- Website
- News
- Documents
- Meeting Notes

---

It also contributes to

✅ Explainability

Every fact includes its source.

Example

```
AI Initiative

Source

Website

Confidence

98%
```

---

# Error Handling

If no information is found

Return

```json
{
    "status":"insufficient_data"
}
```

Do not generate assumptions.

---

# Performance Goals

Execution Time

5–15 seconds

Maximum Tokens

Configurable

Parallel Retrieval

Enabled

Caching

Enabled

---

# Best Practices

✔ Always retrieve before generating

✔ Never hallucinate

✔ Always cite evidence

✔ Return structured JSON

✔ Separate retrieval from reasoning

✔ Keep prompts deterministic

✔ Validate output using Pydantic

✔ Log execution details

---

# Folder Structure

```
agents/

research/

├── agent.py
├── prompt.py
├── tools.py
├── schema.py
├── parser.py
├── state.py
└── README.md
```

---

# Future Improvements

- Support live CRM integrations
- Support Salesforce API
- Support Microsoft Graph
- Support SharePoint
- Support Google Drive
- Support Slack knowledge retrieval
- Support multi-language research
- Add confidence scoring per fact
- Add citation hyperlinks
- Add research caching

---

# Summary

The Research Agent is the foundation of the AccountPilot AI platform.

It transforms scattered enterprise data into a structured, evidence-backed company profile that downstream agents use for stakeholder discovery, buying intent analysis, sales strategy generation, personalized outreach, and verification.

Its success is measured not by creativity, but by **accuracy, completeness, traceability, and data grounding**.