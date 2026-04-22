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

export const SHIFT_ROLES = [
  'Room Runner',
  'Registration & Check-In',
  'Door Monitor',
  'Building Runner',
  'Session Host',
  'A/V & Tech Support',
  'Wayfinding',
  'Social Media',
  'Venue Setup',
  'Green Room',
] as const
