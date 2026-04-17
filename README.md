# Revel — BSW Community Event Platform

**Free. Open source. Community-owned. No BS.**

The event management platform for Boulder Startup Week and community-run events everywhere.

<!-- 🌐 **Live:** https://revel-event-hub.ryan-c9e.workers.dev/bsw/ -->

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
supabase db reset
```

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

1. Make your schema change in `supabase/migrations/`.

2. Test it locally first:

```bash
supabase db reset
```

3. Push the migration to the linked production project:

```bash
supabase db push --linked
```

This repo is already linked to the production Supabase project `stmeubgvlednhhcakelt`.

### Key Documentation Files

| File | What It Is |
|------|-----------|
| `CLAUDE.md` | AI agent instructions — start here if building with Claude Code |
| `BRAND.md` | Design system: colors, typography, component specs, voice/tone |
| `PRD.md` | Platform product requirements, personas, feature scope, timeline |
| `VOLUNTEER_PRD.md` | Volunteer management feature requirements |

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
