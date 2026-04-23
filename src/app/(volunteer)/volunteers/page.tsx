'use client'

import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useAuth } from '@/contexts/auth-context'
import type { AssignmentStatus } from '@/lib/shifts/types'
import { EVENT_DAYS } from '@/lib/shifts/types'

const ROLE_INFO: Record<string, string> = {
  'ALL DAY - LOCATION CAPTAIN':
    'Own the venue for the day, support volunteers across shifts, and help keep operations calm and coordinated.',
  'Building Runner':
    'Jump in wherever the venue needs support: supplies, logistics, troubleshooting, and fast-moving coordination.',
  'Room Runner':
    'Prep rooms, support speakers, and keep sessions running smoothly from setup through reset.',
  'Volunteer Hub / Door Monitor':
    'Welcome attendees, direct traffic, and help the venue feel organized, calm, and easy to navigate.',
}

interface VolunteerShift {
  id: string
  role: string
  day: string
  start_time: string
  end_time: string
  location: string
  total_slots: number
  filled_slots: number
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

export default function VolunteerPortal() {
  const router = useRouter()
  const { user, profile, loading: authLoading } = useAuth()
  const [shifts, setShifts] = useState<VolunteerShift[]>([])
  const [loading, setLoading] = useState(true)
  const [contextLoading, setContextLoading] = useState(true)
  const [selectedDay, setSelectedDay] = useState<string[]>([])
  const [selectedRole, setSelectedRole] = useState<string[]>([])
  const [selectedLocation, setSelectedLocation] = useState<string[]>([])
  const [selectedTime, setSelectedTime] = useState<string[]>([])
  const [onlyMyAvailability, setOnlyMyAvailability] = useState(true)
  const [volunteer, setVolunteer] = useState<VolunteerRecord | null>(null)
  const [assignments, setAssignments] = useState<VolunteerAssignment[]>([])
  const [setupOpen, setSetupOpen] = useState(false)
  const [setupAvailability, setSetupAvailability] = useState<string[]>([])
  const [savingSetup, setSavingSetup] = useState(false)
  const [submittingShiftId, setSubmittingShiftId] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

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
      setSetupAvailability([])
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
    setSetupAvailability(nextVolunteer?.availability || [])
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

  const availability = useMemo(() => volunteer?.availability ?? [], [volunteer?.availability])
  const hasVolunteerSetup = Boolean(availability.length > 0)
  const showSetupPanel = Boolean(user && (setupOpen || !hasVolunteerSetup))
  const hasAvailabilityOverlap = shifts.some((shift) => availability.includes(shift.day))
  const showAvailabilityOnly =
    Boolean(user) && onlyMyAvailability && availability.length > 0 && hasAvailabilityOverlap

  const filtered = useMemo(
    () =>
      shifts.filter((shift) => {
        if (showAvailabilityOnly && !availability.includes(shift.day)) return false
        if (selectedDay.length > 0 && !selectedDay.includes(shift.day)) return false
        if (selectedRole.length > 0 && !selectedRole.includes(shift.role)) return false
        if (selectedLocation.length > 0 && !selectedLocation.includes(shift.location)) return false
        if (selectedTime.length > 0 && !selectedTime.includes(shift.start_time)) return false
        return true
      }),
    [availability, selectedDay, selectedLocation, selectedRole, selectedTime, shifts, showAvailabilityOnly]
  )

  const urgentShifts = filtered.filter((shift) => shift.filled_slots === 0)
  const openCount = shifts.filter((shift) => shift.filled_slots < shift.total_slots).length
  const availabilityDayLabels = availability
    .map((day) => formatDayLabel(day).short)
    .filter(Boolean)

  const dayOptions = Array.from(new Set(shifts.map((shift) => shift.day)))
    .sort((a, b) => a.localeCompare(b))
    .map((day) => ({
      value: day,
      label: formatDayLabel(day).full,
    }))

  const roles = Array.from(new Set(shifts.map((shift) => shift.role))).sort((a, b) =>
    a.localeCompare(b)
  )
  const locations = Array.from(new Set(shifts.map((shift) => shift.location)))

  const timeOptions = Array.from(new Set(shifts.map((shift) => shift.start_time)))
    .sort((a, b) => a.localeCompare(b))
    .map((time) => ({ value: time, label: formatTimeLabel(time) }))

  const clearFilters = () => {
    setSelectedDay([])
    setSelectedRole([])
    setSelectedLocation([])
    setSelectedTime([])
  }



  const handleSetupAvailabilityToggle = (day: string) => {
    setSetupAvailability((current) =>
      current.includes(day) ? current.filter((value) => value !== day) : [...current, day]
    )
  }

  const handleSaveSetup = async () => {
    setSavingSetup(true)
    setErrorMessage(null)
    setMessage(null)

    try {
      const response = await fetch('/api/volunteers/me', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          availability: setupAvailability,
        }),
      })

      const payload = (await response.json().catch(() => ({}))) as {
        volunteer?: VolunteerRecord
        error?: string
      }

      if (!response.ok) {
        throw new Error(payload.error || 'Failed to save volunteer setup')
      }

      setVolunteer(payload.volunteer ?? null)
      setSetupOpen(false)
      setMessage('Volunteer setup saved. You can request shifts now.')
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Failed to save volunteer setup')
    } finally {
      setSavingSetup(false)
    }
  }

  const redirectToSignIn = () => {
    router.push('/auth/login?redirectTo=/volunteers')
  }

  const handlePrimaryAction = async (shift: VolunteerShift) => {
    setErrorMessage(null)
    setMessage(null)

    if (!user) {
      redirectToSignIn()
      return
    }

    if (!hasVolunteerSetup) {
      setSetupOpen(true)
      setErrorMessage('Complete your volunteer setup before requesting a shift.')
      return
    }

    setSubmittingShiftId(shift.id)
    try {
      const response = await fetch('/api/volunteers/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ shiftId: shift.id }),
      })

      const payload = (await response.json().catch(() => ({}))) as { error?: string }

      if (!response.ok) {
        throw new Error(payload.error || 'Failed to submit volunteer request')
      }

      await loadContext()
      setMessage('Request submitted. We saved it to your volunteer portal.')
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
        <div className="mx-auto max-w-4xl">
          <h1
            className="text-4xl font-bold tracking-tight text-white md:text-[2.7rem]"
            style={{ fontFamily: 'var(--font-accent)' }}
          >
            Volunteer at Boulder Startup Week 2026
          </h1>
          <p className="mx-auto mt-3 max-w-lg text-lg leading-8 text-white/95">
            {openCount} shifts still need coverage. Request a role, save your availability, and keep your volunteer plan in one place.
          </p>

        </div>
      </section>

      <main className="mx-auto max-w-4xl px-4 py-4 md:py-4">
        {message && (
          <div className="mb-4 rounded-md border border-[#cde7e7] bg-[#eef8f8] px-4 py-3 text-sm text-[#2f6d71]">
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
        ) : (
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-md border border-[#d6eced] bg-[#eef8f8] px-4 py-3">
            <p className="text-sm text-[#6aa9ae]">
              {showAvailabilityOnly ? (
                <>
                  Showing shifts on your available days:{' '}
                  <span className="font-semibold">{availabilityDayLabels.join(', ')}</span>
                </>
              ) : availability.length === 0 ? (
                'Add your availability below to filter shifts to the days you can help.'
              ) : onlyMyAvailability ? (
                'Showing all shifts. Your saved availability does not match the current shift dates.'
              ) : (
                'Showing all shifts'
              )}
            </p>
            <div className="flex items-center gap-4 text-sm shrink-0">
              <button
                onClick={() => setOnlyMyAvailability((current) => !current)}
                className="font-semibold text-[#5aaeb3] underline underline-offset-2 transition hover:text-[#4f9da2]"
                disabled={availability.length === 0}
              >
                {onlyMyAvailability ? 'Show all shifts' : 'Filter to my availability'}
              </button>
              <button
                onClick={() => setSetupOpen((current) => !current)}
                className="text-[#6f7883] transition hover:text-[#5aaeb3]"
              >
                {showSetupPanel ? 'Hide volunteer settings' : 'Edit volunteer settings'}
              </button>
            </div>
          </div>
        )}

        {showSetupPanel && (
          <section className="mb-4 rounded-lg border border-[#e6e8eb] bg-white p-5 shadow-[0_1px_2px_rgba(26,26,26,0.05)]">
            <div className="mb-4 flex items-start justify-between gap-4">
              <div>
                <h2
                  className="text-2xl font-semibold text-[#3f4a56]"
                  style={{ fontFamily: 'var(--font-accent)' }}
                >
                  Volunteer setup
                </h2>
                <p className="mt-1 text-sm text-[#6f7883]">
                  Save the days you can help so shift requests line up with your availability.
                </p>
              </div>
              {hasVolunteerSetup && (
                <span className="rounded-full bg-[#eef8f8] px-3 py-1 text-xs font-semibold text-[#6aa9ae]">
                  Active volunteer
                </span>
              )}
            </div>

            <div className="grid gap-4">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.04em] text-[#7f8691]">
                  Availability
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {EVENT_DAYS.map((day) => {
                    const active = setupAvailability.includes(day.date)
                    return (
                      <button
                        key={day.date}
                        type="button"
                        onClick={() => handleSetupAvailabilityToggle(day.date)}
                        className={`rounded-pill border px-3 py-1.5 text-sm font-medium transition ${
                          active
                            ? 'border-[#6aa9ae] bg-[#6aa9ae] text-white'
                            : 'border-[#d8dde3] text-[#505966] hover:border-[#6aa9ae] hover:text-[#6aa9ae]'
                        }`}
                      >
                        {day.label}
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-3">
              <button
                onClick={handleSaveSetup}
                disabled={savingSetup}
                className="rounded-sm bg-[#ef8f3d] px-5 py-2.5 text-sm font-semibold text-white shadow-[3px_3px_0_rgba(26,26,26,0.85)] transition hover:translate-x-[2px] hover:translate-y-[2px] hover:bg-[#e98529] hover:shadow-[1px_1px_0_rgba(26,26,26,0.85)] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {savingSetup ? 'Saving...' : hasVolunteerSetup ? 'Save settings' : 'Become a volunteer'}
              </button>
            </div>
          </section>
        )}

        <div className="rounded-md border border-[#e6e8eb] bg-white p-4 shadow-[0_1px_2px_rgba(26,26,26,0.05)]">
          <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-4">
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

        <div className="mb-3 mt-4 flex items-center justify-between gap-3">
          <p className="text-sm text-[#7f8691]">
            {filtered.length} shift{filtered.length !== 1 ? 's' : ''}
          </p>
          {(selectedDay.length > 0 || selectedRole.length > 0 || selectedLocation.length > 0 || selectedTime.length > 0) && (
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
              style={{ fontFamily: 'var(--font-accent)' }}
            >
              Priority Shifts
            </h2>
            <div className="rounded-lg border border-[#f0b8b1] bg-[#fff6f4] p-3 sm:p-4">
              <p className="mb-3 text-xs font-semibold text-[#ef8a7f]">
                These shifts have zero assigned volunteers. They need coverage first.
              </p>
              <div className="grid gap-3 sm:grid-cols-2">
                {urgentShifts.map((shift) => (
                  <ShiftCard
                    key={shift.id}
                    shift={shift}
                    relationshipStatus={assignmentByShiftId.get(shift.id)?.status ?? null}
                    submitting={submittingShiftId === shift.id}
                    onRequest={() => handlePrimaryAction(shift)}
                    onCancel={() => handleCancel(shift)}
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
                relationshipStatus={assignmentByShiftId.get(shift.id)?.status ?? null}
                submitting={submittingShiftId === shift.id}
                onRequest={() => handlePrimaryAction(shift)}
                onCancel={() => handleCancel(shift)}
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
      onChange(values.filter((v) => v !== value))
    } else {
      onChange([...values, value])
    }
  }

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation()
    onChange([])
  }

  const displayValue = values.length === 0 
    ? placeholder 
    : values.length === 1 
      ? options.find(o => o.value === values[0])?.label 
      : `${values.length} selected`

  return (
    <div className="flex flex-col gap-1 relative" ref={containerRef}>
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
              onClick={handleClear}
              className="text-[#a0a6af] hover:text-[#505966]"
            >
              ×
            </button>
          )}
          <svg className={`h-4 w-4 text-[#a0a6af] transition-transform ${open ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
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

function ShiftCard({
  shift,
  relationshipStatus,
  submitting,
  onRequest,
  onCancel,
}: {
  shift: VolunteerShift
  relationshipStatus: AssignmentStatus | null
  submitting: boolean
  onRequest: () => void
  onCancel: () => void
}) {
  const [showRoleInfo, setShowRoleInfo] = useState(false)

  const open = Math.max(0, shift.total_slots - shift.filled_slots)
  const full = open === 0
  const pct = Math.round((shift.filled_slots / shift.total_slots) * 100)
  const almostFull = !full && pct >= 80
  const roleDescription = ROLE_INFO[shift.role]
  const description =
    roleDescription ||
    'Support the volunteer team and help this part of Boulder Startup Week run smoothly.'

  const isRequested = relationshipStatus === 'requested'
  const isAssigned = relationshipStatus === 'assigned'
  const canRequest = !full && !isRequested && !isAssigned

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

        {isAssigned ? (
          <span className="rounded-full bg-[#6aa9ae] px-3 py-1 text-xs font-semibold text-white">
            Assigned
          </span>
        ) : isRequested ? (
          <span className="rounded-full bg-[#fff1dc] px-3 py-1 text-xs font-semibold text-[#ef8f3d]">
            Request submitted
          </span>
        ) : null}
      </div>

      <p className="mt-4 text-[15px] leading-7 text-[#6f7883]">{description}</p>

      <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1.5 text-sm text-[#505966]">
        <span className="flex items-center gap-1.5">
          <CalendarIcon />
          {formatDayLabel(shift.day).full}
        </span>
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
        {isRequested || isAssigned ? (
          <button
            onClick={onCancel}
            disabled={submitting}
            className="text-sm font-medium text-[#ee7666] transition hover:underline disabled:cursor-not-allowed disabled:opacity-50"
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
            className={`rounded-sm border-2 px-5 py-2 text-sm font-semibold transition ${
              canRequest
                ? 'border-[#6aa9ae] text-[#6aa9ae] shadow-[3px_3px_0_rgba(31,41,55,0.85)] hover:translate-x-[2px] hover:translate-y-[2px] hover:bg-[#eef8f8] hover:shadow-[1px_1px_0_rgba(31,41,55,0.85)]'
                : 'cursor-not-allowed border-[#c9d1d8] text-[#a0a6af]'
            }`}
          >
            {submitting ? 'Submitting...' : full ? 'Full' : 'Request to volunteer'}
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

function formatTimeLabel(time: string) {
  const [hours, minutes] = time.slice(0, 5).split(':')
  const date = new Date()
  date.setHours(Number(hours), Number(minutes), 0, 0)
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  })
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
