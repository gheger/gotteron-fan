---
name: "gotteron.fan DB Migration"
description: "Create or update PostgreSQL and PostGIS migrations for gotteron.fan using Prisma plus raw SQL geometry changes"
argument-hint: "Schema change or migration goal"
agent: "agent"
model: "GPT-5 (copilot)"
---
Implement the requested database change for gotteron.fan.

Database rules for this project:
- PostgreSQL + PostGIS
- Prisma for non-geometry models
- Raw SQL migrations for PostGIS geometry and database-specific behavior
- `localities.geom` must remain geometry-based and suitable for locality polygons
- `fan_logs` must reference `localities`
- `locality_fan_counts` stores precomputed aggregate counts

Migration expectations:
- Prefer additive, explicit migrations.
- Add useful indexes for foreign keys, aggregation lookups, and geospatial access.
- Preserve transaction-safe fan-log insertion and count updates.
- Keep privacy requirements intact.
- Do not store exact user location.
- Do not expose raw IP addresses.
- If request metadata is stored for rate limiting, store only hashed values.

Prisma expectations:
- Update `prisma/schema.prisma` only for Prisma-managed model shape.
- Keep PostGIS-specific SQL in raw migration files under `prisma/migrations/`.
- Respect the Prisma 7 setup in this repo, including `prisma.config.ts` for datasource URL configuration.

Validation expectations:
- Validate the Prisma schema.
- Regenerate the Prisma client if the schema changes.
- If possible, validate migration shape or related build steps.
- Call out anything that still requires a running database.

In the final response:
- Summarize the schema change.
- Mention the migration and Prisma files updated.
- Mention what was validated.
- Mention any required follow-up commands such as migrate or generate.
