# gotteron.fan

gotteron.fan is a public fan map for Fribourg-Gotteron supporters.

The app lets users select a Swiss locality, submit a fan log, and view aggregated fan counts by locality. The public UI is map-first and never shows individual fan positions.

## Current Status

Implemented:

- Next.js App Router frontend in TypeScript
- full-screen homepage with responsive layout
- MapLibre GL JS map centered on the canton of Fribourg
- locality side panel with fan count and fan log form
- `POST /api/fan-logs` route
- Zod validation for fan-log submissions
- server-side Cloudflare Turnstile verification
- hashed IP and user-agent handling for privacy-preserving rate limiting
- Prisma schema plus raw SQL PostGIS migrations
- PostgreSQL/PostGIS local development with Docker Compose

Current limitations:

- the map still uses demo locality polygons and counts in the frontend
- the real Cloudflare Turnstile widget now exists in the UI, but you still need valid site and secret keys in local env to submit successfully
- official Swiss locality geodata is not wired yet

## Stack

- Next.js App Router
- React 19
- TypeScript
- Tailwind CSS
- MapLibre GL JS
- PostgreSQL + PostGIS
- Prisma 7
- Zod
- Cloudflare Turnstile

## Local Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Create your local env file

Env files are intentionally ignored by git and must never be committed.

Create a local `.env` or `.env.local` file in the project root with values like these:

```bash
DATABASE_URL="postgresql://gotteron:gotteron@localhost:5432/gotteron_fan?schema=public"
POSTGRES_DB="gotteron_fan"
POSTGRES_USER="gotteron"
POSTGRES_PASSWORD="gotteron"
POSTGRES_PORT="5432"
NEXT_PUBLIC_TURNSTILE_SITE_KEY="your-turnstile-site-key"
TURNSTILE_SECRET_KEY="your-turnstile-secret-key"
REQUEST_HASH_SALT="change-me-to-a-random-secret-string"
```

Notes:

- `NEXT_PUBLIC_TURNSTILE_SITE_KEY` is used by the client-side widget
- `TURNSTILE_SECRET_KEY` is used only on the server
- `REQUEST_HASH_SALT` strengthens the hashing used for request metadata

### 3. Start PostgreSQL + PostGIS

```bash
npm run db:up
```

### 4. Apply database migrations

```bash
npm run db:migrate
```

### 5. Generate Prisma client if needed

```bash
npm run prisma:generate
```

### 6. Start the app

```bash
npm run dev
```

Open `http://localhost:3000`.

## Useful Commands

```bash
npm run dev
npm run lint
npm run build
npm run prisma:validate
npm run prisma:generate
npm run db:up
npm run db:down
npm run db:migrate
```

## Database Overview

The schema currently includes:

- `localities`
	- locality identity data
	- `geom geometry(MultiPolygon, 4326)` in PostGIS
- `fan_logs`
	- references `localities`
	- stores pseudo, anecdote, remark
	- stores hashed request metadata for basic rate limiting
- `locality_fan_counts`
	- stores precomputed aggregate counts per locality

Fan log creation and fan count updates happen in a single transaction.

## API Overview

`POST /api/fan-logs`

Expected payload:

```json
{
	"localityId": "1",
	"pseudo": "DragonRouge90",
	"anecdote": "First away trip was unforgettable.",
	"remark": "Optional moderation note.",
	"captchaToken": "turnstile-token"
}
```

The route:

- validates input with Zod
- verifies Turnstile server-side
- hashes IP and user agent before storing
- rate limits repeated submissions
- inserts the fan log and updates `locality_fan_counts` in one transaction
- returns the updated fan count

## Validation

Useful project-level validation commands:

```bash
npm run lint
npm run build
npm run prisma:validate
docker compose config
```

## Project Structure

```text
src/
	app/
		api/
	components/
	lib/
	server/
prisma/
	migrations/
```

## Privacy Rules

- never store exact user location
- never expose raw IP addresses
- never render individual fan markers
- always aggregate counts by locality

## Next Steps

- wire official Swiss locality geodata into the map
- replace demo locality polygons with real locality geometry and counts
- seed the database with real locality records
- run a real end-to-end submission test with valid Turnstile credentials
