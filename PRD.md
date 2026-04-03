# PRD.md — Revel Community Event Platform

**Version 1.0 | January 2026**
**Status: Active development — April 7 go-live**

---

## Why We're Building This

Boulder Startup Week runs 200+ events, 4,000+ attendees, and 20+ venues over 5 days. Existing platforms failed us:

- **Sched** — expensive, buggy, complex
- **Luma** — 500-person free tier cap, then expensive fast
- **Meetup** — ad-heavy, hostile UX, paywalls

We're building the free, open-source alternative. Community-built, community-owned, community-first.

> "The attendees kick ass, not the platform."

---

## Goals

### Now (April 7, 2026 — hard deadline)
Launch MVP for BSW 2026 (May 4–8) supporting 200+ events and 4,000+ attendees.

### Later (2026–2027)
Become the default platform for community-run startup events: Colorado Startup Week, Front Range Startup Week, startup weeks nationwide, unconferences and community meetups.

---

## Success Metrics

| Metric | Target |
|--------|--------|
| BSW 2026 runs without major incident | ✅ Required |
| Attendee satisfaction | ≥ 90% |
| Developer contributors | ≥ 5 |
| Other events adopting the platform within 12 months | ≥ 3 |
| GitHub stars | ≥ 100 |

---

## User Personas

### Admin (Event Organizer)
BSW core team and volunteers managing the overall event.

Needs: Total control, bulk operations, registration analytics, communication tools.
Pain points: Manual data entry, zero visibility into registration trends.

### Facilitator (Session Host)
Track captains, session leaders, workshop hosts.

Needs: Easy event creation/editing, attendee visibility, ability to share pre-session materials.
Pain points: Not knowing who's showing up, no way to share resources beforehand.

### Attendee
Founders, developers, designers, students, community members.

Needs: Easy discovery, quick registration, mobile access, personal schedule.
Pain points: Can't find events easily, no mobile-friendly navigation, can't share their schedule.

---

## MVP Features (Must Ship by April 7)

### 1. Conference & Event Management

- Conference object: group multiple events under BSW 2026 (one week, many sessions)
- Create/edit events: title, description, facilitator(s), date/time, location
- Optional event attachments: PDFs, slides, links
- Bulk upload via CSV/spreadsheet
- Venue management: add/edit venues with addresses
- Event tags and categories for filtering
- Draft vs. published status toggle

### 2. Registration & Attendance

- Single-click registration for any event
- Multi-select registration (add multiple events at once)
- Unregister from events
- Registration counts visible to admin and facilitators

### 3. User Profiles & Auth

- Account creation: email + password
- Profile fields: name, email, avatar, headline, bio, LinkedIn link
- Opt-in demographic data (age range, gender, ethnicity, industry, role, years in industry)
- Opt-in email visibility (attendees choose whether email is public)
- Roles: Admin, Facilitator, Attendee
- Badges: Facilitator (automatic), Volunteer (admin-assigned), Sponsor (admin-assigned)

### 4. Personal Schedule

- View all registered events in one place
- Calendar view (day view minimum)
- Export to `.ics` (Apple Calendar, Google Calendar, Outlook)
- Tap address to open in maps app (Google Maps or Apple Maps)
- Mobile-responsive design

### 5. Discovery & Browse

- Browse all events: list and grid views
- Filter by: date, time, location, category
- Keyword search
- Sort by: date, popularity, location, recently added

> **No tracks.** Tracks are a Sched-ism we're not carrying forward. Sessions have a `type` (Workshop, Panel, Keynote, etc.) and a `category` — that's sufficient. Any "All Tracks" UI from the original codebase should be removed.

### 6. Admin Tools

- Dashboard: total registrations, popular events, venue utilization
- User management: assign roles, assign badges
- Block/unblock users
- Bulk message all registrants
- Message attendees of a specific event
- Export attendee data as CSV
- Event analytics: registrations over time
- Attendee import: bulk CSV (flat file only — no claim flow)

> **Sched migration pipeline:** The existing codebase has an "Imported from Sched / Claimed / Awaiting Claim" flow with claim link generation. **Remove this.** Sched data was pulled as a flat export — attendees import directly. The `source: "sched"` field, `awaiting_claim` status, and claim-rate dashboard metrics are dead weight and should be deleted. The CSV upload mechanism itself is fine — keep it, just remove everything that runs after the import.

---

## Post-MVP Features (Phase 2 — Summer 2026)

These are explicitly out of scope for April 7. Do not build them now.

- Social sign-on (Google, LinkedIn, GitHub)
- Shareable schedule URL
- Capacity caps per event
- Waitlist for full events
- View registered attendees (facilitator/admin only)
- Downloadable attendee guide PDF
- Post-session automated surveys
- Web push notifications for event reminders

---

## Phase 3 — Community Features (Late 2026)

- Attendee networking: see who else is attending, connect
- Event comments / Q&A
- Event media library (video, photos)
- Multi-event organization support (one platform, multiple events)
- Custom branding per event
- Mobile app (iOS/Android)

---

## Technical Requirements

### Stack

| Layer | Technology |
|-------|-----------|
| Runtime | Cloudflare Workers |
| Frontend | React + Next.js |
| Backend | Node.js + Express or Cloudflare Worker handlers |
| Database | PostgreSQL |
| Auth | NextAuth.js or Auth0 |
| File Storage | Cloudflare R2 or Backblaze B2 |

### Non-Negotiable Technical Requirements

- Mobile-first responsive design (375px baseline)
- Progressive Web App (PWA) support
- API-first architecture (REST or GraphQL)
- Page loads under 3 seconds
- Automated tests: unit + integration
- CI/CD pipeline

### Security & Privacy

- GDPR/CCPA compliant
- Data encryption at rest and in transit
- User data export and deletion on request
- Clear privacy policy and terms of service

### Accessibility

- WCAG 2.1 AA minimum
- Full keyboard navigation
- Screen reader compatible
- High contrast mode option

---

## Out of Scope (Forever, or Until Explicitly Approved)

- Payment processing / ticket sales
- Native mobile apps (PWA is sufficient)
- Video streaming (Zoom, YouTube integration)
- Multi-language support
- Background checks for volunteers
- Real-time GPS location tracking
- AI-powered recommendations (nice-to-have, roadmap item only)

---

## Competitive Landscape

| Platform | Cost | Why We Beat Them |
|----------|------|-----------------|
| Sched | $$$ | We're free. They're expensive and buggy. |
| Luma | Free <500, then $$$ | We have no attendee cap. |
| Meetup | $$ | No ads. No paywalls. No hostile UX. |
| **BSW Platform** | **Free** | Open source, community-owned, no BS. |

---

## Timeline

| Date | Milestone |
|------|-----------|
| Feb 1–21 | Sprint Foundation: architecture, DB schema, auth, core models |
| Feb 22–Mar 14 | Core Features: registration, schedule, browse, admin |
| Mar 15–31 | Polish: mobile optimization, performance, bug fixes, user testing |
| Apr 1–6 | Launch Prep: bulk upload BSW events, smoke tests, admin training |
| **Apr 7** | **GO LIVE** |
| Apr 8–May 3 | Post-launch: bug fixes, performance, feedback loop |
| **May 4–8** | **Boulder Startup Week 2026** |

---

## Open Source Strategy

- **License:** MIT or Apache 2.0
- **GitHub:** github.com/boulderstartupweek/event-platform
- **Contribution:** Clear `CONTRIBUTING.md` with setup instructions
- **Public roadmap:** GitHub Projects (public board)
- **Feature requests:** GitHub Issues with 👍 voting
- **Label system:** `MVP`, `Phase 2`, `Phase 3`, `community-requested`, `help wanted`

The goal is 5+ contributors by BSW 2026 and 3+ other events adopting the platform within a year.

---

## Contacts

| Role | Person |
|------|--------|
| Product Lead | Holly V |
| Engineering Lead | Ryan St. Pierre |
