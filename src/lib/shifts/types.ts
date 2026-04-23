export type AssignmentStatus = 'requested' | 'assigned' | 'cancelled'

export interface VolunteerShift {
  id: string
  role: string
  day: string
  start_time: string
  end_time: string
  location: string
  address?: string | null
  total_slots: number
  filled_slots: number
  notes?: string | null
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
  role: string
  badges: string[]
  blocked: boolean
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

export interface VenueRecord {
  id: string
  name: string
  address: string
  maps_url?: string | null
  capacity?: number | null
}

export const EVENT_DAYS = [
  { date: '2026-05-04', label: 'Mon, May 4' },
  { date: '2026-05-05', label: 'Tue, May 5' },
  { date: '2026-05-06', label: 'Wed, May 6' },
  { date: '2026-05-07', label: 'Thu, May 7' },
  { date: '2026-05-08', label: 'Fri, May 8' },
] as const

export const DEFAULT_SHIFT_ROLE_SUGGESTIONS = [
  'ALL DAY - LOCATION CAPTAIN',
  'Building Runner',
  'Room Runner',
  'Volunteer Hub / Door Monitor',
] as const

export const DEFAULT_SHIFT_ROLE = DEFAULT_SHIFT_ROLE_SUGGESTIONS[1]

export function getShiftRoles(
  shifts: Array<Pick<VolunteerShift, 'role'>> = [],
  extraRoles: string[] = []
): string[] {
  const roles = [...shifts.map((shift) => shift.role), ...extraRoles]
    .map((role) => role.trim())
    .filter(Boolean)

  if (roles.length === 0) {
    return [...DEFAULT_SHIFT_ROLE_SUGGESTIONS]
  }

  return [...new Set(roles)].sort((left, right) => left.localeCompare(right))
}

/**
 * Default venue names used as a fallback until venue records are loaded.
 */
export const VENUE_NAMES = [
  'Boulder Associates',
  'Boulder Public Library',
  'Brand Studios',
  'Canyon Center',
  'Rosetta Hall',
  'SOVRN',
] as const

export const VENUE_ADDRESSES: Record<(typeof VENUE_NAMES)[number], string> = {
  'Boulder Associates': '1426 Pearl St #300, Boulder, CO 80302',
  'Boulder Public Library': '1001 Arapahoe Ave, Boulder, CO 80302',
  'Brand Studios': '1301 Walnut Street, Boulder, CO 80302',
  'Canyon Center': '1881 9th Street, Boulder, CO 80302',
  'Rosetta Hall': '1109 Walnut Street, Boulder, CO 80302',
  SOVRN: '1600 Pearl St #200, Boulder, CO 80302',
}

export const VENUE_MAPS_URLS: Record<(typeof VENUE_NAMES)[number], string> = {
  'Boulder Associates': 'https://maps.google.com/?q=Boulder+Associates',
  'Boulder Public Library': 'https://maps.google.com/?q=Boulder+Public+Library',
  'Brand Studios': 'https://maps.google.com/?q=Brand+Studios',
  'Canyon Center': 'https://maps.google.com/?q=Canyon+Center',
  'Rosetta Hall': 'https://maps.google.com/?q=Rosetta+Hall',
  SOVRN: 'https://maps.google.com/?q=SOVRN',
}
