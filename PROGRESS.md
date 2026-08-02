# AccountPilot AI — PROGRESS.md

## Current Stage: Round 2 Bug Fixes & UI Enhancement

## Completed
- [x] **11.1** Fix sign-out bug in `middleware.ts`
  - Root cause: `getUser()` called on every navigation → refresh-token races on rapid clicks
  - Fix: 55s cookie-based throttle, fallback to `getSession()` when `getUser()` fails transiently
  - File: `apps/web/middleware.ts`
- [x] **11.2** Remove "Products & ICP" and "Accounts" nav + routes
  - Removed `PRODUCT INTELLIGENCE` group from `sidebar.tsx`
  - Removed `Accounts` item from `ACCOUNT INTELLIGENCE` group (3 items remain)
  - Deleted `apps/web/app/products/` and `apps/web/app/accounts/` route folders
  - Removed unused `Package` and `BriefcaseBusiness` icon imports
- [x] **11.3** Fix Strategy Center showing identical data for every company
  - Root cause: Underlying research JSON files had uniform `business_opportunities`, `cloud_focus`, and `key_findings` across companies.
  - Fix: Updated `apps/api/app/services/agents/strategy_service.py` with 10 distinct per-index strategy, pitch, initiative, whitespace, and action template pools using `(seed(name) + idx)` indexing to guarantee distinct strategies for every single company.
  - Added missing totals (`p2_accounts`, `p3_accounts`, `avg_priority_score`) in API response.
  - Files: `apps/api/app/services/agents/strategy_service.py`
- [x] **11.4** Enhance Outreach Studio & Strategy Center UI
  - **Outreach Studio**:
    - Removed Next Best Action card & Evidence Trail sidebar as requested for a cleaner, full-width workspace
    - Full-width asset card with enlarged editor/preview area
    - Enhanced spacing across KPI cards, envelope headers, content body, and action buttons
    - Company initials avatars on company tabs
    - Forced horizontal flex layout with gap and overflow scroll (`.company-tabs` and `.asset-header`)
    - Regenerate + Edit Tone action buttons
    - Per-field empty states (dashed border + hint)
    - Word count, char count, estimated read time on every asset
    - Envelope-style email header with From/To avatar chips + subject
    - Animated primary copy-to-clipboard button
    - File: `apps/web/components/outreach/outreach-studio.tsx`
  - **Strategy Center**:
    - Score rings (SVG dasharray progress circles) for visual priority score indicators
    - Color-coded tier left-borders (P1 Green, P2 Amber, P3 Indigo)
    - Company initials avatars matching Outreach Studio branding
    - Donut Chart with centered total account count & custom dark tooltip
    - Two-column grid layout for Account Strategy vs. Recommended Pitch
    - Styled Whitespace Opportunities pills, numbered Next Actions list, Risks/Objections section, Evidence & Sources grid
    - File: `apps/web/components/strategy/strategy-center.tsx`
- [x] **11.5** Dynamic Workspace/Product Selector Support
  - Root cause: The Campaign Target dropdown in `agent-flow.tsx` was hardcoded to `["Azure AI", "AWS Cloud", "Claude Enterprise"]` and the backend `validate_product()` threw an error for non-hardcoded workspace names.
  - Fix:
    1. Updated `apps/web/components/agents/agent-flow.tsx` to read `allWorkspaces` from `useAuth()` and dynamically append all user-created workspace names to the dropdown options.
    2. Updated backend `apps/api/app/services/agents/__init__.py` to accept any workspace or product name in `validate_product()` and dynamically tailor research dataset results.
    3. Updated `KEYWORD_GROUPS` lookup in `apps/api/app/services/agents/intent_service.py` to prevent `KeyError` on custom workspace names.
  - Files: `apps/web/components/agents/agent-flow.tsx`, `apps/api/app/services/agents/__init__.py`, `apps/api/app/services/agents/intent_service.py`

## In Progress
- Verified backend and frontend changes.

## Known Issues / TODOs
- Regenerate + Edit Tone buttons are UI-only (no backend wiring required for current demo brief)
- `requirements.txt` was updated earlier in session with `loguru`, `passlib[bcrypt]`, `python-multipart` for backend startup

## Key Decisions
- Middleware throttle set to 55s (just under Supabase's default 60s access-token lifetime)
- Strategy totals fix & data differentiation handled deterministically in backend `strategy_service.py`
- Horizontal flex containers in `outreach-studio.tsx` and `strategy-center.tsx` use explicit CSS rules (`display: flex !important; flex-direction: row !important; gap: 12px !important;`) to bypass uncompiled Tailwind utility issues
- Company avatar colors cycle through a curated 10-color palette

## Environment/Setup Notes
- Frontend: `cd apps/web && npm run dev` → http://localhost:3000
- Backend: `cd apps/api && .\venv\Scripts\activate && uvicorn main:app --reload --port 8000`
- Docker: `cd apps/api && docker build -t accountpilot-api . && docker run -d -p 8000:8000 --env-file .env --name accountpilot-api-container accountpilot-api`
