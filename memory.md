# AccountPilot AI — Project Memory

Last updated: 2026-08-01

## Project Context

AccountPilot AI is an AI-powered Account-Based Marketing platform. It unifies account data, detects stakeholders and buying intent, recommends account strategy, drafts personalized outreach, and prevents hallucinations through evidence-grounded verification.

## Completed

- Created the `apps/web` Next.js App Router frontend scaffold with TypeScript.
- Added all requested frontend route folders and pages:
  - Auth: `/login`, `/register`, `/forgot-password`
  - Product: `/dashboard`, `/accounts`, `/research`, `/stakeholders`, `/intent`, `/strategy`, `/outreach`, `/documents`, `/analytics`, `/agent-monitor`, `/notifications`, `/settings`
- Implemented a premium enterprise dashboard with sidebar navigation, top bar, metric cards, revenue pipeline visualization, AI recommendations, funnel, account list, and activity feed.
- Implemented a reusable `FeaturePage` composition for the non-dashboard product routes, using realistic dummy enterprise data.
- Added base app styling, responsive behavior, Lucide icons, Next.js configuration, Tailwind configuration, and package dependencies.
- Installed web dependencies and successfully ran `npm run build` in `apps/web`.

## Important Files

- `apps/web/app/globals.css` — shared visual tokens and global dashboard styles.
- `apps/web/components/layout/app-shell.tsx` — persistent product layout and top navigation.
- `apps/web/components/layout/sidebar.tsx` — primary workspace navigation.
- `apps/web/components/dashboard/dashboard.tsx` — dashboard implementation.
- `apps/web/components/common/feature-page.tsx` — reusable detail page scaffold.
- `apps/web/package.json` — frontend scripts and dependencies.

## Current State

- The frontend runs with `cd apps/web` then `npm run dev` and is available at `http://localhost:3000`.
- `/` redirects to `/dashboard`.
- All screen content currently uses static dummy data; no backend, authentication, persistence, or real integrations are implemented.
- The repository currently contains the web frontend and planning documents only. API, worker, database, packages, and deployment folders remain future work.

## Next Recommended Work

1. Apply the `design.md` visual tokens to `apps/web/app/globals.css` and refine the dashboard with reference screenshots when available.
2. Create the FastAPI backend foundation and account/stakeholder/intent schemas.
3. Define an evidence and citation model before building AI-agent workflows.
4. Replace static frontend data with typed API clients and loading/error/empty states.

## Notes for Future Agents

- Preserve the existing frontend route and component architecture unless there is a specific reason to refactor it.
- Keep AI output evidence-grounded; factual claims must have source metadata.
- A Lovable reference URL was supplied, but it is authenticated and does not expose the actual project UI. Do not claim pixel-level matching without screenshots or public access.
- `npm install` reported three high-severity upstream audit findings. No `npm audit fix --force` was run.
