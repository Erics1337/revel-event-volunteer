# Revel — BSW Community Event Platform

**Free. Open source. Community-owned. No BS.**

The event management platform for Boulder Startup Week and community-run events everywhere.

---

## What Is This

An open-source event platform built because the existing options are either too expensive, too buggy, or too hostile to the people who actually use them. We're done paying for mediocre software.

Built for Boulder Startup Week 2026 (May 4–8). 200+ events. 4,000+ attendees. 20+ venues. 5 days.

---

## For Developers

### Getting Started

#### Run Supabase locally

1. Install dependencies:

```bash
npm install
```

2. Start local Supabase:

```bash
supabase start
```

3. Reset the local database and load the schema + seed data:

```bash
npm run db:reset
```

This wrapper runs `supabase db reset` and then automatically regenerates
TypeScript types from the fresh schema into
`src/lib/supabase/database.types.ts`. Never call `supabase db reset` directly
unless you also plan to run `npm run db:types` manually — otherwise your
TypeScript types will drift from the database.

4. Copy the local Supabase values into `.env.local`:

```bash
cp .env.example .env.local
supabase status
```

Set these in `.env.local` from the `API URL`, `anon key`, and `service_role key` shown by `supabase status`:

```bash
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
```

5. Start the app:

```bash
npm run dev
```

#### Edit the production database

1. Create a new migration file:

```bash
npm run db:migrate:new -- <migration_name>
```

2. Edit the new file under `supabase/migrations/`.

3. Test it locally (resets DB **and** regenerates types):

```bash
npm run db:reset
```

4. Push the migration to the linked production project (also regenerates types
   from the **local** schema — your migration files are the source of truth):

```bash
npm run db:push
```

This repo is already linked to the production Supabase project `stmeubgvlednhhcakelt`.

#### Database script reference

| Script | What it does |
|--------|--------------|
| `npm run db:types` | Regenerate `src/lib/supabase/database.types.ts` from the **local** Supabase instance |
| `npm run db:reset` | `supabase db reset` + `db:types` (fresh schema + fresh types) |
| `npm run db:migrate:new -- <name>` | Scaffold a new migration file |
| `npm run db:migrate:up` | Apply pending migrations locally + `db:types` |
| `npm run db:push` | Push migrations to the linked production DB + `db:types` (from **local**) |
| `npm run config:push` | Push configuration in `supabase/config.toml` (using `.env.production`) to the linked production project |
| `npm run db:reset:prod` | ⚠️ **DANGER:** Wipe and reset linked production DB + `config:push` + `db:types` (from **local**) |

**Always** use the `db:*` npm scripts instead of calling `supabase` directly so
that `database.types.ts` stays in sync with the schema.

#### Volunteer reminder cron

Reminder emails are dispatched by Supabase Cron calling the app endpoint
`/api/cron/reminders` every 10 minutes. The endpoint still verifies the
`Authorization: Bearer <CRON_SECRET>` header before sending anything.

Store the production app URL and the same `CRON_SECRET` value from Vercel in
Supabase Vault, then install the schedule. If the Vault secrets already exist
when the migration runs, the migration installs the schedule automatically.

```sql
SELECT vault.create_secret('https://your-production-domain.example', 'reminder_app_base_url');
SELECT vault.create_secret('your-cron-secret', 'reminder_cron_secret');

SELECT public.configure_reminder_cron();
```

To change the cadence:

```sql
SELECT public.configure_reminder_cron(cron_schedule => '*/5 * * * *');
```

To inspect the job:

```sql
SELECT jobname, schedule, active
FROM cron.job
WHERE jobname = 'dispatch-volunteer-reminders';
```

#### Generating TypeScript types manually

`src/lib/supabase/database.types.ts` is the source of truth for every
`Database` type import in the codebase (`@supabase/supabase-js` clients, RLS
helpers, API route handlers, etc.). Whenever the schema changes, this file
**must** be regenerated — otherwise the app compiles against a stale schema
and you'll get runtime errors on columns that exist in one but not the other.

The raw command the npm scripts wrap:

```bash
# From the LOCAL Supabase instance (requires `supabase start` to be running).
# Use this during normal development so types reflect un-pushed migrations.
npx supabase gen types typescript --local > src/lib/supabase/database.types.ts

# From the LINKED REMOTE project (reads the production schema directly).
# Use this when you want types that mirror what's deployed, or when you don't
# have Docker / local Supabase running.
npx supabase gen types typescript --linked > src/lib/supabase/database.types.ts

# From a specific remote project by ref (no linking required).
npx supabase gen types typescript --project-id <project-ref> > src/lib/supabase/database.types.ts
```

| Flag | Source | When to use |
|------|--------|-------------|
| `--local` | Local Docker Supabase | Default dev loop — includes un-pushed migrations |
| `--linked` | Remote project this repo is linked to | Verify types match production after a `db push` |
| `--project-id <ref>` | Any remote project | One-off / CI without `supabase link` |

Prefer `--local` during development: you get types for migrations you're still
iterating on before they've been pushed. Switch to `--linked` right after
`npm run db:push` to confirm the production schema matches what you expect.

### Key Documentation Files

| File | What It Is |
|------|-----------|
| `CLAUDE.md` | AI agent instructions — start here if building with Claude Code |
| `BRAND.md` | Design system: colors, typography, component specs, voice/tone |
| `PRD.md` | Platform product requirements, personas, feature scope, timeline |
| `VOLUNTEER_PRD.md` | Volunteer management feature requirements |
| `documentation/supabase-magic-link-template.html` | Branded Supabase magic-link email template |

### Tech Stack

- **Frontend:** React + Next.js
- **Database:** Supabase PostgreSQL
- **Hosting:** Vercel

### Contributing

We need:
- Frontend developers (React, Tailwind)
- Backend developers (Node.js, PostgreSQL)
- UI/UX designers
- Community organizers willing to test and give feedback

Check the [GitHub Issues](https://github.com/boulderstartupweek/event-platform/issues) for `help wanted` and `good first issue` tags.

---

## For Attendees

Visit **https://boulderstartupweek.com** to register for BSW 2026.

The platform lets you browse 200+ sessions, build your personal schedule, and export it to your calendar.

---

## For Event Organizers

Want to use this platform for your own event? It's MIT licensed — fork it, run it, make it yours.

Contact Holly V or Ryan St. Pierre to learn more.

---

## Roadmap

- ✅ Event browse + filtering
- ✅ Personal schedule management
- ✅ Admin panel
- 🔄 User authentication - magic link
- 📋 Hosting 
- 📋 Calendar export (.ics)
- 📋 Collect phone #, texting opt-in
- 📋 Keyword search
- 📋 Social sign-on

---

## License

MIT. Built by builders, for builders.

---

## The Philosophy

> "We're not trying to compete with Luma on polish. We're building the neighborhood bar, not the Michelin star restaurant."

Community-built. Community-owned. The attendees kick ass, not the organizers.

---

*BSW 2026 go-live: April 7, 2026 | Event week: May 4–8, 2026*
