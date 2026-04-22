'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'

const MY_AVAILABILITY = ['2026-05-04', '2026-05-05', '2026-05-07']

const VOLUNTEER_LINKS = [
  { href: '/volunteers', label: 'Open Shifts' },
  { href: '/schedule', label: 'My Schedule' },
  { href: '/volunteers/my-availability', label: 'My Availability' },
  { href: '/profile', label: 'My Profile' },
]

const OLD_APP_ACCENT_FONT = '"Space Grotesk", Inter, system-ui, -apple-system, sans-serif'

const ROLE_INFO: Record<string, string> = {
  'Room Runner':
    "Set up chairs, hang banners, and prep the room before sessions start. You're the reason everything looks right when doors open.",
  'Registration & Check-In':
    'Greet attendees, scan tickets, and hand out lanyards. First impression of the whole week, so keep it warm and organized.',
  'Door Monitor':
    'Manage crowd flow, direct attendees, and help sessions stay calm and orderly when rooms get busy.',
  'Building Runner':
    'General support across the venue: moving supplies, troubleshooting logistics, and helping wherever things get tight.',
  'Session Host':
    "Introduce speakers, manage Q&A, and keep sessions on time. You're the glue between the room and the stage.",
  'A/V & Tech Support':
    'Set up mics, projectors, and livestream support. Best for volunteers comfortable with event tech.',
  Wayfinding:
    'Help attendees navigate between venues and key checkpoints around Boulder Startup Week.',
  'Social Media':
    'Capture highlights, post stories, and help the community see what is happening in real time.',
  'Venue Setup':
    'Handle chairs, tables, signage, and finishing touches before doors open.',
  'Green Room':
    'Support speakers before they go on and keep the space calm, stocked, and running smoothly.',
}

interface VolunteerShift {
  id: string
  role: string
  day: string
  start_time: string
  end_time: string
  location: string
  description?: string
  total_slots: number
  filled_slots: number
}

interface VolunteerShiftApiResponse {
  shifts?: VolunteerShift[]
  error?: string
}

export default function VolunteerPortal() {
  const [shifts, setShifts] = useState<VolunteerShift[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedDay, setSelectedDay] = useState('all')
  const [selectedRole, setSelectedRole] = useState('all')
  const [selectedLocation, setSelectedLocation] = useState('all')
  const [onlyMyAvailability, setOnlyMyAvailability] = useState(true)
  const [signedUp, setSignedUp] = useState<Set<string>>(new Set())
  const [showRecruitModal, setShowRecruitModal] = useState(() => {
    try {
      return !localStorage.getItem('bsw_recruit_modal_seen')
    } catch {
      return true
    }
  })

  useEffect(() => {
    let isMounted = true

    const loadShifts = async () => {
      try {
        const response = await fetch('/api/volunteers/shifts')
        const payload = (await response.json()) as VolunteerShiftApiResponse

        if (!response.ok) {
          throw new Error(payload.error || 'Failed to load volunteer shifts')
        }

        if (isMounted) {
          setShifts(payload.shifts || [])
        }
      } catch (error) {
        console.error('Error fetching shifts:', error)
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    void loadShifts()

    return () => {
      isMounted = false
    }
  }, [])

  const dayOptions = Array.from(new Set(shifts.map((shift) => shift.day)))
    .sort((a, b) => a.localeCompare(b))
    .map((day) => ({
      value: day,
      label: formatDayLabel(day).full,
    }))

  const roles = ['all', ...new Set(shifts.map((shift) => shift.role))].sort((a, b) =>
    a === 'all' ? -1 : b === 'all' ? 1 : a.localeCompare(b)
  )

  const locations = ['all', ...new Set(shifts.map((shift) => shift.location))]
  const hasAvailabilityOverlap = shifts.some((shift) => MY_AVAILABILITY.includes(shift.day))
  const showAvailabilityOnly = onlyMyAvailability && hasAvailabilityOverlap

  const filtered = shifts.filter((shift) => {
    if (showAvailabilityOnly && !MY_AVAILABILITY.includes(shift.day)) {
      return false
    }
    if (selectedDay !== 'all' && shift.day !== selectedDay) {
      return false
    }
    if (selectedRole !== 'all' && shift.role !== selectedRole) {
      return false
    }
    if (selectedLocation !== 'all' && shift.location !== selectedLocation) {
      return false
    }
    return true
  })

  const urgentShifts = filtered.filter((shift) => shift.filled_slots === 0)
  const openCount = shifts.filter((shift) => shift.filled_slots < shift.total_slots).length
  const availabilityDayLabels = MY_AVAILABILITY.map(
    (day) => formatDayLabel(day).short
  ).filter(Boolean)

  const clearFilters = () => {
    setSelectedDay('all')
    setSelectedRole('all')
    setSelectedLocation('all')
  }

  const handleSignUp = (shiftId: string, action: 'sign-up' | 'cancel') => {
    setSignedUp((previous) => {
      const next = new Set(previous)
      if (action === 'cancel') {
        next.delete(shiftId)
      } else {
        next.add(shiftId)
      }
      return next
    })
  }

  const dismissRecruitModal = () => {
    try {
      localStorage.setItem('bsw_recruit_modal_seen', '1')
    } catch {}
    setShowRecruitModal(false)
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f6f7f5]">
        <div className="text-center">
          <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-4 border-[#5aaeb3] border-t-transparent" />
          <p className="text-sm text-[#6f7883]">Loading shifts...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#f6f7f5] text-[#3f4a56]">
      <VolunteerNav />

      <section
        className="px-4 py-10 text-center md:py-8"
        style={{ background: 'linear-gradient(90deg, #5e9a98 0%, #b5aa5f 45%, #f39c3d 100%)' }}
      >
        <div className="mx-auto max-w-4xl">
          <h1
            className="text-4xl font-bold tracking-tight text-white md:text-[2.7rem]"
            style={{ fontFamily: OLD_APP_ACCENT_FONT }}
          >
            Volunteer at Boulder Startup Week 2026
          </h1>
          <p className="mx-auto mt-3 max-w-lg text-lg leading-8 text-white/95">
            {openCount} shifts need you. No sign-up fees. No corporate BS. Just real community work.
          </p>
          <button
            onClick={() => setShowRecruitModal(true)}
            className="mt-6 inline-flex rounded-sm bg-[#ef8f3d] px-10 py-3 text-base font-semibold text-white shadow-[4px_4px_0_rgba(26,26,26,0.85)] transition hover:translate-x-[2px] hover:translate-y-[2px] hover:bg-[#e98529] hover:shadow-[2px_2px_0_rgba(26,26,26,0.85)]"
          >
            Become a Volunteer
          </button>
        </div>
      </section>

      <main className="mx-auto max-w-4xl px-4 py-4 md:py-4">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-md border border-[#d6eced] bg-[#eef8f8] px-4 py-3">
          <p className="text-sm text-[#6aa9ae]">
            {showAvailabilityOnly ? (
              <>
                Showing shifts on your available days:{' '}
                <span className="font-semibold">{availabilityDayLabels.join(', ')}</span>
              </>
            ) : onlyMyAvailability ? (
              'Showing all shifts. Your saved availability does not match the current shift dates.'
            ) : (
              'Showing all shifts'
            )}
          </p>
          <div className="flex items-center gap-4 text-sm">
            <button
              onClick={() => setOnlyMyAvailability((current) => !current)}
              className="font-semibold text-[#5aaeb3] underline underline-offset-2 transition hover:text-[#4f9da2]"
            >
              {onlyMyAvailability ? 'Show all shifts' : 'Filter to my availability'}
            </button>
            <Link href="/profile" className="text-[#6f7883] transition hover:text-[#5aaeb3]">
              Edit availability →
            </Link>
          </div>
        </div>

        <div className="rounded-md border border-[#e6e8eb] bg-white p-4 shadow-[0_1px_2px_rgba(26,26,26,0.05)]">
          <div className="grid gap-3 sm:grid-cols-3">
            <FilterSelect
              label="Day"
              value={selectedDay}
              onChange={setSelectedDay}
              options={[
                { value: 'all', label: 'All Days' },
                ...dayOptions,
              ]}
            />
            <FilterSelect
              label="Role"
              value={selectedRole}
              onChange={setSelectedRole}
              options={[
                { value: 'all', label: 'All Roles' },
                ...roles
                  .filter((role) => role !== 'all')
                  .map((role) => ({ value: role, label: role })),
              ]}
            />
            <FilterSelect
              label="Location"
              value={selectedLocation}
              onChange={setSelectedLocation}
              options={[
                { value: 'all', label: 'All Locations' },
                ...locations
                  .filter((location) => location !== 'all')
                  .map((location) => ({ value: location, label: location })),
              ]}
            />
          </div>
        </div>

        <div className="mb-3 mt-4 flex items-center justify-between gap-3">
          <p className="text-sm text-[#7f8691]">
            {filtered.length} shift{filtered.length !== 1 ? 's' : ''}
          </p>
          {(selectedDay !== 'all' || selectedRole !== 'all' || selectedLocation !== 'all') && (
            <button
              onClick={clearFilters}
              className="text-sm font-medium text-[#6f7883] underline underline-offset-2 transition hover:text-[#5aaeb3]"
            >
              Clear filters
            </button>
          )}
        </div>

        {urgentShifts.length > 0 && (
          <section className="mb-6">
            <h2
              className="mb-3 text-[1.35rem] font-semibold text-[#ee7666]"
              style={{ fontFamily: OLD_APP_ACCENT_FONT }}
            >
              Priority Shifts
            </h2>
            <div className="rounded-lg border border-[#f0b8b1] bg-[#fff6f4] p-3 sm:p-4">
              <p className="mb-3 text-xs font-semibold text-[#ef8a7f]">
                These shifts have zero volunteers. They need you most.
              </p>
              <div className="grid gap-3 sm:grid-cols-2">
                {urgentShifts.map((shift) => (
                  <ShiftCard
                    key={shift.id}
                    shift={shift}
                    isSignedUp={signedUp.has(shift.id)}
                    onSignUp={handleSignUp}
                  />
                ))}
              </div>
            </div>
          </section>
        )}

        {filtered.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2">
            {filtered.map((shift) => (
              <ShiftCard
                key={shift.id}
                shift={shift}
                isSignedUp={signedUp.has(shift.id)}
                onSignUp={handleSignUp}
              />
            ))}
          </div>
        ) : (
          <div className="py-16 text-center">
            <p className="text-2xl text-[#7f8691]">No shifts match those filters.</p>
            <div className="mt-3 flex flex-col items-center gap-2">
              <button
                onClick={clearFilters}
                className="text-base font-medium text-[#79bec3] transition hover:text-[#5aaeb3]"
              >
                Clear filters
              </button>
              {onlyMyAvailability && (
                <button
                  onClick={() => setOnlyMyAvailability(false)}
                  className="text-sm text-[#6f7883] underline underline-offset-2 transition hover:text-[#5aaeb3]"
                >
                  Show shifts outside my availability
                </button>
              )}
            </div>
          </div>
        )}
      </main>

      {showRecruitModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={(event) => {
            if (event.target === event.currentTarget) {
              dismissRecruitModal()
            }
          }}
        >
          <div className="w-full max-w-md overflow-hidden rounded-md bg-white shadow-[0_18px_50px_rgba(15,23,42,0.24)]">
            <div
              className="relative px-6 pb-6 pt-8 text-center"
              style={{ background: 'linear-gradient(90deg, #5e9a98 0%, #b5aa5f 45%, #f39c3d 100%)' }}
            >
              <button
                onClick={dismissRecruitModal}
                aria-label="Close"
                className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-white/20 text-white transition hover:bg-white/30"
              >
                <CloseIcon />
              </button>
              <h2 className="text-3xl font-bold text-white" style={{ fontFamily: OLD_APP_ACCENT_FONT }}>
                Make Boulder Startup Week happen.
              </h2>
              <p className="mt-2 text-sm leading-6 text-white/95">
                Volunteers are the backbone of Boulder Startup Week. Be one of the people who makes the week feel welcoming, organized, and alive.
              </p>
            </div>

            <div className="flex flex-col gap-4 px-6 py-6">
              <div className="flex flex-col gap-2 text-sm text-[#6f7883]">
                <p className="font-semibold text-[#3f4a56]">Why volunteer?</p>
                {[
                  "Meet Boulder founders, builders, and community organizers",
                  'Get a behind-the-scenes role in making the week run smoothly',
                  'Choose shifts that fit your schedule',
                  'Help create a genuinely community-owned event',
                ].map((item) => (
                  <div key={item} className="flex items-start gap-3">
                    <span className="mt-0.5 font-bold text-[#5aaeb3]">✓</span>
                    <span>{item}</span>
                  </div>
                ))}
              </div>

              <Link
                href="/volunteers/signup"
                className="inline-flex w-full justify-center rounded-sm bg-[#ef8f3d] px-6 py-3 text-base font-semibold text-white shadow-[4px_4px_0_rgba(26,26,26,0.85)] transition hover:translate-x-[2px] hover:translate-y-[2px] hover:bg-[#e98529] hover:shadow-[2px_2px_0_rgba(26,26,26,0.85)]"
                onClick={dismissRecruitModal}
              >
                Become a Volunteer
              </Link>

              <button
                onClick={dismissRecruitModal}
                className="text-sm text-[#6f7883] transition hover:text-[#5aaeb3]"
              >
                Just browsing shifts for now
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function VolunteerNav() {
  return (
    <nav className="sticky top-0 z-30 border-b border-[#e6e8eb] bg-white">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between gap-4 px-4">
        <Link
          href="/volunteers"
          className="text-lg font-bold tracking-tight text-[#6aa9ae]"
          style={{ fontFamily: OLD_APP_ACCENT_FONT }}
        >
          BSW <span className="text-[#4a5563]">2026</span>
        </Link>

        <div className="flex flex-1 items-center justify-end gap-1 overflow-x-auto">
          {VOLUNTEER_LINKS.map((link) => {
            const isActive = link.href === '/volunteers'
            return (
              <Link
                key={`${link.label}-${link.href}`}
                href={link.href}
                className={`whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium transition ${
                  isActive
                    ? 'bg-[#eef8f8] text-[#6aa9ae]'
                    : 'text-[#6f7883] hover:bg-[#f6f7f5] hover:text-[#6aa9ae]'
                }`}
              >
                {link.label}
              </Link>
            )
          })}
        </div>
      </div>
    </nav>
  )
}

function FilterSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  options: Array<{ value: string; label: string }>
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-[11px] font-semibold uppercase tracking-[0.04em] text-[#7f8691]">
        {label}
      </span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-10 rounded-sm border border-[#d8dde3] bg-white px-4 text-sm text-[#505966] outline-none transition focus:border-[#6aa9ae]"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  )
}

function ShiftCard({
  shift,
  isSignedUp,
  onSignUp,
}: {
  shift: VolunteerShift
  isSignedUp: boolean
  onSignUp: (id: string, action: 'sign-up' | 'cancel') => void
}) {
  const [showRoleInfo, setShowRoleInfo] = useState(false)

  const open = Math.max(0, shift.total_slots - shift.filled_slots)
  const full = open === 0
  const pct = Math.round((shift.filled_slots / shift.total_slots) * 100)
  const almostFull = !full && pct >= 80
  const roleDescription = ROLE_INFO[shift.role]
  const description =
    shift.description ||
    roleDescription ||
    'Support the volunteer team and help this part of Boulder Startup Week run smoothly.'

  return (
    <article className="rounded-xl border border-[#e7ebef] bg-white p-4 shadow-[0_1px_2px_rgba(15,23,42,0.05)]">
      <div className="flex items-start justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-[#eef8f8] px-3 py-1 text-xs font-semibold text-[#7bb8bc]">
            {shift.role}
          </span>
          {roleDescription && (
            <div className="relative">
              <button
                type="button"
                aria-expanded={showRoleInfo}
                aria-label={`What does ${shift.role} do?`}
                onClick={() => setShowRoleInfo((current) => !current)}
                className="flex h-5 w-5 items-center justify-center rounded-full border border-[#e1e6ea] bg-[#f6f7f5] text-[11px] font-semibold text-[#8d94a0] transition hover:border-[#6aa9ae] hover:text-[#6aa9ae]"
              >
                ?
              </button>
              {showRoleInfo && (
                <div className="absolute left-0 top-7 z-10 w-64 rounded-md border border-[#e7ebef] bg-white p-3 text-xs leading-5 text-[#6f7883] shadow-[0_8px_20px_rgba(15,23,42,0.08)]">
                  <p className="mb-1 font-semibold text-[#3f4a56]">{shift.role}</p>
                  <p>{roleDescription}</p>
                  <button
                    type="button"
                    onClick={() => setShowRoleInfo(false)}
                    className="absolute right-2 top-2 text-[#a0a6af] transition hover:text-[#3f4a56]"
                    aria-label="Close role details"
                  >
                    ×
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {isSignedUp && (
          <span className="rounded-full bg-[#6aa9ae] px-3 py-1 text-xs font-semibold text-white">
            Signed up ✓
          </span>
        )}
      </div>

      <p className="mt-4 text-[15px] leading-7 text-[#6f7883]">{description}</p>

      <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1.5 text-sm text-[#505966]">
        <span className="flex items-center gap-1.5">
          <ClockIcon />
          {formatTimeLabel(shift.start_time)} - {formatTimeLabel(shift.end_time)}
        </span>
        <span className="flex items-center gap-1.5">
          <PinIcon />
          {shift.location}
        </span>
      </div>

      <div className="mt-3 flex flex-col gap-1.5">
        <div className="flex items-center justify-between text-xs">
          <span
            className={
              almostFull
                ? 'font-semibold text-[#ef8f3d]'
                : full
                  ? 'text-[#a0a6af]'
                  : 'text-[#6f7883]'
            }
          >
            {full
              ? 'Shift full'
              : almostFull
                ? `${open} spot${open !== 1 ? 's' : ''} left!`
                : `${open} of ${shift.total_slots} spots open`}
          </span>
          <span className="text-[#a0a6af]">{pct}%</span>
        </div>
        <div className="h-1.5 w-full rounded-full bg-[#eceff2]">
          <div
            className={`h-1.5 rounded-full ${
              pct === 100 ? 'bg-[#a0a6af]' : almostFull ? 'bg-[#ef8f3d]' : 'bg-[#6aa9ae]'
            }`}
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      <div className="mt-4 border-t border-[#eceff2] pt-3">
        {isSignedUp ? (
          <button
            onClick={() => onSignUp(shift.id, 'cancel')}
            className="text-sm font-medium text-[#ee7666] transition hover:underline"
          >
            Cancel sign-up
          </button>
        ) : (
          <button
            onClick={() => onSignUp(shift.id, 'sign-up')}
            disabled={full}
            className={`rounded-sm border-2 px-5 py-2 text-sm font-semibold transition ${
              full
                ? 'cursor-not-allowed border-[#c9d1d8] text-[#a0a6af]'
                : 'border-[#6aa9ae] text-[#6aa9ae] shadow-[3px_3px_0_rgba(31,41,55,0.85)] hover:translate-x-[2px] hover:translate-y-[2px] hover:bg-[#eef8f8] hover:shadow-[1px_1px_0_rgba(31,41,55,0.85)]'
            }`}
          >
            {full ? 'Full' : 'Sign up'}
          </button>
        )}
      </div>
    </article>
  )
}

function formatDayLabel(day: string) {
  const parsed = new Date(`${day}T12:00:00`)

  if (Number.isNaN(parsed.getTime())) {
    return { short: day, full: day }
  }

  return {
    short: parsed.toLocaleDateString('en-US', { weekday: 'short' }),
    full: parsed.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'short',
      day: 'numeric',
    }),
  }
}

function formatTimeLabel(value: string) {
  if (/^\d{2}:\d{2}$/.test(value)) {
    return value
  }

  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) {
    return value
  }

  return parsed.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
}

function ClockIcon() {
  return (
    <svg className="h-4 w-4 flex-shrink-0 text-[#6aa9ae]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <circle cx="12" cy="12" r="10" strokeWidth="2" />
      <path strokeLinecap="round" d="M12 6v6l4 2" strokeWidth="2" />
    </svg>
  )
}

function PinIcon() {
  return (
    <svg className="h-4 w-4 flex-shrink-0 text-[#6aa9ae]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
        d="M17.657 16.657 13.414 20.9a1.998 1.998 0 0 1-2.827 0l-4.244-4.243a8 8 0 1 1 11.314 0Z"
      />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
    </svg>
  )
}

function CloseIcon() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
    </svg>
  )
}
