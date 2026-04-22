export type AssignmentStatus = 'requested' | 'assigned' | 'cancelled'

export interface VolunteerShift {
  id: string
  role: string
  day: string
  start_time: string
  end_time: string
  location: string
  total_slots: number
  filled_slots: number
}

export interface AvailableVolunteer {
  id: string
  user_id: string | null
  name: string
  email: string
  phone: string
  availability: string[]
  shift_count: number
  status: string
}

export interface ShiftAssignment {
  id: string
  shift_id: string
  volunteer_id: string
  assigned_at: string | null
  status: AssignmentStatus
  volunteer: {
    id: string
    name: string
    email: string
    phone: string
    status: string
    user_id: string | null
  } | null
}

export const EVENT_DAYS = [
  { date: '2026-05-04', label: 'Mon, May 4' },
  { date: '2026-05-05', label: 'Tue, May 5' },
  { date: '2026-05-06', label: 'Wed, May 6' },
  { date: '2026-05-07', label: 'Thu, May 7' },
  { date: '2026-05-08', label: 'Fri, May 8' },
] as const

/**
 * Shift roles — must stay in sync with the `shift_role` Postgres enum declared
 * in `supabase/migrations/006_volunteer_enums.sql`. To add a role:
 *   1. Add it to the enum via a new migration: `ALTER TYPE shift_role ADD VALUE '...';`
 *   2. Add it here.
 */
export const SHIFT_ROLES = [
  'ALL DAY - LOCATION CAPTAIN',
  'Building Runner',
  'Room Runner',
  'Volunteer Hub / Door Monitor',
] as const

export type ShiftRole = (typeof SHIFT_ROLES)[number]

/**
 * Venue names — must stay in sync with the `venue_name` Postgres enum.
 * Full addresses live in the `venues` table; this map mirrors them for
 * client-side rendering without an extra query.
 */
export const VENUE_NAMES = [
  'Boulder Associates',
  'Boulder Public Library',
  'Brand Studios',
  'Canyon Center',
  'Rosetta Hall',
  'SOVRN',
] as const

export type VenueName = (typeof VENUE_NAMES)[number]

export const VENUE_ADDRESSES: Record<VenueName, string> = {
  'Boulder Associates': '1426 Pearl St #300, Boulder, CO 80302',
  'Boulder Public Library': '1001 Arapahoe Ave, Boulder, CO 80302',
  'Brand Studios': '1301 Walnut Street, Boulder, CO 80302',
  'Canyon Center': '1881 9th Street, Boulder, CO 80302',
  'Rosetta Hall': '1109 Walnut Street, Boulder, CO 80302',
  SOVRN: '1600 Pearl St #200, Boulder, CO 80302',
}

export const VENUE_MAPS_URLS: Record<VenueName, string> = {
  'Boulder Associates': 'https://maps.google.com/?q=Boulder+Associates',
  'Boulder Public Library': 'https://maps.google.com/?q=Boulder+Public+Library',
  'Brand Studios': 'https://maps.google.com/?q=Brand+Studios',
  'Canyon Center': 'https://maps.google.com/?q=Canyon+Center',
  'Rosetta Hall': 'https://maps.google.com/?q=Rosetta+Hall',
  SOVRN: 'https://maps.google.com/?q=SOVRN',
}
