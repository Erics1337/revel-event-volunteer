# VOLUNTEER_PRD.md — Volunteer Management Feature

**Version 1.1 | March 2026**
**Dev Kickoff: March 15, 2026**
**Required for: BSW 2026 (May 4–8)**

---

## Why This Feature Exists

Volunteers are the backbone of BSW's operational model. 50+ people donate thousands of hours to make the week run. Right now, we coordinate them through spreadsheets and scattered Slack messages.

The result: 10%+ of shifts historically unassigned by event day, volunteer confusion from inconsistent communication, and hours of manual admin work that shouldn't exist.

This feature fixes that — inside the existing platform, no separate login required.

---

## The Problem, Precisely

- Unfilled or overlapping shifts (historically >10% unassigned by event day)
- Volunteers confused by multi-channel, inconsistent communications
- Admin overload: coordinators spend hours reconciling sign-ups and no-shows manually
- Zero real-time visibility into coverage gaps until it's too late to fill them

---

## Vision

One place to manage the complete volunteer lifecycle — from recruitment through the last shift — achieving 95%+ shift fill rate while cutting admin burden and making volunteers feel like the VIPs they are.

---

## Success Metrics

| Metric | Target |
|--------|--------|
| Volunteer signup completion rate | ≥ 80% |
| Volunteer satisfaction score (post-event) | ≥ 4.5 / 5 |
| Returning volunteers (next 2 event cycles) | +25% |
| Reduction in admin scheduling time | 50% |
| Open shifts remaining on event day | ≤ 5% |
| Admins using CSV export for reporting | 100% |

---

## User Personas

### Admin — Volunteer Coordinator
BSW core team and volunteer leads.

Needs: Manage 200+ volunteers, instant visibility into coverage gaps, bulk communication tools.
Pain points: Manual reconciliation of sign-ups, no-shows, and last-minute schedule chaos.

### Volunteer
Founders, community members, students who give their time to BSW.

Needs: Easy shift discovery, a clear schedule they can trust, ability to update availability.
Pain points: Vague shift descriptions, poor day-of communication, hard to make changes when life happens.

---

## MVP Features (Must Ship by April 7)

### 1. Volunteer Signup & Onboarding

- Volunteer profile creation: contact info, skills, availability windows
- Eligibility-aware shift signup — only surfaces shifts that match the volunteer's preferences (day, time, location, skill requirements)
- Communication preference selection at onboarding: email, SMS, or push notification

### 2. Admin Assignment & Scheduling

- Manual assignment of volunteers to individual shifts
- Bulk assignment tools for high-volume operations
- Eligibility rules engine: enforces skill, experience, and availability requirements per shift; allows admin overrides
- Real-time "schedule fill" dashboard showing unfilled slots and coverage alerts

### 3. Schedule Management

- Calendar view for individuals (my shifts) and the full team (admin view)
- Calendar displayed alongside the main event schedule — context matters
- Volunteer self-cancellation and shift drop, with admin-configurable cutoff window
- Open shift search with filters: role, day, location, required skill

### 4. Communication & Notifications

- Automated confirmation flow: confirmation email immediately on signup
- Automated reminders: 24 hours and 1 hour before shift
- Admin-triggered bulk messaging by shift, day, or event segment
- All notifications respect each volunteer's communication preference (email/SMS/push)

### 5. Reporting & Audit

- One-click CSV export: volunteer data, assignments, and attendance
- Activity audit log for compliance tracking and future event planning

---

## Post-MVP Features (Do Not Build Now)

Out of scope for April 7. Prioritized for the next development cycle.

- Peer-to-peer shift swapping (volunteer-initiated exchanges)
- Post-shift feedback collection inside the volunteer portal
- Mobile push notifications beyond SMS and email
- Analytics dashboards: volunteer hours by role, engagement trendlines
- Auto-suggest for filling last-minute open shifts

---

## Technical Architecture

> Engineering leads should review and adjust based on existing platform constraints. This is a proposed baseline, not a prescription.

### Platform Integration

This is an extension of the main event platform — not a separate product.

- Volunteers use the same login as regular attendees. No second account.
- Admin functionality lives as a new tab inside the existing Event Dashboard
- Volunteer-facing UI lives in a new "Volunteer Portal" section of the attendee view

### Core Services Needed

- RESTful API for all volunteer data, assignments, schedules, and messaging
- Notification service with routing by user preference (email / SMS / push)
- Eligibility rules engine: matches volunteers to shifts by skill, experience, availability
- Real-time update layer for admin dashboards (can leverage existing pub/sub infrastructure)

### Data Models

**Volunteer**
```
id, user_id (FK → users), skills[], availability[], 
contact_info, comms_preferences, shift_history[]
```

**Shift**
```
id, event_id (FK → events), role, requirements{}, 
status, assigned_slots[], start_time, end_time, location
```

**Assignment**
```
id, volunteer_id, shift_id, status (confirmed/cancelled/no-show), 
assigned_by, assigned_at, cancelled_at
```

### Integration Points

- Core event data models (sessions, times, venues)
- Platform notifications module
- Calendar sync: Google Calendar and iCal export
- Platform reporting and CSV export infrastructure

### Security & Scale Requirements

- All volunteer PII follows platform-wide security and compliance standards
- Role-based access control on all admin-only routes
- Infrastructure should support 500+ volunteers and 100+ shifts per event
- Real-time sync maintained under event-day peak load

---

## Out of Scope (This Feature)

- Background check or external credential provider integration
- A standalone volunteer app or separate onboarding flow
- Automated incentives, points, or gamification
- Real-time GPS location tracking of volunteers

---

## Competitive Context

Generic tools like SignUp Genius handle basic signups but fail for a complex, multi-day event like BSW.

| Capability | Generic Tools | BSW Platform |
|-----------|--------------|-------------|
| Eligibility Logic | Open signups only | Shift-level rules engine with admin overrides |
| Communication | External email only | Omnichannel with preference routing and bulk admin broadcast |
| Schedule Visibility | Static lists, no gap detection | Calendar view with real-time coverage dashboard |
| Reporting | Basic or no export | One-click CSV export + full activity audit log |
| Accessibility | Minimal, not mobile-first | Screen reader support, keyboard nav, mobile-first |

---

## Timeline

| Phase | Dates | Key Deliverables | Dependencies |
|-------|-------|-----------------|-------------|
| Pre-Dev | Mar 3–14 | Requirements sign-off, design mocks, technical spec | Stakeholder alignment |
| Phase 1 | Mar 15–21 | Volunteer signup & onboarding, profile creation | Core event/shift schemas |
| Phase 2 | Mar 22–28 | Eligibility logic, admin assignment, automated notifications | Notification routing, eligibility engine |
| Phase 3 | Mar 29–Apr 11 | Bulk comms, reporting/export, schedule view, accessibility | Platform messaging & export modules |
| Soft Launch | Apr 7–18 | Real-event pilot, volunteer feedback, bug fixes | Test event + volunteer pool |
| **BSW 2026** | **May 4–8** | **Full production deployment** | Soft launch sign-off |

---

## Team

2–3 people: 1 Product Manager / Designer + 1–2 Full-Stack Engineers.

Development begins March 15 to allow for requirements sign-off and design preparation in the prior two weeks.

---

## Additional Requirements

- **Accessibility:** Full support for screen readers, keyboard navigation, and mobile-responsive design. Non-negotiable.
- **Localization:** Interface prepared for future multi-language support (don't hardcode strings in ways that block translation).
- **Performance:** Stress-tested against peak event-day loads. Reminder systems validated for high-volume scenarios.
- **Data Privacy:** Clear privacy policy covering volunteer PII reviewed prior to launch.
- **Change Management:** In-app guides and tooltips for first-time admins and volunteers. People shouldn't need a training session to use this.

---

## Contacts

| Role | Person |
|------|--------|
| Product Lead | Holly V |
| Engineering Lead | Ryan St. Pierre |
