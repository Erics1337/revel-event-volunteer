'use client'

import React, { useState } from 'react'
import { MailIcon } from '@/components/icons/MailIcon'

const BADGE_OPTIONS = ['facilitator', 'volunteer', 'sponsor']

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

interface VolunteerTableProps {
  volunteers: Volunteer[]
  availableDays: Array<{ date: string; label: string }>
  onMessageVolunteer: (volunteerId: string) => void
  onRefresh?: () => void
}

export function VolunteerTable({ volunteers, availableDays, onMessageVolunteer, onRefresh }: VolunteerTableProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [drafts, setDrafts] = useState<Record<string, { role: string; badges: string[]; blocked: boolean }>>({})
  const [savingId, setSavingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleToggleExpand = (volunteer: Volunteer) => {
    if (expandedId === volunteer.id) {
      setExpandedId(null)
    } else {
      setExpandedId(volunteer.id)
      setDrafts((current) => ({
        ...current,
        [volunteer.id]: {
          role: volunteer.role || 'volunteer',
          badges: volunteer.badges || [],
          blocked: volunteer.blocked || false,
        },
      }))
    }
  }

  const updateDraft = (userId: string, updater: (current: { role: string; badges: string[]; blocked: boolean }) => { role: string; badges: string[]; blocked: boolean }) => {
    setDrafts((current) => ({
      ...current,
      [userId]: updater(current[userId]),
    }))
  }

  const saveUser = async (volunteer: Volunteer) => {
    const draft = drafts[volunteer.id]
    if (!draft || !volunteer.user_id) return

    setSavingId(volunteer.id)
    setError(null)

    try {
      const response = await fetch('/api/admin/users', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: volunteer.user_id,
          role: draft.role,
          badges: draft.badges,
          blocked: draft.blocked,
        }),
      })

      if (!response.ok) {
        const payload = await response.json()
        throw new Error(payload.error || 'Failed to update user')
      }

      setExpandedId(null)
      if (onRefresh) {
        onRefresh()
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update user')
    } finally {
      setSavingId(null)
    }
  }

  return (
    <div className="overflow-x-auto rounded-md border border-gray-border bg-white">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-border bg-gray-light">
            <th className="text-left px-4 py-3 font-semibold text-charcoal">Name</th>
            <th className="text-left px-4 py-3 font-semibold text-charcoal">Email</th>
            <th className="text-left px-4 py-3 font-semibold text-charcoal hidden sm:table-cell">Phone</th>
            <th className="text-left px-4 py-3 font-semibold text-charcoal hidden md:table-cell">Availability</th>
            <th className="text-left px-4 py-3 font-semibold text-charcoal">Shifts</th>
            <th className="text-left px-4 py-3 font-semibold text-charcoal">Account</th>
            <th className="px-4 py-3" />
          </tr>
        </thead>
        <tbody>
          {volunteers.map((volunteer, i) => {
            const isExpanded = expandedId === volunteer.id
            const draft = drafts[volunteer.id]

            return (
              <React.Fragment key={volunteer.id}>
                <tr
                  className={`border-b border-gray-border last:border-0 hover:bg-gray-light transition-colors ${
                    i % 2 === 0 ? '' : 'bg-gray-light/50'
                  }`}
                >
                  <td className="px-4 py-3 font-medium text-charcoal whitespace-nowrap">
                    {volunteer.name}
                    {volunteer.blocked && <span className="ml-2 text-xs px-2 py-0.5 bg-red-100 text-red-700 rounded-pill">Blocked</span>}
                  </td>
                  <td className="px-4 py-3 text-gray-text">{volunteer.email}</td>
                  <td className="px-4 py-3 text-gray-text hidden sm:table-cell whitespace-nowrap">
                    {volunteer.phone}
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    <div className="flex gap-1 flex-wrap">
                      {availableDays
                        .filter((d) => volunteer.availability.includes(d.date))
                        .map((day) => (
                          <span
                            key={day.date}
                            className="text-xs px-2 py-0.5 bg-teal-light text-teal rounded-pill font-medium"
                          >
                            {day.label}
                          </span>
                        ))}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-charcoal">
                    {volunteer.shift_count}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`text-xs px-2 py-0.5 rounded-pill font-medium ${
                        volunteer.user_id
                          ? 'bg-teal-light text-teal'
                          : 'bg-gray-light text-gray-text'
                      }`}
                    >
                      {volunteer.user_id ? 'Linked' : 'No account'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-3">
                      <button
                        onClick={() => handleToggleExpand(volunteer)}
                        className="text-xs text-charcoal hover:underline"
                        disabled={!volunteer.user_id}
                        title={!volunteer.user_id ? "No user account linked" : "Manage access settings"}
                      >
                        {isExpanded ? 'Cancel' : 'Manage'}
                      </button>
                      <button
                        onClick={() => onMessageVolunteer(volunteer.id)}
                        className="text-xs text-teal hover:underline flex items-center gap-1"
                      >
                        <MailIcon className="w-3 h-3" />
                        Message
                      </button>
                    </div>
                  </td>
                </tr>
                {isExpanded && draft && (
                  <tr className="bg-gray-50 border-b border-gray-border">
                    <td colSpan={7} className="px-4 py-4">
                      <div className="flex flex-col gap-4 max-w-4xl bg-white p-4 rounded-xl border border-gray-border">
                        <div className="flex flex-wrap gap-6 items-start">
                          <label className="block">
                            <span className="mb-2 block text-sm font-medium text-charcoal">Role</span>
                            <select
                              value={draft.role}
                              onChange={(event) =>
                                updateDraft(volunteer.id, (current) => ({
                                  ...current,
                                  role: event.target.value,
                                }))
                              }
                              className="input max-w-xs"
                            >
                              <option value="volunteer">Volunteer</option>
                              <option value="admin">Admin</option>
                            </select>
                          </label>

                          <div>
                            <span className="mb-2 block text-sm font-medium text-charcoal">Badges</span>
                            <div className="flex flex-wrap gap-2">
                              {BADGE_OPTIONS.map((badge) => {
                                const selected = draft.badges.includes(badge)
                                return (
                                  <button
                                    key={badge}
                                    type="button"
                                    onClick={() =>
                                      updateDraft(volunteer.id, (current) => ({
                                        ...current,
                                        badges: selected
                                          ? current.badges.filter((value: string) => value !== badge)
                                          : [...current.badges, badge],
                                      }))
                                    }
                                    className={`rounded-full border px-3 py-1.5 text-xs font-semibold capitalize transition-colors ${
                                      selected
                                        ? 'border-teal-500 bg-teal-500 text-white'
                                        : 'border-gray-border text-charcoal hover:border-teal-300 hover:text-teal-700'
                                    }`}
                                  >
                                    {badge}
                                  </button>
                                )
                              })}
                            </div>
                          </div>

                          <label className="flex items-center justify-between rounded-xl border border-gray-border px-4 py-2 mt-auto">
                            <span className="text-sm font-medium text-charcoal mr-3">Blocked</span>
                            <input
                              type="checkbox"
                              checked={draft.blocked}
                              onChange={(event) =>
                                updateDraft(volunteer.id, (current) => ({
                                  ...current,
                                  blocked: event.target.checked,
                                }))
                              }
                              className="h-4 w-4 accent-teal-600"
                            />
                          </label>
                        </div>
                        
                        <div className="flex items-center justify-between mt-2 pt-4 border-t border-gray-100">
                          <span className="text-sm text-red-600 font-medium">{error}</span>
                          <button
                            type="button"
                            onClick={() => saveUser(volunteer)}
                            disabled={savingId === volunteer.id}
                            className="rounded-full bg-charcoal px-5 py-2 text-sm font-medium text-white disabled:opacity-50 ml-auto"
                          >
                            {savingId === volunteer.id ? 'Saving...' : 'Save Settings'}
                          </button>
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            )
          })}
        </tbody>
      </table>

      {volunteers.length === 0 && (
        <p className="text-center text-gray-text py-10 text-sm">
          No volunteers found.
        </p>
      )}
    </div>
  )
}
