# gotteron.fan Copilot Instructions

We are building gotteron.fan, a public fan map for the Swiss ice hockey club Fribourg-Gottéron.

## Product goal

The app lets fans register themselves as fans from a Swiss locality. The map shows aggregated fan counts per locality, not individual positions.

## Core requirements

- Interactive map centered initially on the canton of Fribourg.
- Locality-level granularity, not commune-level.
- Locality polygons should come from official Swiss geodata.
- Users can select a locality and submit a fan log.
- Fan log fields:
  - pseudo, required
  - anecdote, optional
  - remark, optional
- Add captcha protection.
- Expect up to 1 million fan logs.
- Never render individual fan markers.
- Always aggregate fan logs by locality.

## Technical stack

- Next.js App Router
- TypeScript
- Tailwind CSS
- MapLibre GL JS
- PostgreSQL + PostGIS
- Prisma for non-geometry models
- Raw SQL migrations for PostGIS geometry
- Zod for validation
- Cloudflare Turnstile for captcha

## Architecture rules

- Keep frontend components in `src/components`.
- Keep shared utilities in `src/lib`.
- Keep server-only code in `src/server`.
- Keep API routes under `src/app/api`.
- Do not put secrets in client components.
- Use server-side validation for all write operations.
- Use transactions when inserting fan logs and updating fan counts.
- Store aggregated counts in `locality_fan_counts`.
- Use indexes for all foreign keys and geospatial lookups.

## Privacy rules

- Do not store exact user location.
- Users only register by selected locality.
- Do not expose raw IP addresses.
- If IP-based rate limiting is needed, hash the IP.
- Public map only shows aggregate counts.

## UI style

- Clean, simple, mobile-friendly.
- Fribourg-Gottéron-inspired colors, but avoid overdoing it.
- Map should be the primary interface.
- Side panel should show selected locality, fan count, and fan log form.

## Coding style

- Prefer small, focused components.
- Prefer explicit TypeScript types.
- Use Zod schemas for API inputs.
- Add helpful comments only where logic is non-obvious.
- Do not over-engineer the MVP.
