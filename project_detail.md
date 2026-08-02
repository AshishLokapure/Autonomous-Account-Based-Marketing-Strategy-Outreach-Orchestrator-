# AccountPilot AI — Project Detail (for Claude Code)

> **Read this file only.** Do not scan, grep, or list the rest of the repository tree to "understand the project" — everything you need for a UI refinement task is documented below. Only open the specific component/CSS files you are actually editing.

## Assigned Task Scope

**Round 2 update:** the scope now also includes two functional bug fixes and a navigation cleanup, in addition to UI refinement — see **Section 11** below for the full, code-grounded brief on all four Round 2 items (sign-out bug, nav removal, Strategy Center duplicate-data bug, Outreach Studio enhancement). Everything else in this file (Sections 1–10) still applies as background context.

**You are ONLY authorized to refine UI/visual design**, plus the two specific functional fixes named in Section 11 — nothing else. This means:
- Layout, spacing, color, typography, shadows, borders, radii, responsive behavior, micro-interactions/motion, visual hierarchy, and component styling.
- You may touch: `apps/web/app/globals.css`, `apps/web/app/onboarding/onboarding.module.css`, JSX/TSX className and inline `style={{...}}` props, and Tailwind config if needed for tokens.

**Do NOT touch:**
- Any logic in `apps/api/` (FastAPI backend), `abm-research/` (Python research agent), Supabase migrations (`supabase/migrations/`), auth logic (Supabase calls, JWT, `providers/auth-provider.tsx` logic), state management (`stores/campaign-store.tsx` logic), API service calls (`services/api.ts`), routing behavior, or data models/types.
- Do not rename routes, remove pages, or change what data is displayed — only how it looks.
- Do not add new large dependencies/UI libraries (rule from `rules.md`: prefer existing components/CSS).

---

## 1. What This Product Is

**AccountPilot AI** ("Autonomous Account-Based Marketing Strategy & Outreach Orchestrator") is an enterprise B2B SaaS dashboard concept: an AI-powered Account-Based Marketing (ABM) platform. It's positioned as a decision workspace for enterprise sales/marketing teams — not a consumer app. It has:
- A multi-agent AI backend concept (Research → Stakeholder → Intent → Strategy → Outreach → Verification agents) — **currently backend/agents are partially stubbed/planned; the frontend is the mature, working part.**
- A Next.js frontend with a persistent sidebar + dashboard-style pages, currently running on **static/dummy enterprise data** (no live backend wiring for most pages).

## 2. Current Implementation Status (IMPORTANT — read before styling)

- The frontend (`apps/web/`) is functional and builds successfully (`npm run build` passes per project memory).
- Backend (`apps/api/`), the Python research agent (`abm-research/`), and Supabase integration are separate, partially-built systems **not relevant to a UI-only task**.
- All screen content on non-auth pages currently uses **static dummy data** hard-coded directly in the page/component files (no live API calls for most feature pages).
- **There is a design-system gap you should know about**: the repo contains a target design spec (`design.md`, described in Section 5 below) describing a warm off-white, pink/violet-gradient enterprise aesthetic — but the actual current CSS in `globals.css` implements a **different, older palette**: a dark navy sidebar (`#0f172a`/`#101a31`) with blue (`#2563eb`) accents and a cool light-blue canvas (`#f6f8fc`). The target design tokens in `design.md` have **not yet been applied**. This is a known, explicitly logged gap (see `memory.md`'s "Next Recommended Work").
- When asked to "refine the UI," treat `design.md`'s tokens as the aspirational direction unless the user gives other explicit instructions — but don't assume it silently; if ambiguous, ask or state the assumption.

## 3. Tech Stack (Frontend — the part you'll work in)

- **Next.js 15** (App Router), **React 19**, **TypeScript**
- Styling: **mostly vanilla CSS** in one shared stylesheet (`apps/web/app/globals.css`, class-based, e.g. `.card`, `.sidebar`, `.metric-number`) plus **inline `style={{...}}`** used moderately in several components. **Tailwind CSS is configured but barely used** (`tailwind.config.ts` is a 2-line default config; no meaningful utility classes are applied in components today).
- One CSS Module: `apps/web/app/onboarding/onboarding.module.css` (for the onboarding flow).
- Icons: **Lucide React**
- Charts: **Recharts** (installed, used minimally)
- Animation: **Framer Motion** (installed)
- Fonts: Google Fonts import inside `globals.css` — **DM Sans** (body/interface, 400–700 weight) and **Plus Jakarta Sans** (headings, 500–800 weight).
- No component library like shadcn/ui is actually wired up despite being mentioned in `README.md`'s aspirational tech-stack list — don't assume shadcn primitives exist in code.

## 4. Frontend Structure (`apps/web/`)

```
app/
  layout.tsx              # Root layout: wraps app in AuthProvider + CampaignProvider, imports globals.css
  page.tsx                # "/" redirects to "/login"
  globals.css             # THE shared stylesheet — single source of most visual styling
  (auth)/
    login/page.tsx + template.tsx   # Split-screen login UI, "use client", wired to Supabase auth
    register/page.tsx               # 581-line full registration form (largest single page file)
    forgot-password/page.tsx
    reset-password/page.tsx
  auth/callback/route.ts  # OAuth callback handler (logic only, not UI)
  onboarding/
    page.tsx (220 lines), components.tsx, onboarding.module.css   # Multi-step onboarding wizard
  dashboard/page.tsx      # Thin wrapper -> renders components/dashboard/dashboard.tsx
  accounts/page.tsx       # Thin wrapper -> renders <FeaturePage> with accounts dummy data
  analytics/page.tsx      # Thin wrapper -> <FeaturePage> with analytics dummy data
  documents/page.tsx      # Thin wrapper -> <FeaturePage> with documents dummy data
  notifications/page.tsx  # Thin wrapper -> <FeaturePage> with notifications dummy data
  settings/page.tsx       # Thin wrapper -> <FeaturePage> with settings dummy data
  research/page.tsx       # -> <ResearchCenter /> (custom, richer component, 645 lines)
  stakeholders/page.tsx   # -> <StakeholderCenter /> (custom, 492 lines)
  intent/page.tsx         # -> <IntentCenter /> (inside components/research/intent-center.tsx, 338 lines)
  strategy/page.tsx       # -> <StrategyCenter /> (261 lines)
  outreach/page.tsx       # -> <OutreachStudio /> (363 lines)
  agent-monitor/page.tsx  # -> agent flow visualization (components/agents/agent-flow.tsx, 672 lines — largest component)
  products/page.tsx       # 20 lines, simple

components/
  layout/
    sidebar.tsx (276 lines)     # Persistent left nav — dark navy, collapsible on tablet, hidden on mobile
    app-shell.tsx (96 lines)    # Wraps sidebar + topbar (search, AI status pill, icon buttons) + content area
  dashboard/dashboard.tsx (524 lines)   # Main executive dashboard: metric cards, revenue chart, funnel, AI suggestions, activity feed, accounts table preview
  common/feature-page.tsx (8 lines, single-line JSX)  # Generic reusable template used by 5 of the simpler pages (accounts, analytics, documents, notifications, settings) — renders header, overview card list, next-actions card, a metric card, and an "evidence coverage" funnel card
  research/
    research-center.tsx (645 lines)
    intent-center.tsx (338 lines)
  stakeholder/stakeholder-center.tsx (492 lines)
  strategy/strategy-center.tsx (261 lines)
  outreach/outreach-studio.tsx (363 lines)
  agents/agent-flow.tsx (672 lines)  # Visual agent pipeline (Research→Stakeholder→Intent→Strategy→Outreach→Verification)
  campaign/
    campaign-modal.tsx (381 lines, 58 inline styles — heaviest inline-style user)
    run-campaign-button.tsx (70 lines)
  account/, analytics/, charts/, onboarding/, outreach/, research/, stakeholder/, strategy/, tables/, timeline/, ui/  # mostly EMPTY placeholder dirs (.gitkeep only) — not yet built out

providers/auth-provider.tsx   # Supabase auth context (logic — don't touch)
stores/campaign-store.tsx     # Zustand-less custom context/store for campaign state (logic — don't touch)
lib/                          # supabase.ts, supabase-server.ts, groq-stakeholder.ts, stakeholder-engine.ts, stakeholder-supabase.ts (logic — don't touch)
services/api.ts               # API client (logic — don't touch)
```

**Inline-style-heavy files** (worth knowing before refactoring toward class-based CSS): `campaign-modal.tsx` (58), `stakeholder-center.tsx` (47), `sidebar.tsx` (35), `login/page.tsx` (21), `reset-password/page.tsx` (15), `forgot-password/page.tsx` (15). Most other components rely on `globals.css` classes only.

## 5. Design System — Target Direction (`design.md` in repo root)

This is the **intended** design language (not yet fully applied — see gap noted in Section 2).

**Product personality:** calm, precise, executive, information-rich enterprise decision workspace — not a consumer chatbot or student dashboard.

**Color tokens (target):**
| Token | Value | Usage |
|---|---|---|
| Canvas | `#FCFBF8` | App background |
| Surface | `#FFFFFF` | Cards, popovers, nav |
| Ink | `#242220` | Primary text |
| Muted | `#77736D` | Supporting text |
| Border | `#E8E6E2` | Separators, controls |
| Blue | `#4B73FF` | Info / primary accent |
| Violet | `#8069FF` | AI / active nav accent |
| Pink | `#FF72BA` | Gradient accent |
| Success | `#1E9B65` | Verified / positive states |
| Warning | `#D78427` | Attention states |

**Typography (target):** Interface/body = DM Sans, 15px base. Headings = Plus Jakarta Sans, 700–800 weight, tight negative tracking. Page title 29–32px. Section title 15–18px. Labels/metadata 10–12px, medium–bold. *(Fonts already match current implementation; only the color application differs.)*

**Layout/components (target):** persistent 258px desktop sidebar, 74px collapsed tablet sidebar (this matches current implementation). Off-white canvas with white cards, 13–16px radii, 1px warm borders. 8px spacing increments, 14–20px gaps between cards. Primary actions dark by default; blue/violet/pink gradient accents reserved for AI-specific moments and a floating assistant. Clear focus states, semantic labels.

**Motion (target):** transitions under 250ms. Subtle card lift, color shift, loading shimmer only where it reinforces feedback — avoid busy motion in dense tables/analytics.

## 6. Actual Current Visual Implementation (`apps/web/app/globals.css`)

This is what's **actually live today** — a self-contained, single-file vanilla CSS system (only 23 lines but dense, semicolon-packed). Key facts:

- CSS custom properties defined in `:root`: `--navy:#0f172a; --blue:#2563eb; --teal:#14b8a6; --canvas:#f6f8fc; --line:#e7eaf0; --muted:#64748b; --green:#16a34a; --amber:#d97706;`
- Sidebar is **dark navy** (`#101a31` background, `#0f172a` root navy token), not the off-white/warm target from `design.md`.
- Canvas background is cool light blue-gray `#f6f8fc`, not the warm off-white `#FCFBF8` target.
- Primary accent blue is `#2563eb` (close-ish to target `#4B73FF` but not identical); no violet/pink gradient accents currently implemented anywhere.
- Class-based system: `.app-shell`, `.sidebar`, `.brand`, `.brand-mark`, `.workspace`, `.nav`, `.nav a`, `.nav a.active`, `.sidebar-bottom`, `.profile`, `.avatar`, `.main`, `.topbar`, `.search`, `.icon-button`, `.ai-status`, `.content`, `.eyebrow`, `.page-title`, `.subtle`, `.header-row`, `.primary-button`, `.metrics`, `.card`, `.metric-label`, `.metric-number`, `.trend` (+ `.bad`), `.metric-icon` (+ `.teal/.purple/.orange/.green` variants), `.dashboard-grid`, `.stack`, `.card-title`, `.card-subtitle`, `.chart-head`, `.period`, `.chart-area`, `.chart-bars`, `.bar` (+ `.strong`), `.chart-labels`, `.funnel`, `.funnel-row`, `.funnel-label`, `.funnel-bar`, `.funnel-value`, `.suggestion` (+ icon), `.tag`, `.activity` (+ `.activity-time`, `.dotline`), `.progress`, `.accounts-preview`, `.account-row`, `.account-name`, `.company-icon`, `.pill`, `.score`.
- Responsive breakpoints already exist: `@media(max-width:1100px)` collapses sidebar to 74px icon-only and drops metrics grid to 3 columns; `@media(max-width:680px)` hides sidebar entirely, stacks to mobile layout, shrinks topbar, hides some table columns and status pills.
- Card hover state exists: `.card:hover { box-shadow + translateY(-1px); transition:.25s }`.

**Practical implication for UI work:** Since nearly every page/component composes from this shared class vocabulary (`.card`, `.metric-*`, `.chart-*`, `.activity`, `.funnel-*`, etc.), editing `globals.css` centrally will cascade improvements across almost the whole app (dashboard, all 5 `FeaturePage`-based routes, and partially the custom center components). This is the highest-leverage place to start a visual refresh. Component-specific inline styles (esp. in `sidebar.tsx`, `campaign-modal.tsx`, `stakeholder-center.tsx`) will need separate, targeted edits.

## 7. Engineering Rules to Respect (from `rules.md`)

- Build reusable, accessible components with clear props and semantic HTML.
- Use Lucide React for icons and existing shared UI patterns before adding new dependencies.
- Do not add large UI libraries when existing components/CSS satisfy the need.
- Do not use generic placeholder UI in production screens — keep the realistic dummy enterprise data (companies like Novartis, Airtel Business, Lumen Technologies, etc.) intact; only restyle, don't replace content unless asked.
- Do not modify unrelated files or replace user-authored work without explicit direction.
- Preserve existing frontend route and component architecture unless there's a specific reason to refactor it (per `memory.md`).
- Keep interaction transitions under ~250ms; avoid distracting motion in dense tables/analytics (per `design.md`).

## 8. Suggested Order of Operations for a UI Refinement Pass

1. Decide/confirm with the user whether to (a) fully migrate `globals.css` to the `design.md` warm/off-white + violet-pink-accent token set, or (b) polish the existing navy/blue theme in place, or (c) something else. This is the single biggest visual decision and affects everything downstream.
2. Update root tokens (`:root` custom properties) in `globals.css` first — this alone will ripple through cards, buttons, metrics, etc.
3. Pass over `sidebar.tsx` and `app-shell.tsx` (heaviest chrome, some inline styles) to align with the new tokens.
4. Refine `dashboard.tsx` (largest, highest-visibility page).
5. Refine the shared `feature-page.tsx` template (impacts 5 routes at once: accounts, analytics, documents, notifications, settings).
6. Pass over the bespoke "center" components (research, stakeholder, intent, strategy, outreach, agent-monitor) for consistency with the new system — these have more inline styles and custom layouts.
7. Polish auth pages (login/register/forgot/reset) and onboarding flow last — these already have decent bespoke styling (split-screen login, 581-line register form) and are more isolated from the shared design system.

## 9. Key File Paths Reference (for quick access)

- `apps/web/app/globals.css` — central stylesheet
- `apps/web/app/onboarding/onboarding.module.css` — onboarding-only CSS module
- `apps/web/tailwind.config.ts` — minimal, default config (content globs only, no theme extension yet)
- `apps/web/components/layout/sidebar.tsx`
- `apps/web/components/layout/app-shell.tsx`
- `apps/web/components/dashboard/dashboard.tsx`
- `apps/web/components/common/feature-page.tsx`
- `apps/web/components/research/research-center.tsx`
- `apps/web/components/research/intent-center.tsx`
- `apps/web/components/stakeholder/stakeholder-center.tsx`
- `apps/web/components/strategy/strategy-center.tsx`
- `apps/web/components/outreach/outreach-studio.tsx`
- `apps/web/components/agents/agent-flow.tsx`
- `apps/web/components/campaign/campaign-modal.tsx`
- `apps/web/components/campaign/run-campaign-button.tsx`
- `apps/web/app/(auth)/login/template.tsx` and `page.tsx`
- `apps/web/app/(auth)/register/page.tsx`
- `apps/web/app/(auth)/forgot-password/page.tsx`
- `apps/web/app/(auth)/reset-password/page.tsx`
- `apps/web/app/onboarding/page.tsx` + `components.tsx`

## 11. Round 2 Task Brief (assigned after initial UI scope) — 4 items

Do these four things. Items 11.1 and 11.3 are functional bug fixes (explicitly authorized as an exception to the UI-only rule); 11.2 is a structural nav/route removal; 11.4 is pure UI enhancement.

### 11.1 Fix: user gets signed out frequently / when switching tabs

Root cause investigation (already done — confirmed by reading `apps/web/middleware.ts`): the middleware calls `supabase.auth.getUser()` on essentially every navigation — including client-side `router.push()` calls from the sidebar, since Next.js middleware runs on RSC/navigation requests too, not just hard page loads. This makes a live round-trip to Supabase's auth server to validate/refresh the session **on every single click**. If any of the following are true, the user gets incorrectly treated as logged-out and bounced to `/login`:
- The access token is short-lived and refresh timing races across rapid sequential navigations.
- Cookies aren't propagating consistently between the browser client (`apps/web/lib/supabase.ts`) and the server middleware client (`apps/web/middleware.ts`) — e.g. a cookie name/domain/`sameSite` mismatch, especially once deployed to a real domain vs. `localhost`.
- Supabase's refresh-token rotation invalidates a token that's still mid-flight from a previous, still-resolving concurrent request (a known Supabase gotcha when multiple requests fire close together with the same refresh token).

Fix approach:
- Confirm cookie propagation is consistent between `lib/supabase.ts` and `middleware.ts`.
- Consider debouncing/throttling the middleware's auth check on rapid client-side navigations, or briefly caching a validated session instead of calling `getUser()` fresh on every request.
- Check the Supabase project's JWT expiry / refresh-token settings aren't unusually short.
- Temporarily log whether `user` is actually coming back `null` in middleware during a repro, to confirm the exact failure point before changing anything.
- **Do not delete the `getUser()` call** — the code comment says "IMPORTANT: do not remove" because it's what keeps server-rendered sessions alive. Fix *why* it's failing, don't bypass it.

### 11.2 Remove "Products & ICP" and "Accounts" nav sections

File: `apps/web/components/layout/sidebar.tsx`
- Remove the entire "PRODUCT INTELLIGENCE" nav group — its only item is "Products & ICP" (`href="/products"`).
- Remove just the "Accounts" item (`href="/accounts"`) from the "ACCOUNT INTELLIGENCE" group; **keep** that group's other items (Research Center, Stakeholders, Intent Signals) and keep the group label, since 3 items remain.
- Delete the route folders `apps/web/app/products/` and `apps/web/app/accounts/` entirely.
- Confirmed by a repo-wide search: no other file references `/products` or `/accounts`, so nothing else needs updating. `dashboard.tsx`'s "Priority Accounts" table is a separate, self-contained widget that does not link to the removed `/accounts` route — leave it untouched.

### 11.3 Fix: Strategy Center shows identical data for every company

Confirmed finding: in `apps/web/stores/campaign-store.tsx`, only `agentResults.research` and `agentResults.stakeholder` are ever populated by the campaign timeline — there is currently no code path that sets `agentResults.strategy` or `agentResults.outreach` in this snapshot of the repo. If your working copy has since added that generation step (most likely modeled after the existing per-company loop in `apps/web/lib/groq-stakeholder.ts`, used for stakeholder intel), the "same data for every company" bug is almost certainly one of these classic causes — check for:
- An LLM call made **once, outside** the per-company loop, with its single result spread onto every company object.
- A shared mutable template object reused **by reference** across iterations instead of being freshly created per company — e.g. `companies.map(c => ({...c, ...sharedResult}))` where `sharedResult` was computed a single time before the `.map()`.
- A loop + async closure bug, where a callback captures a stale `company` variable after the loop has already advanced. `groq-stakeholder.ts` avoids this correctly using a sequential `for...of` + `await` loop (with a throttling delay between calls) — mirror that exact pattern for whatever generates strategy/outreach data.
- The LLM prompt not actually being parameterized with company-specific research/stakeholder/intent context, so the model has nothing to differentiate on.

Fix: ensure each company gets its own isolated async generation call fed with that company's specific data, awaited sequentially (matching the existing stakeholder pattern), with the result assigned into a fresh object per company rather than a shared reference.

### 11.4 Enhance Outreach Studio UI

File: `apps/web/components/outreach/outreach-studio.tsx`
Current state: a working three-tab (Email / LinkedIn / Call Script) asset viewer per company, with pill-style company tabs (10 companies), 4 KPI cards, a dark "Next Best Action" card, and an "Evidence Trail" card. Note: this component (along with `strategy-center.tsx`) already uses Tailwind utility classes extensively, unlike most of the rest of the app which relies on the shared `globals.css` class system — keep that in mind so enhancements stay visually consistent with the rest of the app rather than becoming a style island.

Enhancement directions:
- Add per-field loading/empty states — right now a missing field (e.g. `executive_email`) silently renders nothing with no placeholder.
- Add "Regenerate" and "Edit tone" controls near the copy button — this directly matches the PRD's stated requirement to "support editable tone and regeneration."
- Add small company avatar/initials to the company tabs for faster scanning across all 10 companies.
- Improve the email/LinkedIn preview visual treatment — currently plain label rows; consider a proper "envelope"-style header, more prominent subject line, sender/recipient avatar chips.
- Add a character/word count and estimated read time on generated assets.
- Polish micro-interactions: tab-switch transition, copy-button success-state timing/animation, active-tab indicator.
- Keep the dark "Next Best Action" card and "Evidence Trail" card as-is structurally — they're good, on-brand, high-signal elements; refine spacing/typography rather than replace them.
- Reconcile with whichever color-token direction gets chosen from Section 5/6 (design.md target vs. current navy/blue) so this component doesn't end up styled differently from the rest of the app.

## 10. How to Run Locally (for visual verification, not required to understand code)

```bash
cd apps/web
npm install
npm run dev
# -> http://localhost:3000  (redirects to /login)
```
No backend/database is required to view most pages since they use static dummy data — auth pages call Supabase, so full login flow needs Supabase env vars (`.env.example` in `apps/web`/repo root shows required keys), but you can navigate directly to routes like `/dashboard` in dev if middleware allows, or temporarily bypass for visual work per user's direction.
