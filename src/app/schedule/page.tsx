'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useState } from 'react'
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

  const byDay = upcoming.reduce<Record<string, Array<Assignment & { shift: Shift }>>>((acc, a) => {
    if (!acc[a.shift.day]) acc[a.shift.day] = []
    acc[a.shift.day].push(a)
    return acc
  }, {})

  return (
    <div className="min-h-screen bg-gray-light">
      <header className="bg-white border-b border-gray-border">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-teal-500 rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-sm">R</span>
            </div>
            <h1 className="text-xl font-bold text-charcoal">My Schedule</h1>
          </div>
          <nav className="flex items-center gap-6 text-sm">
            <Link href="/" className="text-gray-text hover:text-teal transition-colors">Home</Link>
            <Link href="/volunteers" className="text-gray-text hover:text-teal transition-colors">Browse Shifts</Link>
            <Link href="/profile" className="text-gray-text hover:text-teal transition-colors">Profile</Link>
          </nav>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-6 flex items-end justify-between gap-4">
          <div>
            <h2 className="text-3xl font-bold text-charcoal mb-1">My Volunteer Sign-ups</h2>
            <p className="text-gray-text">Boulder Startup Week 2026 · May 4–8</p>
          </div>
          <Link
            href="/volunteers"
            className="text-teal hover:underline text-sm font-medium whitespace-nowrap"
          >
            Browse open shifts →
          </Link>
        </div>

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
              href="/volunteers"
              className="inline-block bg-teal-500 text-white px-6 py-3 rounded-md font-medium hover:bg-teal-600 transition-colors"
            >
              Browse open shifts
            </Link>
          </div>
        ) : (
          <div className="space-y-8">
            {Object.entries(byDay)
              .sort(([a], [b]) => a.localeCompare(b))
              .map(([day, list]) => (
                <section key={day}>
                  <h3 className="text-lg font-semibold text-charcoal mb-3">{formatDay(day)}</h3>
                  <div className="space-y-3">
                    {list.map((a) => (
                      <div
                        key={a.id}
                        className="bg-white border border-gray-border rounded-lg p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-semibold text-charcoal">{a.shift.role}</p>
                            <span
                              className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                                a.status === 'assigned'
                                  ? 'bg-teal-100 text-teal-700'
                                  : 'bg-orange-100 text-orange-700'
                              }`}
                            >
                              {a.status === 'assigned' ? 'Assigned' : 'Requested'}
                            </span>
                          </div>
                          <p className="text-sm text-gray-text mt-1">
                            {formatTimeRange(a.shift.start_time, a.shift.end_time)} · {a.shift.location}
                          </p>
                        </div>
                        <button
                          onClick={() => handleCancel(a)}
                          disabled={cancellingId === a.id}
                          className="text-sm font-medium text-red-600 hover:text-red-700 disabled:opacity-50 disabled:cursor-not-allowed self-start sm:self-auto"
                        >
                          {cancellingId === a.id
                            ? 'Cancelling…'
                            : a.status === 'assigned'
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
      </main>
    </div>
  )
}
