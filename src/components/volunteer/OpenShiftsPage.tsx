'use client'

import Link from 'next/link'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { OpenShiftsCalendar } from '@/components/volunteer/OpenShiftsCalendar'
import { useAuth } from '@/contexts/auth-context'
import { useAuthModal } from '@/contexts/auth-modal-context'
import type { AssignmentStatus } from '@/lib/shifts/types'
import { EVENT_DAYS } from '@/lib/shifts/types'

const ROLE_INFO: Record<string, string> = {
  'ALL DAY - LOCATION CAPTAIN':
    'Own the venue for the day, support volunteers across shifts, and help keep operations calm and coordinated.',
  'Clean-up':
    'Help close out the venue, reset rooms, collect supplies, and make the final handoff feel easy.',
  'Clean-up/Load-out':
    'Pack supplies, support load-out logistics, and help the event team wrap the week cleanly.',
  'Elevator Runner':
    'Keep people moving between floors, answer quick wayfinding questions, and support room flow.',
  'Load-in/Setup':
    'Help get the event ready: move supplies, set up signs, prep tables, and make first impressions sparkle.',
  'Building Runner':
    'Jump in wherever the venue needs support: supplies, logistics, troubleshooting, and fast-moving coordination.',
  'Room Runner':
    'Prep rooms, support speakers, and keep sessions running smoothly from setup through reset.',
  'Volunteer Tshirts':
    'Help distribute volunteer shirts and make sure the morning crew starts organized and welcomed.',
  'Welcome Table':
    'Greet attendees, answer quick questions, and help people find the right room with confidence.',
  'Volunteer Hub / Door Monitor':
    'Welcome attendees, direct traffic, and help the venue feel organized, calm, and easy to navigate.',
  'Welcome Table / Door Monitor':
    'Welcome attendees, watch the doorway or check-in area, and keep arrivals moving smoothly.',
  'Welcome Table / Door Monitor & Cleanup':
    'Welcome attendees during the shift, then help tidy and reset the space before handoff.',
}

interface VolunteerShift {
  id: string
  role: string
  day: string
  start_time: string
  end_time: string
  location: string
  address?: string | null
  event_session_id?: string | null
  event_session?: EventSession | null
  total_slots: number
  filled_slots: number
  urgent: boolean
  notes?: string | null
}

interface EventSession {
  id: string
  title: string
  day: string
  start_time: string
  end_time: string
  location: string
  address?: string | null
}

interface VolunteerAssignment {
  id: string
  shift_id: string
  volunteer_id: string
  assigned_at: string | null
  status: AssignmentStatus
  shift: VolunteerShift | null
}

interface VolunteerRecord {
  id: string
  user_id: string | null
  phone: string | null
  availability: string[]
  status: string
  shift_count: number
}

interface VolunteerShiftApiResponse {
  shifts?: VolunteerShift[]
  error?: string
}

interface VolunteerContextResponse {
  volunteer?: VolunteerRecord | null
  assignments?: VolunteerAssignment[]
  error?: string
}

type ViewMode = 'list' | 'calendar'

interface ShiftRequestResponse {
  error?: string
  code?: string
  conflictingShift?: {
    role: string
    day: string
    start_time: string
    end_time: string
    location: string
    address?: string | null
    urgent?: boolean
    status: AssignmentStatus
  } | null
}

interface RequestFeedback {
  tone: 'success' | 'error'
  title: string
  description: string
}

export function OpenShiftsPage() {
  const { user, loading: authLoading } = useAuth()
  const { openSignInModal } = useAuthModal()
  const [shifts, setShifts] = useState<VolunteerShift[]>([])
  const [loading, setLoading] = useState(true)
  const [contextLoading, setContextLoading] = useState(true)
  const [selectedDay, setSelectedDay] = useState<string[]>([])
  const [selectedRole, setSelectedRole] = useState<string[]>([])
  const [selectedLocation, setSelectedLocation] = useState<string[]>([])
  const [selectedTime, setSelectedTime] = useState<string[]>([])
  const [onlyMyAvailability, setOnlyMyAvailability] = useState(true)
  const [showFullShifts, setShowFullShifts] = useState(false)
  const [volunteer, setVolunteer] = useState<VolunteerRecord | null>(null)
  const [assignments, setAssignments] = useState<VolunteerAssignment[]>([])
  const [submittingShiftId, setSubmittingShiftId] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [calendarDay, setCalendarDay] = useState<string>(EVENT_DAYS[0]?.date ?? '')
  const [viewMode, setViewMode] = useState<ViewMode>('list')
  const [selectedCalendarShiftId, setSelectedCalendarShiftId] = useState<string | null>(null)
  const [highlightedShiftId, setHighlightedShiftId] = useState<string | null>(null)
  const [requestFeedback, setRequestFeedback] = useState<RequestFeedback | null>(null)
  const [confirmShift, setConfirmShift] = useState<VolunteerShift | null>(null)
  const shiftCardRefs = useRef<Record<string, HTMLDivElement | null>>({})

  const loadShifts = useCallback(async () => {
    const response = await fetch('/api/volunteers/shifts')
    const payload = (await response.json()) as VolunteerShiftApiResponse

    if (!response.ok) {
      throw new Error(payload.error || 'Failed to load volunteer shifts')
    }

    setShifts(payload.shifts || [])
  }, [])

  const loadContext = useCallback(async () => {
    if (!user) {
      setVolunteer(null)
      setAssignments([])
      setContextLoading(false)
      return
    }

    const response = await fetch('/api/volunteers/me')
    const payload = (await response.json()) as VolunteerContextResponse

    if (!response.ok) {
      throw new Error(payload.error || 'Failed to load your volunteer profile')
    }

    const nextVolunteer = payload.volunteer ?? null
    setVolunteer(nextVolunteer)
    setAssignments(payload.assignments || [])
    setContextLoading(false)
  }, [user])

  const refreshPortal = useCallback(async () => {
    setErrorMessage(null)

    try {
      await Promise.all([loadShifts(), loadContext()])
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : 'Failed to load volunteer portal'
      )
    } finally {
      setLoading(false)
      setContextLoading(false)
    }
  }, [loadContext, loadShifts])

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void refreshPortal()
    }, 0)

    return () => {
      window.clearTimeout(timeoutId)
    }
  }, [refreshPortal])

  const activeAssignments = useMemo(
    () => assignments.filter((assignment) => assignment.status !== 'cancelled'),
    [assignments]
  )

  const assignmentByShiftId = useMemo(
    () => new Map(activeAssignments.map((assignment) => [assignment.shift_id, assignment])),
    [activeAssignments]
  )

  const assignmentStatusByShiftId = useMemo(
    () =>
      new Map(
        activeAssignments.map((assignment) => [assignment.shift_id, assignment.status] satisfies [
          string,
          AssignmentStatus,
        ])
      ),
    [activeAssignments]
  )

  const availability = useMemo(() => volunteer?.availability ?? [], [volunteer?.availability])
  const hasVolunteerSetup = Boolean(volunteer?.phone?.trim() && availability.length > 0)
  const hasAvailabilityOverlap = shifts.some((shift) => availability.includes(shift.day))
  const showAvailabilityOnly =
    Boolean(user) && onlyMyAvailability && availability.length > 0 && hasAvailabilityOverlap

  const filtered = useMemo(
    () =>
      shifts.filter((shift) => {
        if (showAvailabilityOnly && !availability.includes(shift.day)) return false
        if (!showFullShifts && shift.filled_slots >= shift.total_slots) return false
        if (selectedDay.length > 0 && !selectedDay.includes(shift.day)) return false
        if (selectedRole.length > 0 && !selectedRole.includes(shift.role)) return false
        if (selectedLocation.length > 0 && !selectedLocation.includes(getShiftLocation(shift))) return false
        if (selectedTime.length > 0 && !selectedTime.includes(shift.start_time)) return false
        return true
      }),
    [availability, selectedDay, selectedLocation, selectedRole, selectedTime, shifts, showAvailabilityOnly, showFullShifts]
  )

  const filteredDays = useMemo(
    () => Array.from(new Set(filtered.map((shift) => shift.day))).sort((a, b) => a.localeCompare(b)),
    [filtered]
  )

  const activeCalendarDay = useMemo(() => {
    if (filteredDays.length === 0) return ''
    return filteredDays.includes(calendarDay) ? calendarDay : filteredDays[0]
  }, [calendarDay, filteredDays])

  const urgentShifts = filtered.filter((shift) => shift.urgent)
  const nonUrgentShifts = filtered.filter((shift) => !shift.urgent)
  const groupedUrgentShifts = useMemo(
    () => groupShiftsByDay(urgentShifts),
    [urgentShifts]
  )
  const groupedNonUrgentShifts = useMemo(
    () => groupShiftsByDay(nonUrgentShifts),
    [nonUrgentShifts]
  )
  const openCount = shifts.filter((shift) => shift.filled_slots < shift.total_slots).length

  // Overall coverage percentage
  const coveragePct = useMemo(() => {
    const totalSlots = shifts.reduce((sum, s) => sum + s.total_slots, 0)
    const filledSlots = shifts.reduce((sum, s) => sum + s.filled_slots, 0)
    return totalSlots > 0 ? Math.round((filledSlots / totalSlots) * 100) : 0
  }, [shifts])

  const selectedCalendarShift = useMemo(() => {
    if (!selectedCalendarShiftId) return null
    return filtered.find((shift) => shift.id === selectedCalendarShiftId) ?? null
  }, [filtered, selectedCalendarShiftId])

  const dayOptions = Array.from(new Set(shifts.map((shift) => shift.day)))
    .sort((a, b) => a.localeCompare(b))
    .map((day) => ({
      value: day,
      label: formatDayLabel(day).full,
    }))

  const roles = Array.from(new Set(shifts.map((shift) => shift.role))).sort((a, b) =>
    a.localeCompare(b)
  )
  const locations = Array.from(new Set(shifts.map((shift) => getShiftLocation(shift))))

  const timeOptions = Array.from(new Set(shifts.map((shift) => shift.start_time)))
    .sort((a, b) => a.localeCompare(b))
    .map((time) => ({ value: time, label: formatTimeLabel(time) }))

  const clearFilters = () => {
    setSelectedDay([])
    setSelectedRole([])
    setSelectedLocation([])
    setSelectedTime([])
  }

  useEffect(() => {
    if (!message) return
    const timeoutId = window.setTimeout(() => {
      setMessage(null)
    }, 2200)

    return () => {
      window.clearTimeout(timeoutId)
    }
  }, [message])

  const redirectToSignIn = () => {
    openSignInModal({ nextPath: '/open-shifts' })
  }

  const handlePrimaryAction = (shift: VolunteerShift) => {
    setErrorMessage(null)
    setMessage(null)
    setRequestFeedback(null)

    if (!user) {
      redirectToSignIn()
      return
    }

    if (!hasVolunteerSetup) {
      setRequestFeedback({
        tone: 'error',
        title: 'Complete your volunteer setup',
        description:
          'Add your phone number and at least one available day before signing up for a shift.',
      })
      return
    }

    setConfirmShift(shift)
  }

  const handleConfirmSignUp = async () => {
    if (!confirmShift) return
    const shift = confirmShift
    setConfirmShift(null)

    setSubmittingShiftId(shift.id)
    try {
      const response = await fetch('/api/volunteers/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ shiftId: shift.id }),
      })

      const payload = (await response.json().catch(() => ({}))) as ShiftRequestResponse

      if (!response.ok) {
        if (payload.code === 'VOLUNTEER_SETUP_REQUIRED') {
          setRequestFeedback({
            tone: 'error',
            title: 'Complete your volunteer setup',
            description:
              payload.error ||
              'Add your phone number and at least one available day before signing up for a shift.',
          })
          return
        }

        if (payload.code === 'SHIFT_CONFLICT' && payload.conflictingShift) {
          const conflictingShift = payload.conflictingShift
          const conflictStatus =
            conflictingShift.status === 'assigned' ? 'already on your schedule' : 'already requested'

          setRequestFeedback({
            tone: 'error',
            title: 'That shift conflicts with another one',
            description: `You are ${conflictStatus} for ${conflictingShift.role} on ${formatDayLabel(
              conflictingShift.day
            ).full} from ${formatTimeLabel(conflictingShift.start_time)} to ${formatTimeLabel(
              conflictingShift.end_time
            )} at ${conflictingShift.location}.`,
          })
          return
        }

        if (payload.code === 'SHIFT_NOT_FOUND') {
          await Promise.all([loadShifts(), loadContext()])
          setRequestFeedback({
            tone: 'error',
            title: 'This shift changed',
            description:
              'This shift was updated or removed. Please choose from the refreshed shift list.',
          })
          return
        }

        setRequestFeedback({
          tone: 'error',
          title: 'Could not sign you up',
          description: payload.error || 'Failed to submit volunteer request',
        })
        return
      }

      await Promise.all([loadShifts(), loadContext()])
      const locationLabel = [getShiftLocation(shift), getShiftAddress(shift)].filter(Boolean).join(', ')
      setRequestFeedback({
        tone: 'success',
        title: 'You are signed up',
        description: `${shift.role} on ${formatDayLabel(shift.day).full} from ${formatTimeLabel(
          shift.start_time
        )} to ${formatTimeLabel(shift.end_time)} at ${locationLabel} is now on your schedule.`,
      })
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : 'Failed to submit volunteer request'
      )
    } finally {
      setSubmittingShiftId(null)
    }
  }

  const handleCancel = async (shift: VolunteerShift) => {
    const assignment = assignmentByShiftId.get(shift.id)
    if (!assignment) return

    setErrorMessage(null)
    setMessage(null)
    setSubmittingShiftId(shift.id)

    try {
      const response = await fetch(
        `/api/volunteers/requests?shiftId=${encodeURIComponent(shift.id)}`,
        { method: 'DELETE' }
      )
      const payload = (await response.json().catch(() => ({}))) as { error?: string }

      if (!response.ok) {
        throw new Error(payload.error || 'Failed to cancel sign-up')
      }

      await Promise.all([loadShifts(), loadContext()])
      setMessage('Sign-up cancelled.')
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Failed to cancel sign-up')
    } finally {
      setSubmittingShiftId(null)
    }
  }

  const handleSelectShiftFromCalendar = (shiftId: string) => {
    setSelectedCalendarShiftId(shiftId)
  }

  const handleOpenShiftFromCalendar = (shift: VolunteerShift) => {
    setViewMode('list')
    setSelectedCalendarShiftId(shift.id)
    setHighlightedShiftId(shift.id)
    setSelectedDay([shift.day])

    window.setTimeout(() => {
      const element = shiftCardRefs.current[shift.id]
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }
    }, 0)
  }

  useEffect(() => {
    if (!highlightedShiftId) return

    const timeoutId = window.setTimeout(() => {
      setHighlightedShiftId(null)
    }, 1200)

    return () => {
      window.clearTimeout(timeoutId)
    }
  }, [highlightedShiftId])

  if (loading || authLoading || contextLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f6f7f5]">
        <div className="text-center">
          <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-4 border-[#5aaeb3] border-t-transparent" />
          <p className="text-sm text-[#6f7883]">Loading volunteer portal...</p>
        </div>
      </div>
    )
  }

  return (
    <>
      <section
        className="px-4 py-10 text-center md:py-8"
        style={{ background: 'linear-gradient(90deg, #5e9a98 0%, #b5aa5f 45%, #f39c3d 100%)' }}
      >
        <div className="mx-auto max-w-6xl">
          <h1
            className="text-4xl font-bold tracking-tight text-white md:text-[2.7rem]"
            style={{ fontFamily: 'var(--font-accent)' }}
          >
            Volunteer at Boulder Startup Week 2026
          </h1>
          <p className="mx-auto mt-3 max-w-lg text-lg leading-8 text-white/95">
            We&apos;re at {coveragePct}% coverage — {openCount} shifts still need someone. Everything you see here is up for grabs.
          </p>
        </div>
      </section>

      <main className="mx-auto max-w-6xl px-4 py-4 md:py-4">
        {message && (
          <div className="fixed right-4 top-20 z-40 rounded-md border border-[#cde7e7] bg-[#eef8f8] px-4 py-3 text-sm text-[#2f6d71] shadow-[0_10px_30px_rgba(47,109,113,0.18)]">
            {message}
          </div>
        )}

        {errorMessage && (
          <div className="mb-4 rounded-md border border-[#f0b8b1] bg-[#fff6f4] px-4 py-3 text-sm text-[#b45446]">
            {errorMessage}
          </div>
        )}

        {!user ? (
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-md border border-[#eadfa2] bg-[#fff9df] px-4 py-3">
            <p className="text-sm text-[#776c2d]">
              Browse every shift now. Sign in when you are ready to request one.
            </p>
            <button
              onClick={redirectToSignIn}
              className="text-sm font-semibold text-[#5a7e7b] underline underline-offset-2"
            >
              Sign in →
            </button>
          </div>
        ) : null}

        <div className="rounded-md border border-[#e6e8eb] bg-white p-4 shadow-[0_1px_2px_rgba(26,26,26,0.05)]">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.04em] text-[#7f8691]">
                Browse Mode
              </p>
              <div className="mt-2 inline-flex rounded-full border border-[#d8dde3] bg-[#f6f7f5] p-1">
                {(
                  [
                    { value: 'list', label: `List (${filtered.length})` },
                    { value: 'calendar', label: 'Calendar' },
                  ] as const
                ).map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setViewMode(option.value)}
                    className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                      viewMode === option.value
                        ? 'bg-white text-[#3f4a56] shadow-[0_1px_2px_rgba(26,26,26,0.08)]'
                        : 'text-[#6f7883] hover:text-[#5aaeb3]'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-4 lg:flex-1">
              <FilterMultiSelect
                label="Day"
                values={selectedDay}
                onChange={setSelectedDay}
                options={dayOptions}
                placeholder="All Days"
              />
              <FilterMultiSelect
                label="Role"
                values={selectedRole}
                onChange={setSelectedRole}
                options={roles.map((role) => ({ value: role, label: role }))}
                placeholder="All Roles"
              />
              <FilterMultiSelect
                label="Location"
                values={selectedLocation}
                onChange={setSelectedLocation}
                options={locations.map((location) => ({ value: location, label: location }))}
                placeholder="All Locations"
              />
              <FilterMultiSelect
                label="Time"
                values={selectedTime}
                onChange={setSelectedTime}
                options={timeOptions}
                placeholder="All Times"
              />
            </div>
          </div>

          {user && availability.length > 0 ? (
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#dbe7e8] bg-[#f8fbfb] px-3 py-2.5">
              <p className="text-sm text-[#5f6772]">
                {showAvailabilityOnly ? 'Showing your saved availability:' : 'Saved availability:'}{' '}
                <span className="font-semibold text-[#3f4a56]">
                  {formatAvailabilitySummary(availability)}
                </span>
              </p>
              <div className="flex flex-wrap items-center gap-3 text-sm">
                <Link
                  href="/profile"
                  className="font-semibold text-[#5aaeb3] underline underline-offset-2 transition hover:text-[#4f9da2]"
                >
                  Edit in profile
                </Link>
                {showAvailabilityOnly ? (
                  <button
                    type="button"
                    onClick={() => setOnlyMyAvailability(false)}
                    className="font-semibold text-[#6f7883] underline underline-offset-2 transition hover:text-[#3f4a56]"
                  >
                    Show all days
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setOnlyMyAvailability(true)}
                    className="font-semibold text-[#5aaeb3] underline underline-offset-2 transition hover:text-[#4f9da2]"
                  >
                    Use my days
                  </button>
                )}
              </div>
            </div>
          ) : null}

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-[#eef1f4] pt-4">
            <div className="flex flex-wrap gap-3 text-sm text-[#6f7883]">
              <span>{filtered.length} matching shifts</span>
              <span>{urgentShifts.length} urgent</span>
              <span>{filteredDays.length} day view{filteredDays.length !== 1 ? 's' : ''}</span>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <label className="flex cursor-pointer items-center gap-2 text-sm text-[#6f7883]">
                <input
                  type="checkbox"
                  checked={showFullShifts}
                  onChange={(e) => setShowFullShifts(e.target.checked)}
                  className="rounded border-[#d8dde3] text-[#6aa9ae] focus:ring-[#6aa9ae]"
                />
                Show full shifts
              </label>
              {(selectedDay.length > 0 ||
                selectedRole.length > 0 ||
                selectedLocation.length > 0 ||
                selectedTime.length > 0) && (
                <button
                  onClick={clearFilters}
                  className="text-sm font-medium text-[#6f7883] underline underline-offset-2 transition hover:text-[#5aaeb3]"
                >
                  Clear filters
                </button>
              )}
            </div>
          </div>
        </div>

        {viewMode === 'calendar' ? (
          filteredDays.length > 0 && activeCalendarDay ? (
            <div className="mt-6">
              <OpenShiftsCalendar
                shifts={filtered}
                activeDay={activeCalendarDay}
                availableDays={filteredDays}
                assignmentStatusByShiftId={assignmentStatusByShiftId}
                onActiveDayChange={setCalendarDay}
                onSelectShift={handleSelectShiftFromCalendar}
              />
            </div>
          ) : (
            <div className="mt-6 rounded-xl border border-[#e7ebef] bg-white px-6 py-12 text-center">
              <p className="text-lg text-[#6f7883]">No shifts match the current filters.</p>
              <p className="mt-2 text-sm text-[#8d94a0]">
                Try broadening the day, role, location, or time filters.
              </p>
            </div>
          )
        ) : filtered.length > 0 ? (
          <div className="mt-6 space-y-6">
            {urgentShifts.length > 0 && (
              <section className="rounded-2xl border border-[#f1b9a7] bg-[#fff7f1] p-4 shadow-[0_10px_30px_rgba(239,143,61,0.08)] sm:p-5">
                <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#d46d2d]">
                      Admin Flagged
                    </p>
                    <h2
                      className="mt-1 text-2xl font-semibold text-[#9e4f25]"
                      style={{ fontFamily: 'var(--font-accent)' }}
                    >
                      Urgent Shifts
                    </h2>
                  </div>
                  <p className="max-w-xl text-sm leading-6 text-[#9e6144]">
                    These shifts were marked urgent by the volunteer team because they need extra attention.
                  </p>
                </div>
                <ShiftDayGroups
                  groups={groupedUrgentShifts}
                  assignmentByShiftId={assignmentByShiftId}
                  submittingShiftId={submittingShiftId}
                  highlightedShiftId={highlightedShiftId}
                  shiftCardRefs={shiftCardRefs}
                  onRequest={handlePrimaryAction}
                  onCancel={handleCancel}
                />
              </section>
            )}

            {nonUrgentShifts.length > 0 && (
              <section>
                {urgentShifts.length > 0 && (
                  <div className="mb-4">
                    <h2
                      className="text-2xl font-semibold text-[#3f4a56]"
                      style={{ fontFamily: 'var(--font-accent)' }}
                    >
                      All Other Matching Shifts
                    </h2>
                    <p className="mt-1 text-sm text-[#6f7883]">
                      Browse the rest of the available schedule by day.
                    </p>
                  </div>
                )}
                <ShiftDayGroups
                  groups={groupedNonUrgentShifts}
                  assignmentByShiftId={assignmentByShiftId}
                  submittingShiftId={submittingShiftId}
                  highlightedShiftId={highlightedShiftId}
                  shiftCardRefs={shiftCardRefs}
                  onRequest={handlePrimaryAction}
                  onCancel={handleCancel}
                />
              </section>
            )}
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
              {onlyMyAvailability && availability.length > 0 && (
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

        {viewMode === 'calendar' && selectedCalendarShiftId && selectedCalendarShift ? (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-[#1f2937]/45 px-4 py-6"
            onClick={() => setSelectedCalendarShiftId(null)}
          >
            <div
              className="w-full max-w-xl rounded-2xl bg-white p-5 shadow-[0_24px_60px_rgba(15,23,42,0.24)]"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="mb-4 flex items-start justify-between gap-4">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.04em] text-[#7f8691]">
                    Confirm Sign-Up
                  </p>
                  <p className="mt-1 text-sm text-[#6f7883]">
                    Review the shift details, then request it or switch to list view.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedCalendarShiftId(null)}
                  className="rounded-full border border-[#d8dde3] p-2 text-[#6f7883] transition hover:border-[#6aa9ae] hover:text-[#6aa9ae]"
                  aria-label="Close shift details"
                >
                  <CloseIcon />
                </button>
              </div>

              <ShiftCard
                shift={selectedCalendarShift}
                relationshipStatus={
                  assignmentByShiftId.get(selectedCalendarShift.id)?.status ?? null
                }
                submitting={submittingShiftId === selectedCalendarShift.id}
                onRequest={() => handlePrimaryAction(selectedCalendarShift)}
                onCancel={() => handleCancel(selectedCalendarShift)}
              />

              <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => handleOpenShiftFromCalendar(selectedCalendarShift)}
                  className="ml-auto cursor-pointer text-sm font-semibold text-[#5aaeb3] underline underline-offset-2 transition hover:text-[#4f9da2]"
                >
                  Open this in list view
                </button>
              </div>
            </div>
          </div>
        ) : null}

        {confirmShift ? (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-[#1f2937]/45 px-4 py-6"
            onClick={() => setConfirmShift(null)}
          >
            <div
              className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-[0_24px_60px_rgba(15,23,42,0.24)]"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.04em] text-[#5f8f92]">
                    Confirm Sign-Up
                  </p>
                  <h2 className="mt-1 text-2xl font-semibold text-[#3f4a56]">
                    {confirmShift.role}
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={() => setConfirmShift(null)}
                  className="rounded-full border border-[#d8dde3] p-2 text-[#6f7883] transition hover:border-[#6aa9ae] hover:text-[#6aa9ae]"
                  aria-label="Cancel sign-up"
                >
                  <CloseIcon />
                </button>
              </div>
              <div className="mt-4 flex flex-col gap-2 rounded-lg border border-[#dbe7e8] bg-[#f6fafa] px-4 py-3 text-sm text-[#505966]">
                <div className="flex items-center gap-2">
                  <CalendarIcon />
                  <span>{formatDayLabel(confirmShift.day).full}</span>
                </div>
                <div className="flex items-center gap-2">
                  <ClockIcon />
                  <span>{formatTimeLabel(confirmShift.start_time)} – {formatTimeLabel(confirmShift.end_time)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <PinIcon />
                  <span>
                    Event location: {getShiftLocation(confirmShift)}
                    {getShiftAddress(confirmShift) ? `, ${getShiftAddress(confirmShift)}` : ''}
                  </span>
                </div>
              </div>
              <a
                href={getDirectionsHref(confirmShift)}
                target="_blank"
                rel="noreferrer"
                className="mt-3 inline-flex text-sm font-semibold text-[#5aaeb3] underline underline-offset-2 transition hover:text-[#4f9da2]"
              >
                Open directions
              </a>
              <p className="mt-4 text-sm leading-6 text-[#6f7883]">
                Ready to sign up for this shift? You can cancel later from your schedule.
              </p>
              <div className="mt-6 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setConfirmShift(null)}
                  className="rounded-md border border-[#d8dde3] px-4 py-2 text-sm font-semibold text-[#6f7883] transition hover:border-[#a0a6af] hover:text-[#505966]"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => { void handleConfirmSignUp() }}
                  className="rounded-md bg-[#6aa9ae] px-5 py-2 text-sm font-semibold text-white transition hover:bg-[#5b9ea3]"
                >
                  Yes, sign me up
                </button>
              </div>
            </div>
          </div>
        ) : null}

        {requestFeedback ? (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-[#1f2937]/45 px-4 py-6"
            onClick={() => setRequestFeedback(null)}
          >
            <div
              className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-[0_24px_60px_rgba(15,23,42,0.24)]"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p
                    className={`text-[11px] font-semibold uppercase tracking-[0.04em] ${
                      requestFeedback.tone === 'success' ? 'text-[#5f8f92]' : 'text-[#b45446]'
                    }`}
                  >
                    {requestFeedback.tone === 'success' ? 'Signup Confirmed' : 'Could Not Sign You Up'}
                  </p>
                  <h2 className="mt-1 text-2xl font-semibold text-[#3f4a56]">
                    {requestFeedback.title}
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={() => setRequestFeedback(null)}
                  className="rounded-full border border-[#d8dde3] p-2 text-[#6f7883] transition hover:border-[#6aa9ae] hover:text-[#6aa9ae]"
                  aria-label="Close request feedback"
                >
                  <CloseIcon />
                </button>
              </div>
              <p className="mt-4 text-sm leading-6 text-[#6f7883]">{requestFeedback.description}</p>
              <div className="mt-6 flex justify-end">
                <button
                  type="button"
                  onClick={() => setRequestFeedback(null)}
                  className={`rounded-md px-4 py-2 text-sm font-semibold transition ${
                    requestFeedback.tone === 'success'
                      ? 'bg-[#6aa9ae] text-white hover:bg-[#5b9ea3]'
                      : 'bg-[#ef8f3d] text-white hover:bg-[#e98529]'
                  }`}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </main>
    </>
  )
}

function FilterMultiSelect({
  label,
  values,
  onChange,
  options,
  placeholder = 'All',
}: {
  label: string
  values: string[]
  onChange: (values: string[]) => void
  options: Array<{ value: string; label: string }>
  placeholder?: string
}) {
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleToggle = (value: string) => {
    if (values.includes(value)) {
      onChange(values.filter((item) => item !== value))
    } else {
      onChange([...values, value])
    }
  }

  const handleClear = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation()
    onChange([])
  }

  const displayValue =
    values.length === 0
      ? placeholder
      : values.length === 1
        ? options.find((option) => option.value === values[0])?.label
        : `${values.length} selected`

  return (
    <div className="relative flex flex-col gap-1" ref={containerRef}>
      <span className="text-[11px] font-semibold uppercase tracking-[0.04em] text-[#7f8691]">
        {label}
      </span>
      <div
        onClick={() => setOpen(!open)}
        className="flex h-10 cursor-pointer items-center justify-between rounded-sm border border-[#d8dde3] bg-white px-4 text-sm text-[#505966] outline-none transition hover:border-[#6aa9ae]"
      >
        <span className="truncate pr-2">{displayValue}</span>
        <div className="flex items-center gap-1">
          {values.length > 0 && (
            <button
              type="button"
              onClick={handleClear}
              className="text-[#a0a6af] hover:text-[#505966]"
            >
              <CloseIcon />
            </button>
          )}
          <svg
            className={`h-4 w-4 text-[#a0a6af] transition-transform ${open ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>
      {open && (
        <div className="absolute top-full z-10 mt-1 max-h-60 w-full overflow-auto rounded-md border border-[#e7ebef] bg-white py-1 shadow-lg">
          {options.map((option) => (
            <label
              key={option.value}
              className="flex cursor-pointer items-center gap-2 px-4 py-2 text-sm hover:bg-[#f6f7f5]"
            >
              <input
                type="checkbox"
                checked={values.includes(option.value)}
                onChange={() => handleToggle(option.value)}
                className="rounded border-[#d8dde3] text-[#6aa9ae] focus:ring-[#6aa9ae]"
              />
              <span className="text-[#505966]">{option.label}</span>
            </label>
          ))}
        </div>
      )}
    </div>
  )
}

interface ShiftDayGroup {
  day: string
  shifts: VolunteerShift[]
}

function groupShiftsByDay(shifts: VolunteerShift[]): ShiftDayGroup[] {
  const groups = new Map<string, VolunteerShift[]>()

  for (const shift of shifts) {
    const current = groups.get(shift.day) ?? []
    current.push(shift)
    groups.set(shift.day, current)
  }

  return [...groups.entries()]
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([day, dayShifts]) => ({
      day,
      shifts: [...dayShifts].sort(
        (left, right) =>
          left.start_time.localeCompare(right.start_time) ||
          left.location.localeCompare(right.location) ||
          left.role.localeCompare(right.role)
      ),
    }))
}

function ShiftDayGroups({
  groups,
  assignmentByShiftId,
  submittingShiftId,
  highlightedShiftId,
  shiftCardRefs,
  onRequest,
  onCancel,
}: {
  groups: ShiftDayGroup[]
  assignmentByShiftId: Map<string, VolunteerAssignment>
  submittingShiftId: string | null
  highlightedShiftId: string | null
  shiftCardRefs: React.MutableRefObject<Record<string, HTMLDivElement | null>>
  onRequest: (shift: VolunteerShift) => void
  onCancel: (shift: VolunteerShift) => void
}) {
  const [collapsedDays, setCollapsedDays] = useState<Set<string>>(() => new Set())

  const toggleDay = (day: string) => {
    setCollapsedDays((current) => {
      const next = new Set(current)
      if (next.has(day)) {
        next.delete(day)
      } else {
        next.add(day)
      }
      return next
    })
  }

  return (
    <div className="space-y-4">
      {groups.map((group) => {
        const collapsed = collapsedDays.has(group.day)

        return (
          <section
            key={group.day}
            className="overflow-visible rounded-2xl border border-[#dfe8e8] bg-white shadow-[0_12px_34px_rgba(49,88,92,0.08)]"
          >
            <button
              type="button"
              onClick={() => toggleDay(group.day)}
              aria-expanded={!collapsed}
              className="flex w-full flex-wrap items-center justify-between gap-3 rounded-t-2xl border-b border-[#e4eeee] bg-[linear-gradient(135deg,#f6fbfb_0%,#fff8ef_100%)] px-4 py-3 text-left transition hover:brightness-[0.99]"
            >
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#7bb8bc]">
                  {formatDayLabel(group.day).short}
                </p>
                <h3
                  className="text-xl font-semibold text-[#3f4a56]"
                  style={{ fontFamily: 'var(--font-accent)' }}
                >
                  {formatDayLabel(group.day).full}
                </h3>
              </div>
              <span className="flex items-center gap-2">
                <span className="rounded-full bg-[#eef8f8] px-3 py-1 text-xs font-semibold text-[#5f969a]">
                  {group.shifts.length} shift{group.shifts.length !== 1 ? 's' : ''}
                </span>
                <span className="flex h-8 w-8 items-center justify-center rounded-full border border-[#dbe7e8] bg-white/80 text-[#6aa9ae] transition">
                  <svg
                    className={`h-4 w-4 transition-transform ${collapsed ? '' : 'rotate-180'}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </span>
              </span>
            </button>
            {!collapsed ? (
              <div className="grid gap-2 rounded-b-2xl bg-[#f7fbfb] p-2 lg:grid-cols-2">
                {group.shifts.map((shift) => (
                  <div
                    key={shift.id}
                    ref={(element) => {
                      shiftCardRefs.current[shift.id] = element
                    }}
                  >
                    <ShiftCard
                      shift={shift}
                      relationshipStatus={assignmentByShiftId.get(shift.id)?.status ?? null}
                      submitting={submittingShiftId === shift.id}
                      onRequest={() => onRequest(shift)}
                      onCancel={() => onCancel(shift)}
                      highlight={highlightedShiftId === shift.id}
                    />
                  </div>
                ))}
              </div>
            ) : null}
          </section>
        )
      })}
    </div>
  )
}

function ShiftCard({
  shift,
  relationshipStatus,
  submitting,
  onRequest,
  onCancel,
  highlight = false,
}: {
  shift: VolunteerShift
  relationshipStatus: AssignmentStatus | null
  submitting: boolean
  onRequest: () => void
  onCancel: () => void
  highlight?: boolean
}) {
  const open = Math.max(0, shift.total_slots - shift.filled_slots)
  const full = open === 0
  const roleDescription = ROLE_INFO[shift.role]
  const description =
    roleDescription ||
    'Support the volunteer team and help this part of Boulder Startup Week run smoothly.'
  const directionsHref = getDirectionsHref(shift)

  const isRequested = relationshipStatus === 'requested'
  const isAssigned = relationshipStatus === 'assigned'
  const canRequest = !full && !isRequested && !isAssigned
  // Only show status badge for non-available states (don't show "Open" on the Open Shifts page)
  const showStatus = isAssigned || isRequested || full
  const statusLabel = isAssigned
    ? 'Assigned'
    : isRequested
      ? 'Requested'
      : full
        ? `Full (${shift.filled_slots}/${shift.total_slots})`
        : ''
  const slotsLabel = shift.total_slots > 1
    ? `${shift.filled_slots}/${shift.total_slots} filled`
    : null
  const statusClassName = isAssigned
    ? 'bg-[#6aa9ae] text-white'
    : isRequested
      ? 'bg-[#fff1dc] text-[#ef8f3d]'
      : 'bg-[#eef0f2] text-[#7f8691]'

  return (
    <article
      className={`group relative h-full overflow-visible rounded-xl border border-[#e4eeee] bg-white px-3 py-3 shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition hover:z-30 focus-within:z-30 ${
        highlight
          ? 'relative z-[1] border-[#6aa9ae] ring-2 ring-[#cde7e7] shadow-[0_0_0_6px_rgba(214,236,237,0.45)]'
          : 'hover:border-[#cde7e7] hover:shadow-[0_10px_24px_rgba(49,88,92,0.08)]'
      }`}
    >
      {shift.urgent ? (
        <div className="absolute inset-y-0 left-0 w-1 bg-[#ef8f3d]" aria-hidden="true" />
      ) : null}

      <div className="grid h-full gap-3 sm:grid-cols-[4.9rem_minmax(0,1fr)_auto] sm:items-start">
        <div className="flex items-center gap-2 sm:block">
          <div className="rounded-lg bg-[#f6fafa] px-2 py-1.5 text-center">
            <div className="text-sm font-semibold text-[#3f4a56]">
              {formatTimeLabel(shift.start_time)}
            </div>
            <div className="text-xs text-[#7f8691]">
              {formatTimeLabel(shift.end_time)}
            </div>
          </div>
          {showStatus && (
            <span className={`mt-2 hidden rounded-full px-2.5 py-0.5 text-[11px] font-semibold sm:inline-flex ${statusClassName}`}>
              {statusLabel}
            </span>
          )}
        </div>

        <div className="min-w-0">
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            <h4 className="text-[15px] font-semibold leading-6 text-[#3f4a56]">
              {shift.role}
            </h4>
            <div className="relative">
              <button
                type="button"
                aria-label={`What does ${shift.role} do?`}
                className="peer flex h-5 w-5 items-center justify-center rounded-full border border-[#dce7e8] bg-[#f6fafa] text-[11px] font-bold text-[#6aa9ae] transition hover:border-[#6aa9ae] hover:bg-[#eef8f8] focus:border-[#6aa9ae] focus:outline-none focus:ring-2 focus:ring-[#cde7e7]"
              >
                i
              </button>
              <div className="pointer-events-none absolute left-0 top-7 z-50 hidden w-72 rounded-xl border border-[#dbe7e8] bg-white p-3 text-xs leading-5 text-[#5f6772] shadow-[0_14px_32px_rgba(15,23,42,0.14)] peer-hover:block peer-focus:block">
                <p className="mb-1 font-semibold text-[#3f4a56]">What you’ll do</p>
                <p>{description}</p>
              </div>
            </div>
            {shift.urgent ? (
              <span className="rounded-full bg-[#fff1dc] px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.02em] text-[#d46d2d]">
                Urgent
              </span>
            ) : null}
            {slotsLabel && !full ? (
              <span className="rounded-full bg-[#eef8f8] px-2.5 py-1 text-[11px] font-semibold text-[#4f9da2]">
                {slotsLabel}
              </span>
            ) : null}
            {showStatus && (
              <span className={`inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-semibold sm:hidden ${statusClassName}`}>
                {statusLabel}
              </span>
            )}
          </div>

          <a
            href={directionsHref}
            target="_blank"
            rel="noreferrer"
            className="group/location relative mt-1 flex min-w-0 items-center gap-1.5 text-sm text-[#5f6772] transition hover:text-[#4f9da2] focus:outline-none focus:ring-2 focus:ring-[#cde7e7]"
            aria-label={
              shift.address
                ? `Open ${shift.location}, ${shift.address} in Google Maps`
                : `Open ${shift.location} in Google Maps`
            }
          >
            <PinIcon />
            <span className="shrink-0 text-xs font-semibold uppercase tracking-[0.04em] text-[#7f8691]">
              Event
            </span>
            <span className="truncate font-semibold text-[#4c5662] underline-offset-2 group-hover/location:text-[#4f9da2] group-hover/location:underline group-focus/location:text-[#4f9da2] group-focus/location:underline">
              {getShiftLocation(shift)}
            </span>
            {getShiftAddress(shift) ? (
              <span className="pointer-events-none absolute left-0 top-6 z-50 hidden max-w-[18rem] rounded-xl border border-[#dbe7e8] bg-white px-3 py-2 text-xs leading-5 text-[#5f6772] shadow-[0_14px_32px_rgba(15,23,42,0.14)] group-hover/location:block group-focus/location:block">
                {getShiftAddress(shift)}
              </span>
            ) : null}
          </a>

        </div>

        <div className="flex items-start justify-start sm:justify-end">
          {isRequested || isAssigned ? (
            <button
              onClick={onCancel}
              disabled={submitting}
              className="whitespace-nowrap text-sm font-medium text-[#ee7666] transition hover:underline disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submitting
                ? 'Cancelling...'
                : isRequested
                  ? 'Cancel request'
                  : 'Cancel sign-up'}
            </button>
          ) : (
            <button
              onClick={onRequest}
              disabled={submitting || !canRequest}
              className={`whitespace-nowrap rounded-sm border-2 px-3.5 py-1.5 text-sm font-semibold transition ${
                canRequest
                  ? 'cursor-pointer border-[#6aa9ae] text-[#6aa9ae] shadow-[3px_3px_0_rgba(31,41,55,0.85)] hover:translate-x-[2px] hover:translate-y-[2px] hover:bg-[#eef8f8] hover:shadow-[1px_1px_0_rgba(31,41,55,0.85)]'
                  : 'cursor-not-allowed border-[#c9d1d8] text-[#a0a6af]'
              }`}
            >
              {submitting ? 'Signing up...' : full ? 'Full' : 'Sign up'}
            </button>
          )}
        </div>
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

function formatAvailabilitySummary(availability: string[]) {
  const labels = availability
    .map((date) => EVENT_DAYS.find((day) => day.date === date)?.label ?? date)
    .join(', ')

  return labels || 'No days selected'
}

function formatTimeLabel(time: string) {
  const [hours, minutes] = time.slice(0, 5).split(':')
  const date = new Date()
  date.setHours(Number(hours), Number(minutes), 0, 0)
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  })
}

function getShiftLocation(shift: Pick<VolunteerShift, 'location' | 'event_session'>) {
  return shift.event_session?.location || shift.location
}

function getShiftAddress(shift: Pick<VolunteerShift, 'address' | 'event_session'>) {
  return shift.event_session?.address || shift.address || null
}

function getDirectionsHref(shift: Pick<VolunteerShift, 'location' | 'address' | 'event_session'>) {
  const query = [getShiftLocation(shift), getShiftAddress(shift)].filter(Boolean).join(', ')
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`
}

function ClockIcon() {
  return (
    <svg className="h-4 w-4 text-[#7bb8bc]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.8}
        d="M12 8v5l3 2m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  )
}

function PinIcon() {
  return (
    <svg className="h-4 w-4 text-[#7bb8bc]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.8}
        d="M17.657 16.657L13.414 20.9a2 2 0 01-2.828 0l-4.243-4.243a8 8 0 1111.314 0z"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.8}
        d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
      />
    </svg>
  )
}

function CloseIcon() {
  return (
    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
  )
}

function CalendarIcon() {
  return (
    <svg className="h-4 w-4 text-[#7bb8bc]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.8}
        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
      />
    </svg>
  )
}
