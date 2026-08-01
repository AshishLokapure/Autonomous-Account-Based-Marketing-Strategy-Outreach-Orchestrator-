# AccountPilot AI — Engineering Rules

## Use

- Use TypeScript for all frontend application code and Python typing for backend code.
- Use Next.js App Router and favor Server Components; introduce Client Components only for required interaction.
- Build reusable, accessible components with clear props and semantic HTML.
- Use Lucide React for icons and existing shared UI patterns before adding dependencies.
- Use validated schemas at all API boundaries and structured outputs for AI-agent results.
- Return evidence, confidence, and source metadata with every AI recommendation.
- Keep configuration in environment variables and provide safe `.env.example` entries only.
- Add focused tests when backend logic or user-visible behavior is introduced.

## Avoid

- Do not invent customer facts, citations, contacts, metrics, or company events.
- Do not render AI output as factual when it lacks a supporting source.
- Do not place API keys, customer data, or credentials in the repository or browser bundle.
- Do not use `any`, untyped JSON flows, or hidden cross-feature coupling.
- Do not add large UI libraries when existing components and CSS satisfy the need.
- Do not use generic placeholder UI in production screens; use realistic but clearly dummy enterprise data until integration exists.
- Do not silently swallow errors. Show an actionable user message, preserve diagnostics in logs, and provide retry paths where appropriate.
- Do not modify unrelated files or replace user-authored work without explicit direction.

## Error Handling

- APIs must return consistent typed error payloads with safe user-facing messages.
- Background jobs must record failure context, retry policy, and final status.
- UI loading, empty, error, and success states must be intentional and accessible.
- AI failures must never fabricate a fallback answer; report insufficient evidence instead.
