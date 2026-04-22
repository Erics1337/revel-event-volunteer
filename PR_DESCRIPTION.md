# PR: Migrate to Next.js + Supabase Architecture

## Overview

This PR represents a complete architectural migration from the original Cloudflare Workers implementation to a modern Next.js + Supabase stack. The platform has been rebuilt from the ground up to leverage Supabase for database, authentication, and real-time capabilities, while maintaining the core Boulder Startup Week volunteer management functionality.

## Key Changes

### 🏗️ Architecture Migration

**From:** Cloudflare Workers + D1 database + R2 storage  
**To:** Next.js 15 + Supabase (PostgreSQL, Auth, Storage)

- Replaced Cloudflare Workers entry point with Next.js App Router
- Migrated from D1 (SQLite) to PostgreSQL via Supabase
- Moved from custom auth implementation to Supabase Auth with magic link email sign-in
- Integrated Resend for transactional email delivery

### 🗄️ Database & Schema

**New Schema:**
- `users` - Extended with phone number, role (admin/volunteer), and auth integration
- `volunteers` - Volunteer profiles with availability and contact info
- `volunteer_shifts` - Shift definitions with roles, locations, time slots, and capacity
- `volunteer_assignments` - Many-to-many relationship between volunteers and shifts
- `notifications` - Email delivery tracking via Resend
- `venues` - Location metadata

**Migrations:**
- 001: Initial schema with RLS policies
- 002: Admin users seed
- 003: Notifications table
- 004: Volunteer availability JSONB column
- 005: Phone number requirement for volunteers
- 006: Enum types for shift roles and venue names
- 007: Trigger for updated_at timestamps
- 008: Volunteer assignment uniqueness constraint
- 009: Drop legacy sessions/registrations tables (cleanup)

**Type Generation:**
- Automated TypeScript type generation from Supabase schema via `npm run db:types`
- Database types stored in `src/lib/supabase/database.types.ts`

### 🔐 Authentication & Authorization

- **Supabase Auth Integration:**
  - Magic link email sign-in flow
  - Auth context provider for client-side auth state
  - Middleware-based route protection (`/admin`, `/profile`, `/schedule`)
  - Role-based access control (admin vs volunteer)

- **Authorization:**
  - `isAdmin()` utility function for role checks
  - RLS policies on all database tables
  - Service role key for admin operations
  - Anon key for client-side queries

### 📧 Email Notifications (Resend Integration)

**Notification Types:**
- Volunteer confirmation emails on shift signup
- 24-hour reminder before shift
- 1-hour reminder before shift
- Admin bulk messaging capability

**Implementation:**
- `/api/cron/reminders` - Hourly cron job via Vercel
- Notification dispatcher in `src/lib/notifications/dispatcher.ts`
- HTML email templates in `supabase/templates/`
- Delivery tracking in `notifications` table

### 🎨 Frontend Rewrite

**Pages:**
- `/` - Homepage with volunteer-focused branding and CTAs
- `/events` → `/volunteers` - Browse and sign up for open shifts
- `/schedule` - View personal shift assignments (auth required)
- `/profile` - Manage availability and contact info
- `/admin` - Dashboard with volunteer metrics and shift management
- `/admin/users` - User management
- `/admin/volunteers` - Volunteer coordination
- `/admin/shifts` - Shift CRUD with FullCalendar integration

**Components:**
- Volunteer layout with sticky header and navigation
- Auth context provider for global auth state
- Phone required modal for volunteer onboarding
- Shift cards with role, time, location, and capacity
- Admin dashboard tiles with real-time metrics
- Calendar view for shift scheduling

**Styling:**
- Tailwind CSS configuration with BSW brand colors
- Custom shadows, border radius, and color tokens
- Mobile-first responsive design
- Brand gradient: `#2B8A8F → #F5A623 → #F58220`

### 📊 Admin Dashboard

**Metrics:**
- Total users, volunteers, confirmed volunteers
- Total shifts, assignments, slots, fill rate
- Shifts by day with filled/total counts
- Understaffed shifts (prioritized for recruitment)
- Location utilization with fill percentages

**Features:**
- Quick actions for user/volunteer management
- Shift management with FullCalendar
- Volunteer pool view with availability
- Bulk email messaging to volunteers

### 🔧 Developer Experience

**Database Workflow:**
```bash
supabase start              # Start local Supabase
npm run db:reset           # Reset DB + regenerate types
npm run db:migrate:new     # Create new migration
npm run db:types           # Regenerate TypeScript types
```

**Environment Variables:**
- `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Client-side auth key
- `SUPABASE_SERVICE_ROLE_KEY` - Server-side admin key
- `RESEND_API_KEY` - Email service API key
- `RESEND_FROM_EMAIL` - Sender email address

**Linting:**
- ESLint with TypeScript rules
- Next.js lint configuration

### 🚀 Deployment

- **Vercel** for Next.js hosting
- **Supabase** for database and auth (managed service)
- **Resend** for email delivery
- **Vercel Cron Jobs** for hourly reminder scheduling

### 📁 File Structure Changes

**Removed:**
- `src/worker/` - Cloudflare Workers entry point
- `wrangler.toml` - Cloudflare Workers config
- `tests/` - Placeholder test directory

**Added:**
- `src/app/` - Next.js App Router structure
- `src/contexts/` - React context providers
- `src/lib/auth/` - Authentication utilities
- `src/lib/notifications/` - Email notification system
- `src/lib/supabase/` - Supabase client and types
- `supabase/` - Database migrations and templates
- `tailwind.config.ts` - Tailwind configuration
- `tsconfig.json` - TypeScript configuration
- `vercel.json` - Vercel deployment config

## Breaking Changes

1. **Auth Flow:** Users must re-authenticate with magic link (previous auth system removed)
2. **Database:** Complete schema migration - data migration required if production data exists
3. **API Routes:** All API endpoints restructured under `/api/` with Supabase integration
4. **Environment:** New environment variables required for Supabase and Resend

## Testing Recommendations

1. **Auth Flow:** Test magic link sign-in and session persistence
2. **Volunteer Signup:** Verify shift assignment and capacity limits
3. **Admin Dashboard:** Check metrics accuracy and shift management
4. **Email Delivery:** Test notification templates with Resend
5. **RLS Policies:** Verify database security policies prevent unauthorized access

## Migration Notes

If deploying to production with existing data:
1. Export data from legacy D1 database
2. Transform data to match new Supabase schema
3. Import via Supabase dashboard or SQL
4. Run all migrations in order
5. Test auth migration for existing users

## Next Steps

- [ ] Add unit tests for critical business logic
- [ ] Set up CI/CD pipeline with Vercel
- [ ] Configure production Supabase project
- [ ] Set up production Resend API key
- [ ] Add error monitoring (Sentry or similar)
- [ ] Performance audit and optimization

---

**Focus:** This PR establishes the Supabase integration as the foundation for the platform, providing a scalable, managed backend with built-in auth, real-time capabilities, and email delivery — replacing the custom Cloudflare Workers implementation while maintaining all volunteer management functionality.
