---
name: "gotteron.fan Review"
description: "Review gotteron.fan changes for correctness, privacy, security, scalability, and App Router architecture"
argument-hint: "PR, diff, feature, or files to review"
agent: "agent"
model: "GPT-5 (copilot)"
---
Review the current changes for gotteron.fan.

Treat this as a code review, not a rewrite.

Primary review focus:
- TypeScript correctness and runtime safety
- Next.js App Router conventions
- server/client component separation
- security issues
- privacy issues
- database scalability and transaction correctness
- map rendering performance
- whether fan logs remain aggregated by locality only
- whether secrets stay server-side
- whether PostGIS and Prisma responsibilities stay separated correctly

Project constraints to enforce:
- Never expose raw IP addresses.
- Never render individual fan markers.
- Always aggregate counts by locality.
- Keep frontend code in `src/components`.
- Keep server-only code in `src/server`.
- Keep API routes in `src/app/api`.
- Use Zod for write validation.
- Use transactions when inserting fan logs and updating `locality_fan_counts`.

Output format:
1. Findings first, ordered by severity.
2. For each finding, include file references and explain the concrete risk.
3. Call out missing tests or missing validation when relevant.
4. If no findings exist, say that explicitly.
5. End with brief residual risks or open questions only.

Do not spend space on praise. Stay concrete and technical.
