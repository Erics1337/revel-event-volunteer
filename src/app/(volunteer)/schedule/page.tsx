'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useState } from 'react'
import { DownloadIcon } from '@/components/icons'
import { useAuth } from '@/contexts/auth-context'
import type { AssignmentStatus } from '@/lib/shifts/types'

interface Shift {
  id: string
  role: string
  day: string
  start_time: string
  end_time: string
  location: string
  total_slots: number
  filled_slots: number
}

interface Assignment {
  id: string
  assigned_at: string
  status: AssignmentStatus
  shift: Shift | null
}

interface MyShiftsResponse {
  assignments?: Assignment[]
  volunteer_id?: string
  error?: string
}

function formatDay(day: string) {
  const date = new Date(`${day}T00:00:00`)
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  })
}

function formatTimeRange(start: string, end: string) {
  // DB stores HH:MM strings.
  return `${start} – ${end}`
}

export default function SchedulePage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [volunteerId, setVolunteerId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [cancellingId, setCancellingId] = useState<string | null>(null)

  const fetchMyShifts = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch('/api/volunteers/my-shifts')
      const payload = (await response.json()) as MyShiftsResponse

      if (!response.ok) {
        throw new Error(payload.error || 'Failed to load your schedule')
      }

      setAssignments(payload.assignments || [])
      setVolunteerId(payload.volunteer_id ?? null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (authLoading) return
    if (!user) {
      router.replace('/auth/login?redirectTo=/schedule')
      return
    }
    // This is an intentional, user-scoped data fetch on mount / auth change.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void fetchMyShifts()
  }, [authLoading, user, router, fetchMyShifts])

  const handleCancel = async (assignment: Assignment) => {
    if (!assignment.shift || !volunteerId) return
    const shiftId = assignment.shift.id
    const confirmMessage =
      assignment.status === 'requested'
        ? 'Cancel this volunteer request?'
        : 'Release this shift? Your slot will be opened back up for another volunteer.'

    if (!confirm(confirmMessage)) {
      return
    }

    setCancellingId(assignment.id)
    try {
      const params = new URLSearchParams({ shiftId })
      const response = await fetch(`/api/volunteers/requests?${params.toString()}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const payload = (await response.json().catch(() => ({}))) as { error?: string }
        throw new Error(payload.error || 'Failed to cancel shift')
      }

      setAssignments((prev) => prev.filter((a) => a.id !== assignment.id))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setCancellingId(null)
    }
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-light flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-text">Loading your schedule…</p>
        </div>
      </div>
    )
  }

  const upcoming = assignments
    .filter((a): a is Assignment & { shift: Shift } => Boolean(a.shift))
    .sort((a, b) => {
      if (a.shift.day !== b.shift.day) return a.shift.day.localeCompare(b.shift.day)
      return a.shift.start_time.localeCompare(b.shift.start_time)
    })

  const assigned = upcoming.filter((assignment) => assignment.status === 'assigned')
  const requested = upcoming.filter((assignment) => assignment.status === 'requested')

  const groupByDay = (items: Array<Assignment & { shift: Shift }>) =>
    items.reduce<Record<string, Array<Assignment & { shift: Shift }>>>((acc, assignment) => {
      if (!acc[assignment.shift.day]) acc[assignment.shift.day] = []
      acc[assignment.shift.day].push(assignment)
      return acc
    }, {})

  const assignedByDay = groupByDay(assigned)
  const requestedByDay = groupByDay(requested)
  const hasAssignedShifts = assigned.length > 0

  const renderAssignmentSections = (
    title: string,
    description: string,
    itemsByDay: Record<string, Array<Assignment & { shift: Shift }>>,
    emptyMessage: string
  ) => {
    const days = Object.entries(itemsByDay).sort(([a], [b]) => a.localeCompare(b))

    return (
      <section className="bg-white border border-gray-border rounded-lg p-6">
        <div className="flex items-start justify-between gap-4 mb-5">
          <div>
            <h3 className="text-lg font-semibold text-charcoal">{title}</h3>
            <p className="text-sm text-gray-text mt-1">{description}</p>
          </div>
          <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-text">
            {days.reduce((sum, [, list]) => sum + list.length, 0)}
          </span>
        </div>

        {days.length === 0 ? (
          <p className="text-sm text-gray-text italic">{emptyMessage}</p>
        ) : (
          <div className="space-y-8">
            {days.map(([day, list]) => (
              <section key={`${title}-${day}`}>
                <h4 className="text-base font-semibold text-charcoal mb-3">{formatDay(day)}</h4>
                <div className="space-y-3">
                  {list.map((assignment) => (
                    <div
                      key={assignment.id}
                      className="border border-gray-border rounded-lg p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-charcoal">{assignment.shift.role}</p>
                          <span
                            className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                              assignment.status === 'assigned'
                                ? 'bg-teal-100 text-teal-700'
                                : 'bg-orange-100 text-orange-700'
                            }`}
                          >
                            {assignment.status === 'assigned' ? 'Assigned' : 'Requested'}
                          </span>
                        </div>
                        <p className="text-sm text-gray-text mt-1">
                          {formatTimeRange(assignment.shift.start_time, assignment.shift.end_time)} ·{' '}
                          {assignment.shift.location}
                        </p>
                      </div>
                      <button
                        onClick={() => handleCancel(assignment)}
                        disabled={cancellingId === assignment.id}
                        className="text-sm font-medium text-red-600 hover:text-red-700 disabled:opacity-50 disabled:cursor-not-allowed self-start sm:self-auto"
                      >
                        {cancellingId === assignment.id
                          ? 'Cancelling…'
                          : assignment.status === 'assigned'
                            ? 'Release shift'
                            : 'Cancel request'}
                      </button>
                    </div>
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </section>
    )
  }

  return (
    <>
      <section
        className="px-4 py-10 md:py-8"
        style={{ background: 'linear-gradient(90deg, #5e9a98 0%, #b5aa5f 45%, #f39c3d 100%)' }}
      >
        <div className="mx-auto flex max-w-4xl flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-white/80">
              Volunteer Portal
            </p>
            <h1
              className="mt-2 text-4xl font-bold tracking-tight text-white md:text-[2.7rem]"
              style={{ fontFamily: 'var(--font-accent)' }}
            >
              My Schedule
            </h1>
            <p className="mt-3 max-w-xl text-lg leading-8 text-white/95">
              Review your confirmed shifts and pending requests for Boulder Startup Week 2026.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            {hasAssignedShifts && (
              <a
                href="/api/volunteers/my-shifts/calendar"
                className="inline-flex items-center gap-2 rounded-sm border border-white/45 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-white/12"
              >
                <DownloadIcon className="h-4 w-4" />
                Download calendar
              </a>
            )}
            <Link
              href="/open-shifts"
              className="inline-flex rounded-sm border border-white/45 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-white/12"
            >
              Open shifts
            </Link>
          </div>
        </div>
      </section>

      <main className="mx-auto max-w-4xl px-4 py-8">

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
            {error}
          </div>
        )}

        {upcoming.length === 0 ? (
          <div className="bg-white border border-gray-border rounded-lg p-10 text-center">
            <p className="text-gray-text text-lg mb-4">
              You haven’t requested or claimed any shifts yet.
            </p>
            <Link
              href="/open-shifts"
              className="inline-block bg-teal-500 text-white px-6 py-3 rounded-md font-medium hover:bg-teal-600 transition-colors"
            >
              Open shifts
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="bg-white border border-gray-border rounded-lg p-5">
                <p className="text-sm text-gray-text mb-1">Assigned shifts</p>
                <p className="text-3xl font-bold text-charcoal">{assigned.length}</p>
                <p className="text-sm text-gray-text mt-2">
                  These are confirmed and on your schedule.
                </p>
              </div>
              <div className="bg-white border border-gray-border rounded-lg p-5">
                <p className="text-sm text-gray-text mb-1">Requested shifts</p>
                <p className="text-3xl font-bold text-charcoal">{requested.length}</p>
                <p className="text-sm text-gray-text mt-2">
                  These are pending admin approval.
                </p>
              </div>
            </div>

            {renderAssignmentSections(
              'Assigned',
              'Confirmed shifts you should plan around.',
              assignedByDay,
              'You do not have any assigned shifts yet.'
            )}

            {renderAssignmentSections(
              'Requested',
              'Pending requests you asked the admin team to review.',
              requestedByDay,
              'You do not have any pending shift requests right now.'
            )}
          </div>
        )}
      </main>
    </>
  )
}
