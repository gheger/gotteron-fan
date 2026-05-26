---
name: "gotteron.fan Feature"
description: "Implement a gotteron.fan feature while preserving map-first UI, locality aggregation, privacy, and Next.js architecture"
argument-hint: "Feature or user story to implement"
agent: "agent"
model: "GPT-5 (copilot)"
---
Implement the requested feature for gotteron.fan.

Project requirements to preserve:
- The app is a public fan map for Fribourg-Gotteron.
- The public UI must show aggregated supporter counts by locality only.
- Never render individual fan markers.
- Locality geometry should remain suitable for official Swiss geodata integration.
- Secrets and server-only logic must stay off the client.

Architecture rules:
- Use Next.js App Router patterns.
- Keep frontend components in `src/components`.
- Keep shared utilities in `src/lib`.
- Keep server-only code in `src/server`.
- Keep API routes under `src/app/api`.
- Use TypeScript with explicit types.
- Use Zod for write-path validation.
- Use Prisma for non-geometry models.
- Keep PostGIS-specific schema work in raw SQL migrations.

Implementation expectations:
- Start from the smallest relevant files and avoid broad rewrites.
- Fix the feature at the owning layer instead of patching symptoms.
- Keep the UI mobile-friendly and map-first.
- Preserve privacy constraints around exact location and request metadata.
- If the feature touches fan-log writes, keep `locality_fan_counts` as the aggregation source.
- If the feature needs placeholder behavior, mark it clearly and isolate it cleanly.

Validation expectations:
- Run the narrowest meaningful validation after edits.
- Prefer targeted lint, type, build, or route-level validation over diff-only checks.
- Report what was validated and any blockers that remain.

In the final response:
- Summarize the implemented feature briefly.
- Mention the main files changed.
- Mention validation performed.
- Call out any remaining prerequisite for full end-to-end behavior.
