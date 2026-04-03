# CLAUDE.md — Revel / BSW Event Platform

> **Read this file first.** This is the primary instruction set for any AI agent working on this codebase.

---

## What This Is

An open-source community event management platform built for Boulder Startup Week 2026 (May 4–8). Currently live at:

```
https://revel-event-hub.ryan-c9e.workers.dev/bsw/
```

Built on **Cloudflare Workers**. The platform handles 200+ sessions, 4,000+ attendees, 20+ venues across 5 days.

**Core philosophy:** Community-built, community-owned, attendee-first. Not a corporate SaaS product. Not trying to compete with Luma on polish. We're the neighborhood bar, not the Michelin star restaurant.

---

## The Golden Rules (Do Not Break These)

### 1. Don't break what's live
The platform is in active use. Before touching anything:
- Understand the existing data model before changing it
- Never rename or remove API endpoints without a deprecation path
- Test locally before pushing. The April 7, 2026 go-live is a hard deadline.

### 2. Mobile-first, always
Every UI change starts on a 375px viewport. Desktop is secondary. BSW attendees are on their phones between sessions.

### 3. Brand is non-negotiable
Colors, fonts, button styles — use `BRAND.md`. Do not introduce new colors, third-party component libraries, or visual patterns that contradict the design system. When in doubt, use teal (`#2B8A8F`) and orange (`#F58220`).

### 4. No corporate speak in UI copy
If you write UI copy, it should sound like a Boulder founder, not a SaaS marketing team. See `BRAND.md → Voice & Tone`.

### 5. Open source spirit
This code will be forked by other startup weeks. Write clean, documented, contributor-friendly code. Avoid clever hacks that only you understand.

---

## Repo Structure (Expected)

```
/
├── CLAUDE.md              ← You are here
├── README.md              ← Project overview for humans
├── BRAND.md               ← Design system, tokens, component specs
├── PRD.md                 ← Platform product requirements
├── VOLUNTEER_PRD.md       ← Volunteer management feature PRD
├── src/
│   ├── worker/            ← Cloudflare Worker entry point
│   ├── components/        ← UI components
│   ├── api/               ← API routes
│   └── data/              ← Data models and schemas
├── public/
│   └── assets/            ← Logos, icons, static files
└── tests/
```

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Hosting/Runtime | Cloudflare Workers |
| Frontend | React + Next.js (preferred) |
| Backend | Node.js / Cloudflare Worker handlers |
| Database | PostgreSQL (open source, scalable) |
| Auth | NextAuth.js or Auth0 |
| File Storage | Cloudflare R2 or Backblaze B2 |
| CSS | Tailwind CSS (utility-first, mobile-first) |

---

## Current Feature Status

Track what's live vs. what you're building. **Do not assume a feature is unbuilt just because it's in the PRD.**

| Feature | Status |
|---------|--------|
| Event browse by day | ✅ Live |
| Day filter tabs | ✅ Live |
| My Schedule (add/remove sessions) | ✅ Live |
| Admin panel (shell) | ✅ Live (at `/bsw/admin`) |
| User auth / sign-in | 🔄 In progress |
| Registration counts | 🔄 In progress |
| Calendar export (.ics) | 📋 Planned |
| Volunteer management | 📋 Planned (see `VOLUNTEER_PRD.md`) |
| Search / keyword filter | 📋 Planned |

---

## Dead Code — Remove, Don't Maintain

The following exists in the codebase but is **explicitly not part of the product**. Don't refactor it, don't wire it up, don't work around it — delete it.

### Tracks
The admin panel and main UI both have an "All Tracks" filter. Tracks are a Sched feature we're not carrying forward. Sessions have a `type` field (Workshop, Panel, Keynote, etc.) and a `category` — that covers all the filtering we need.

**Remove:** "All Tracks" dropdown in admin, track filter tab in attendee UI, any `track` field on the Session model.

### Sched Migration Pipeline
The admin "Attendees" tab has an "Imported from Sched / Claimed / Awaiting Claim" workflow with claim link generation and a claim-rate progress bar. **We don't need this.** Sched data was pulled as a flat export and will be imported directly via CSV. No claim flow, no match-by-email dance.

**Remove:** `source: "sched"` tracking, `awaiting_claim` status, claim link generation, "Claim Progress" dashboard widget, `imported_from_sched` counter.

> **Keep:** The existing CSV upload mechanism itself is fine — just strip the Sched-specific claim flow that runs after import. Import should be: upload CSV → records appear → done.

---

## Key Dates

| Date | Milestone |
|------|-----------|
| April 7, 2026 | **Hard go-live deadline** — platform must be live |
| April 8–May 3 | Bug fixes, performance, feedback loop |
| May 4–8, 2026 | **Boulder Startup Week 2026** — full production |

---

## How to Work in This Codebase

### Starting a new feature
1. Read `PRD.md` for scope and acceptance criteria
2. Check `BRAND.md` for relevant component specs before writing any UI
3. Check the live site — don't rebuild what exists
4. Build mobile-first. Test at 375px.
5. Use BSW brand tokens (see `BRAND.md`). No new colors.

### Writing UI copy
Read `BRAND.md → Voice & Tone` first. The copy rules are as important as the visual rules.

### Adding a new page or route
- Follow the existing Cloudflare Workers routing patterns
- Keep the `/bsw/` prefix for BSW-specific routes
- Document new routes in this file under "Current Feature Status"

### Changing a data model
- Confirm the change doesn't break existing API consumers
- Update the relevant PRD doc to reflect the change
- Add a migration if needed

---

## What We Are NOT Building (Yet)

Do not scope-creep into these without explicit approval:

- Payment processing / ticket sales
- Native mobile apps (PWA is sufficient)
- Video streaming / Zoom integration
- Multi-language support
- Background check integrations for volunteers
- Real-time GPS tracking

---

## Contacts

| Role | Person |
|------|--------|
| Product Lead | Holly V |
| Engineering Lead | Ryan St. Pierre |
| GitHub | github.com/boulderstartupweek/event-platform |

---

## Reference Docs

| File | Purpose |
|------|---------|
| `BRAND.md` | Colors, typography, component specs, voice/tone |
| `PRD.md` | Full platform requirements, user personas, success metrics |
| `VOLUNTEER_PRD.md` | Volunteer management feature (Phase 3) |
| `README.md` | Human-readable project overview and setup guide |
