'use client'

import React, { useState } from 'react'
import { MailIcon } from '@/components/icons/MailIcon'


interface Volunteer {
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

interface ShiftRow {
  id: string
  role: string
  day: string
  start_time: string
  end_time: string
  location: string
}

interface AssignmentRow {
  id: string
  shift_id: string
  volunteer_id: string
}

interface VolunteerTableProps {
  volunteers: Volunteer[]
  availableDays: Array<{ date: string; label: string }>
  onMessageVolunteer: (volunteerId: string) => void
  onRefresh?: () => void
  assignments?: AssignmentRow[]
  shifts?: ShiftRow[]
}

function formatTime(t: string) {
  const [hStr, mStr] = t.split(':')
  const h = parseInt(hStr, 10)
  const m = mStr ?? '00'
  const ampm = h >= 12 ? 'pm' : 'am'
  const h12 = h % 12 || 12
  return m === '00' ? `${h12}${ampm}` : `${h12}:${m}${ampm}`
}

function formatDay(dateStr: string, availableDays: Array<{ date: string; label: string }>) {
  return availableDays.find((d) => d.date === dateStr)?.label ?? dateStr
}

export function VolunteerTable({ volunteers, availableDays, onMessageVolunteer, onRefresh, assignments = [], shifts = [] }: VolunteerTableProps) {
  const [selectedShiftsVolunteerId, setSelectedShiftsVolunteerId] = useState<string | null>(null)
  const [savingId, setSavingId] = useState<string | null>(null)

  const getVolunteerShifts = (volunteerId: string): ShiftRow[] => {
    const shiftIds = new Set(
      assignments.filter((a) => a.volunteer_id === volunteerId).map((a) => a.shift_id)
    )
    return shifts
      .filter((s) => shiftIds.has(s.id))
      .sort((a, b) => a.day.localeCompare(b.day) || a.start_time.localeCompare(b.start_time))
  }

  const updateRole = async (volunteer: Volunteer, role: string) => {
    if (!volunteer.user_id || role === volunteer.role) return

    setSavingId(volunteer.id)

    try {
      const response = await fetch('/api/admin/users', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: volunteer.user_id,
          role,
          badges: volunteer.badges || [],
          blocked: volunteer.blocked || false,
        }),
      })

      if (!response.ok) {
        const payload = await response.json()
        throw new Error(payload.error || 'Failed to update role')
      }

      if (onRefresh) {
        onRefresh()
      }
    } finally {
      setSavingId(null)
    }
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-border bg-white shadow-sm">
      <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-border bg-gray-light/70">
            <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wide text-gray-text">Volunteer</th>
            <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wide text-gray-text hidden sm:table-cell">Phone</th>
            <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wide text-gray-text hidden md:table-cell">Available</th>
            <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wide text-gray-text">Shifts</th>
            <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wide text-gray-text">Account status</th>
          </tr>
        </thead>
        <tbody>
          {volunteers.map((volunteer, i) => {
            return (
              <React.Fragment key={volunteer.id}>
                <tr
                  className={`border-b border-gray-border last:border-0 hover:bg-teal-50/40 transition-colors ${
                    i % 2 === 0 ? '' : 'bg-gray-light/50'
                  }`}
                >
                  <td className="px-5 py-4">
                    <div className="flex flex-col">
                      <div className="font-semibold text-charcoal">
                        {volunteer.name}
                        {volunteer.blocked && <span className="ml-2 text-xs px-2 py-0.5 bg-red-100 text-red-700 rounded-pill">Blocked</span>}
                      </div>
                      <span className="text-xs text-gray-text">{volunteer.email}</span>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-gray-text hidden sm:table-cell whitespace-nowrap">
                    {volunteer.phone}
                  </td>
                  <td className="px-5 py-4 hidden md:table-cell">
                    <div className="flex max-w-xs gap-1.5 flex-wrap">
                      {availableDays
                        .filter((d) => volunteer.availability.includes(d.date))
                        .map((day) => (
                          <span
                            key={day.date}
                            className="text-xs px-2 py-0.5 bg-teal-light text-teal rounded-pill font-medium"
                          >
                            {day.label.replace(/^(Mon|Tue|Wed|Thu|Fri|Sat|Sun),\s*/, '')}
                          </span>
                        ))}
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    {volunteer.shift_count > 0 ? (
                      <button
                        onClick={() => setSelectedShiftsVolunteerId(volunteer.id)}
                        className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
                          selectedShiftsVolunteerId === volunteer.id
                            ? 'bg-teal-500 text-white'
                            : 'bg-teal-light text-teal hover:bg-teal-500 hover:text-white'
                        }`}
                      >
                        View {volunteer.shift_count} shift{volunteer.shift_count === 1 ? '' : 's'}
                      </button>
                    ) : (
                      <span className="rounded-full bg-gray-light px-3 py-1.5 text-xs font-semibold text-gray-text">No shifts</span>
                    )}
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      {volunteer.user_id ? (
                        <select
                          value={volunteer.role || 'volunteer'}
                          onChange={(event) => void updateRole(volunteer, event.target.value)}
                          disabled={savingId === volunteer.id}
                          className="rounded-full border border-gray-border bg-white px-3 py-1.5 text-xs font-semibold text-charcoal disabled:opacity-50"
                        >
                          <option value="volunteer">Volunteer</option>
                          <option value="admin">Admin</option>
                        </select>
                      ) : (
                        <span className="rounded-full bg-gray-light px-3 py-1.5 text-xs font-semibold text-gray-text">No account</span>
                      )}
                      <button
                        onClick={() => onMessageVolunteer(volunteer.id)}
                        className="text-xs font-semibold text-teal hover:text-teal-700 flex items-center gap-1"
                      >
                        <MailIcon className="w-3 h-3" />
                        Message
                      </button>
                    </div>
                  </td>
                </tr>
              </React.Fragment>
            )
          })}
        </tbody>
      </table>
      </div>



      {selectedShiftsVolunteerId && (() => {
        const volunteer = volunteers.find((v) => v.id === selectedShiftsVolunteerId)
        if (!volunteer) return null
        const volunteerShifts = getVolunteerShifts(volunteer.id)
        const byDay = volunteerShifts.reduce<Record<string, ShiftRow[]>>((acc, s) => {
          ;(acc[s.day] ??= []).push(s)
          return acc
        }, {})

        return (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-8"
            onClick={() => setSelectedShiftsVolunteerId(null)}
          >
            <div
              className="w-full max-w-3xl overflow-hidden rounded-2xl bg-white shadow-2xl"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="flex items-start justify-between gap-4 border-b border-gray-border p-5">
                <div>
                  <p className="text-lg font-semibold text-charcoal">{volunteer.name}&rsquo;s shift schedule</p>
                  <p className="mt-1 text-sm text-gray-text">{volunteerShifts.length} assigned shift{volunteerShifts.length === 1 ? '' : 's'}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedShiftsVolunteerId(null)}
                  className="rounded-full px-3 py-1 text-sm font-semibold text-gray-text hover:bg-gray-light hover:text-charcoal"
                >
                  Close
                </button>
              </div>

              <div className="max-h-[70vh] overflow-y-auto p-5">
                {volunteerShifts.length === 0 ? (
                  <p className="rounded-xl bg-gray-light p-4 text-sm text-gray-text">No shifts assigned.</p>
                ) : (
                  <div className="space-y-5">
                    {Object.entries(byDay)
                      .sort(([a], [b]) => a.localeCompare(b))
                      .map(([day, dayShifts]) => (
                        <div key={day}>
                          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-teal">
                            {formatDay(day, availableDays)}
                          </p>
                          <div className="grid gap-2 sm:grid-cols-2">
                            {dayShifts.map((s) => (
                              <div
                                key={s.id}
                                className="flex items-start gap-3 rounded-xl border border-gray-border bg-gray-light/40 px-4 py-3"
                              >
                                <div className="mt-1.5 h-2.5 w-2.5 rounded-full bg-teal-500 shrink-0" />
                                <div className="min-w-0">
                                  <p className="text-sm font-semibold text-charcoal leading-tight">{s.role}</p>
                                  <p className="mt-1 text-xs text-gray-text leading-tight">
                                    {formatTime(s.start_time)}–{formatTime(s.end_time)} · {s.location}
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )
      })()}

      {volunteers.length === 0 && (
        <p className="text-center text-gray-text py-10 text-sm">
          No volunteers found.
        </p>
      )}
    </div>
  )
}
