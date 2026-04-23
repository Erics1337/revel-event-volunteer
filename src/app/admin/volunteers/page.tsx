'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useAuth } from '@/contexts/auth-context'
import {
  BellIcon,
  MailIcon,
  SearchIcon,
  CloseIcon,
  CheckIcon,
} from '@/components/icons'
import { VolunteerFilters } from '@/components/admin/VolunteerFilters'
import { VolunteerTable } from '@/components/admin/VolunteerTable'
import { MessageModal } from '@/components/admin/MessageModal'
import { AssignmentActions } from '@/components/admin/AssignmentActions'
import { isAdmin } from '@/lib/auth/roles'
import { AdminHeader } from '@/components/admin/AdminHeader'
import { DEFAULT_REMINDER_SETTINGS } from '@/lib/notifications/reminder-settings'
import type {
  AvailableVolunteer,
  ShiftAssignment,
  VolunteerShift,
} from '@/lib/shifts/types'
import { EVENT_DAYS } from '@/lib/shifts/types'

type MessageTarget =
  | { kind: 'all' }
  | { kind: 'volunteer'; volunteerId: string }
  | { kind: 'day'; day: string }

interface ReminderResult {
  queued: number
  sent: number
  failed: number
  skipped: number
}

interface ReminderSettingsState {
  reminders_enabled: boolean
  reminder_24h_enabled: boolean
  reminder_24h_hours_before: number
  reminder_1h_enabled: boolean
  reminder_1h_hours_before: number
  send_window_minutes: number
  time_zone: string
}

interface ReminderPreviewState {
  now: string
  counts: {
    reminder_24h: { queued: number }
    reminder_1h: { queued: number }
  }
}

export default function AdminVolunteersPage() {
  const { user, profile, loading: authLoading } = useAuth()
  const [activeTab, setActiveTab] = useState('coverage')
  const [volunteers, setVolunteers] = useState<AvailableVolunteer[]>([])
  const [shifts, setShifts] = useState<VolunteerShift[]>([])
  const [assignments, setAssignments] = useState<ShiftAssignment[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const [shiftFilters, setShiftFilters] = useState({
    days: [] as string[],
    locations: [] as string[],
    roles: [] as string[],
  })

  const [messageModal, setMessageModal] = useState<MessageTarget | null>(null)
  const [reminderModal, setReminderModal] = useState(false)
  const [sendingReminders, setSendingReminders] = useState(false)
  const [reminderResult, setReminderResult] = useState<ReminderResult | null>(null)
  const [reminderSettings, setReminderSettings] = useState<ReminderSettingsState>({
    ...DEFAULT_REMINDER_SETTINGS,
  })
  const [reminderPreview, setReminderPreview] = useState<ReminderPreviewState | null>(null)
  const [savingReminderSettings, setSavingReminderSettings] = useState(false)
  const [manageShiftId, setManageShiftId] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    setErrorMessage(null)

    try {
      const [volunteersRes, shiftsRes, assignmentsRes, reminderSettingsRes] = await Promise.all([
        fetch('/api/admin/volunteers/available'),
        fetch('/api/admin/shifts'),
        fetch('/api/admin/shifts/assignments'),
        fetch('/api/admin/notifications/reminder-settings'),
      ])

      const [volunteersData, shiftsData, assignmentsData, reminderSettingsData] = await Promise.all([
        volunteersRes.json(),
        shiftsRes.json(),
        assignmentsRes.json(),
        reminderSettingsRes.json(),
      ])

      if (!volunteersRes.ok) {
        throw new Error(volunteersData.error || 'Failed to load volunteers')
      }

      if (!shiftsRes.ok) {
        throw new Error(shiftsData.error || 'Failed to load shifts')
      }

      if (!assignmentsRes.ok) {
        throw new Error(assignmentsData.error || 'Failed to load assignments')
      }

      if (!reminderSettingsRes.ok) {
        throw new Error(reminderSettingsData.error || 'Failed to load reminder settings')
      }

      const nextAssignments = (assignmentsData.assignments || []) as ShiftAssignment[]
      const assignmentCounts = new Map<string, number>()

      nextAssignments.forEach((assignment) => {
        const nextCount = (assignmentCounts.get(assignment.volunteer_id) || 0) + 1
        assignmentCounts.set(assignment.volunteer_id, nextCount)
      })

      const nextVolunteers = ((volunteersData.volunteers || []) as AvailableVolunteer[]).map(
        (volunteer) => ({
          ...volunteer,
          shift_count: assignmentCounts.get(volunteer.id) || 0,
          availability: volunteer.availability || [],
        })
      )

      setVolunteers(nextVolunteers)
      setShifts((shiftsData.shifts || []) as VolunteerShift[])
      setAssignments(nextAssignments)
      setReminderSettings({
        reminders_enabled:
          reminderSettingsData.settings?.reminders_enabled ??
          DEFAULT_REMINDER_SETTINGS.reminders_enabled,
        reminder_24h_enabled:
          reminderSettingsData.settings?.reminder_24h_enabled ??
          DEFAULT_REMINDER_SETTINGS.reminder_24h_enabled,
        reminder_24h_hours_before:
          reminderSettingsData.settings?.reminder_24h_hours_before ??
          DEFAULT_REMINDER_SETTINGS.reminder_24h_hours_before,
        reminder_1h_enabled:
          reminderSettingsData.settings?.reminder_1h_enabled ??
          DEFAULT_REMINDER_SETTINGS.reminder_1h_enabled,
        reminder_1h_hours_before:
          reminderSettingsData.settings?.reminder_1h_hours_before ??
          DEFAULT_REMINDER_SETTINGS.reminder_1h_hours_before,
        send_window_minutes:
          reminderSettingsData.settings?.send_window_minutes ??
          DEFAULT_REMINDER_SETTINGS.send_window_minutes,
        time_zone:
          reminderSettingsData.settings?.time_zone ?? DEFAULT_REMINDER_SETTINGS.time_zone,
      })
      setReminderPreview(reminderSettingsData.preview || null)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to load volunteer data'
      setErrorMessage(message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (authLoading || !isAdmin(profile?.role)) return

    const timeoutId = window.setTimeout(() => {
      void refresh()
    }, 0)

    return () => {
      window.clearTimeout(timeoutId)
    }
  }, [authLoading, profile, refresh])

  const manageShift = useMemo(
    () => shifts.find((shift) => shift.id === manageShiftId) ?? null,
    [manageShiftId, shifts]
  )

  const volunteerById = useMemo(
    () => new Map(volunteers.map((volunteer) => [volunteer.id, volunteer])),
    [volunteers]
  )

  const filteredVolunteers = useMemo(
    () =>
      volunteers.filter(
        (volunteer) =>
          volunteer.name.toLowerCase().includes(search.toLowerCase()) ||
          volunteer.email.toLowerCase().includes(search.toLowerCase()) ||
          volunteer.phone.includes(search)
      ),
    [volunteers, search]
  )

  const tableVolunteers = useMemo(
    () =>
      filteredVolunteers.map((volunteer) => ({
        ...volunteer,
        status: volunteer.status === 'confirmed' ? 'confirmed' : 'pending',
      })),
    [filteredVolunteers]
  )

  const confirmedVolunteers = useMemo(
    () => volunteers.filter((volunteer) => volunteer.status === 'confirmed'),
    [volunteers]
  )

  const openShifts = useMemo(
    () => shifts.filter((shift) => shift.filled_slots < shift.total_slots),
    [shifts]
  )

  const fillRate = useMemo(() => {
    if (shifts.length === 0) return 0

    const filled = shifts.reduce((acc, shift) => acc + shift.filled_slots, 0)
    const total = shifts.reduce((acc, shift) => acc + shift.total_slots, 0)

    return total > 0 ? Math.round((filled / total) * 100) : 0
  }, [shifts])

  const getAssigned = useCallback(
    (shift: VolunteerShift) =>
      assignments
        .filter((assignment) => assignment.shift_id === shift.id)
        .map((assignment) => volunteerById.get(assignment.volunteer_id))
        .filter((volunteer): volunteer is AvailableVolunteer => Boolean(volunteer)),
    [assignments, volunteerById]
  )

  const getEligible = useCallback(
    (shift: VolunteerShift) => {
      const assignedIds = new Set(
        assignments
          .filter((assignment) => assignment.shift_id === shift.id)
          .map((assignment) => assignment.volunteer_id)
      )

      return volunteers.filter(
        (volunteer) =>
          volunteer.status === 'confirmed' &&
          volunteer.availability.includes(shift.day) &&
          !assignedIds.has(volunteer.id)
      )
    },
    [assignments, volunteers]
  )

  const toggleShiftFilter = (key: 'days' | 'locations' | 'roles', value: string) => {
    setShiftFilters((current) => {
      const nextValues = current[key].includes(value)
        ? current[key].filter((entry) => entry !== value)
        : [...current[key], value]

      return {
        ...current,
        [key]: nextValues,
      }
    })
  }

  const handleAssignVolunteer = async (shiftId: string, volunteerId: string) => {
    setErrorMessage(null)

    const response = await fetch('/api/volunteers/assign', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ shiftId, volunteerId }),
    })

    if (!response.ok) {
      const payload = await response.json().catch(() => ({}))
      const message = payload.error || 'Failed to assign volunteer'
      setErrorMessage(message)
      window.alert(message)
      return
    }

    await refresh()
  }

  const handleRemoveVolunteer = async (shiftId: string, volunteerId: string) => {
    setErrorMessage(null)

    const response = await fetch(
      `/api/volunteers/assign?shiftId=${encodeURIComponent(shiftId)}&volunteerId=${encodeURIComponent(volunteerId)}`,
      { method: 'DELETE' }
    )

    if (!response.ok) {
      const payload = await response.json().catch(() => ({}))
      const message = payload.error || 'Failed to remove volunteer'
      setErrorMessage(message)
      window.alert(message)
      return
    }

    await refresh()
  }

  const resolveMessageVolunteerIds = useCallback((): string[] => {
    if (!messageModal) return []

    if (messageModal.kind === 'all') {
      return confirmedVolunteers.map((volunteer) => volunteer.id)
    }

    if (messageModal.kind === 'volunteer') {
      return [messageModal.volunteerId]
    }

    const shiftIdsForDay = new Set(
      shifts.filter((shift) => shift.day === messageModal.day).map((shift) => shift.id)
    )

    return [...new Set(
      assignments
        .filter((assignment) => shiftIdsForDay.has(assignment.shift_id))
        .map((assignment) => assignment.volunteer_id)
    )]
  }, [assignments, confirmedVolunteers, messageModal, shifts])

  const handleSendMessage = async (subject: string, message: string) => {
    const volunteerIds = resolveMessageVolunteerIds()

    if (volunteerIds.length === 0) {
      throw new Error('No volunteers found for this message')
    }

    const response = await fetch('/api/admin/notifications/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ volunteerIds, subject, message }),
    })

    const payload = await response.json().catch(() => ({}))

    if (!response.ok) {
      throw new Error(payload.error || 'Failed to send message')
    }
  }

  const handleReminderToggle = (
    key: 'reminders_enabled' | 'reminder_24h_enabled' | 'reminder_1h_enabled'
  ) => {
    setReminderSettings((current) => ({
      ...current,
      [key]: !current[key],
    }))
  }

  const handleReminderNumberChange = (
    key: 'reminder_24h_hours_before' | 'reminder_1h_hours_before' | 'send_window_minutes',
    value: string
  ) => {
    const nextValue = Number(value)
    if (!Number.isFinite(nextValue)) return

    setReminderSettings((current) => ({
      ...current,
      [key]: Math.max(1, Math.trunc(nextValue)),
    }))
  }

  const handleSaveReminderSettings = async () => {
    setSavingReminderSettings(true)
    setErrorMessage(null)

    try {
      const response = await fetch('/api/admin/notifications/reminder-settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(reminderSettings),
      })

      const payload = await response.json().catch(() => ({}))
      if (!response.ok) {
        throw new Error(payload.error || 'Failed to save reminder settings')
      }

      setReminderSettings(payload.settings)
      setReminderPreview(payload.preview || null)
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Failed to save reminder settings'
      setErrorMessage(message)
      window.alert(message)
    } finally {
      setSavingReminderSettings(false)
    }
  }

  const handleSendReminders = async () => {
    setSendingReminders(true)
    setErrorMessage(null)

    try {
      const response = await fetch('/api/admin/notifications/reminders', {
        method: 'POST',
      })

      const payload = await response.json().catch(() => ({}))

      if (!response.ok) {
        throw new Error(payload.error || 'Failed to send reminders')
      }

      setReminderResult({
        queued: payload.queued || 0,
        sent: payload.sent || 0,
        failed: payload.failed || 0,
        skipped: payload.skipped || 0,
      })
      setReminderPreview({
        now: payload.now || new Date().toISOString(),
        counts: payload.counts || {
          reminder_24h: { queued: 0 },
          reminder_1h: { queued: 0 },
        },
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to send reminders'
      setErrorMessage(message)
      window.alert(message)
    } finally {
      setSendingReminders(false)
    }
  }

  const getMessageModalTitle = () => {
    if (!messageModal) return 'Message volunteers'

    if (messageModal.kind === 'all') {
      return 'Message all volunteers'
    }

    if (messageModal.kind === 'volunteer') {
      const volunteer = volunteerById.get(messageModal.volunteerId)
      return volunteer ? `Message ${volunteer.name}` : 'Message volunteer'
    }

    const dayMatch = EVENT_DAYS.find((day) => day.date === messageModal.day)
    return dayMatch ? `Message volunteers on ${dayMatch.label}` : 'Message scheduled volunteers'
  }

  const getMessageModalSubtitle = () => {
    if (!messageModal) return 'This goes to the selected volunteers.'

    if (messageModal.kind === 'all') {
      return 'This goes to every confirmed volunteer.'
    }

    if (messageModal.kind === 'volunteer') {
      const volunteer = volunteerById.get(messageModal.volunteerId)
      return volunteer
        ? `This goes to ${volunteer.email}.`
        : 'This goes to the selected volunteer.'
    }

    const dayMatch = EVENT_DAYS.find((day) => day.date === messageModal.day)
    return dayMatch
      ? `This goes to every volunteer scheduled on ${dayMatch.label}.`
      : 'This goes to everyone scheduled for the selected shifts.'
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-light flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-text">Loading volunteer data...</p>
        </div>
      </div>
    )
  }

  if (!user || !profile || !isAdmin(profile.role)) {
    return (
      <div className="min-h-screen bg-gray-light flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-text text-lg mb-4">Admin access required</p>
          <Link href="/" className="text-teal hover:underline">
            Go to Homepage
          </Link>
        </div>
      </div>
    )
  }

  const allShiftRoles = [...new Set(shifts.map((shift) => shift.role))].sort()
  const allShiftLocations = [...new Set(shifts.map((shift) => shift.location))].sort()

  const filteredShifts = shifts.filter((shift) => {
    if (shiftFilters.days.length > 0 && !shiftFilters.days.includes(shift.day)) return false
    if (shiftFilters.roles.length > 0 && !shiftFilters.roles.includes(shift.role)) return false
    if (
      shiftFilters.locations.length > 0 &&
      !shiftFilters.locations.includes(shift.location)
    ) {
      return false
    }

    return true
  })

  const hasShiftFilters =
    shiftFilters.days.length > 0 ||
    shiftFilters.roles.length > 0 ||
    shiftFilters.locations.length > 0

  return (
    <div className="min-h-screen bg-gray-light">
      <AdminHeader />

      <main className="max-w-5xl mx-auto px-4 py-8">
        <div className="flex items-start justify-between mb-6 flex-wrap gap-4">
          <div>
            <h1 className="font-accent text-3xl font-bold text-charcoal">
              Volunteer Dashboard
            </h1>
            <p className="text-gray-text text-sm mt-1">BSW 2026 · May 4–8</p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => {
                setReminderResult(null)
                setReminderModal(true)
              }}
              className="btn-secondary text-sm py-2 px-4 flex items-center gap-2"
            >
              <BellIcon className="w-4 h-4" />
              Manage reminders
            </button>
            <button
              onClick={() => setMessageModal({ kind: 'all' })}
              className="btn-secondary text-sm py-2 px-4 flex items-center gap-2"
            >
              <MailIcon className="w-4 h-4" />
              Message all
            </button>
          </div>
        </div>

        {errorMessage && (
          <div className="mb-6 rounded-md border border-error/30 bg-red-50 px-4 py-3 text-sm text-red-800">
            {errorMessage}
          </div>
        )}

        <div className="card mb-6 flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="flex-1">
            <p className="text-sm text-gray-text mb-1">Overall shift fill rate</p>
            <div className="flex items-center gap-3">
              <p
                className={`text-4xl font-bold font-accent ${
                  fillRate >= 80
                    ? 'text-success'
                    : fillRate >= 60
                      ? 'text-orange'
                      : 'text-error'
                }`}
              >
                {fillRate}%
              </p>
              <div className="flex-1 bg-gray-border rounded-full h-2">
                <div
                  className={`h-2 rounded-full ${
                    fillRate >= 80 ? 'bg-success' : fillRate >= 60 ? 'bg-orange' : 'bg-error'
                  }`}
                  style={{ width: `${fillRate}%` }}
                />
              </div>
            </div>
          </div>
          <div className="flex gap-6 text-sm">
            <div className="text-center">
              <p className="text-2xl font-bold font-accent text-charcoal">{volunteers.length}</p>
              <p className="text-gray-text">Volunteers</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold font-accent text-teal">
                {confirmedVolunteers.length}
              </p>
              <p className="text-gray-text">Confirmed</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold font-accent text-orange">
                {volunteers.filter((volunteer) => volunteer.status === 'pending').length}
              </p>
              <p className="text-gray-text">Pending</p>
            </div>
          </div>
        </div>

        <div className="flex gap-1 border-b border-gray-border mb-6">
          {[
            { id: 'coverage', label: 'Coverage Gaps' },
            { id: 'volunteers', label: `Volunteers (${volunteers.length})` },
            { id: 'shifts', label: 'All Shifts' },
          ].map(({ id, label }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`px-5 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${
                activeTab === id
                  ? 'border-teal-500 text-teal'
                  : 'border-transparent text-gray-text hover:text-teal'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {activeTab === 'coverage' && (
          <div>
            <div className="flex gap-2 flex-wrap mb-5">
              {EVENT_DAYS.map((day) => {
                const dayShifts = shifts.filter((shift) => shift.day === day.date)
                const dayOpen = dayShifts.reduce(
                  (acc, shift) => acc + Math.max(0, shift.total_slots - shift.filled_slots),
                  0
                )

                return (
                  <button
                    key={day.date}
                    onClick={() => setMessageModal({ kind: 'day', day: day.date })}
                    className={`text-xs px-3 py-1.5 rounded-pill border font-medium transition-colors flex items-center gap-1.5 ${
                      dayOpen > 0
                        ? 'border-orange text-orange bg-orange-light hover:bg-orange hover:text-white'
                        : 'border-gray-border text-gray-mid cursor-default'
                    }`}
                    disabled={dayOpen === 0}
                  >
                    {day.label}
                    {dayOpen > 0 ? <span className="font-bold">{dayOpen} open</span> : <span>covered</span>}
                  </button>
                )
              })}
            </div>

            {openShifts.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-success text-lg font-semibold">All shifts covered.</p>
                <p className="text-gray-text text-sm mt-1">Nice work.</p>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                <p className="text-sm text-gray-text mb-1">
                  {openShifts.length} shift{openShifts.length !== 1 ? 's' : ''} still need
                  volunteers
                </p>
                {openShifts.map((shift) => {
                  const open = shift.total_slots - shift.filled_slots
                  const pct = Math.round((shift.filled_slots / shift.total_slots) * 100)
                  const day = EVENT_DAYS.find((item) => item.date === shift.day)

                  return (
                    <div
                      key={shift.id}
                      className="card flex flex-col sm:flex-row sm:items-center gap-4"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className="badge-featured text-xs">{shift.role}</span>
                          <span className="text-xs text-gray-text">{day?.label || shift.day}</span>
                        </div>
                        <p className="text-sm text-charcoal font-medium">{shift.location}</p>
                        <p className="text-xs text-gray-text">
                          {shift.start_time} - {shift.end_time}
                        </p>
                        <div className="mt-2 flex items-center gap-2">
                          <div className="flex-1 bg-gray-border rounded-full h-1.5">
                            <div
                              className="h-1.5 rounded-full bg-teal-500"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                          <span className="text-xs text-orange font-semibold">
                            {open} spot{open !== 1 ? 's' : ''} open
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={() => setManageShiftId(shift.id)}
                        className="btn-secondary text-sm py-2 px-4 shrink-0"
                      >
                        Manage
                      </button>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {activeTab === 'volunteers' && (
          <div>
            <div className="relative mb-4">
              <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-mid" />
              <input
                className="input pl-10"
                placeholder="Search by name, email, or phone..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </div>

            <VolunteerTable
              volunteers={tableVolunteers}
              availableDays={EVENT_DAYS.map((day) => ({ date: day.date, label: day.label }))}
              onMessageVolunteer={(volunteerId) =>
                setMessageModal({ kind: 'volunteer', volunteerId })
              }
              onRefresh={refresh}
            />
          </div>
        )}

        {activeTab === 'shifts' && (
          <div className="flex flex-col gap-4">
            <VolunteerFilters
              dayFilters={shiftFilters.days}
              locationFilters={shiftFilters.locations}
              roleFilters={shiftFilters.roles}
              availableDays={EVENT_DAYS.map((day) => ({ date: day.date, label: day.label }))}
              availableLocations={allShiftLocations}
              availableRoles={allShiftRoles}
              onToggleDayFilter={(day) => toggleShiftFilter('days', day)}
              onToggleLocationFilter={(location) => toggleShiftFilter('locations', location)}
              onToggleRoleFilter={(role) => toggleShiftFilter('roles', role)}
              onClearDayFilters={() => setShiftFilters((current) => ({ ...current, days: [] }))}
              onClearLocationFilters={() =>
                setShiftFilters((current) => ({ ...current, locations: [] }))
              }
              onClearRoleFilters={() => setShiftFilters((current) => ({ ...current, roles: [] }))}
              onClearAllFilters={() =>
                setShiftFilters({ days: [], locations: [], roles: [] })
              }
            />

            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-text">
                {filteredShifts.length} shift{filteredShifts.length !== 1 ? 's' : ''}
              </p>
              {hasShiftFilters && (
                <button
                  onClick={() => setShiftFilters({ days: [], locations: [], roles: [] })}
                  className="text-sm text-gray-text hover:text-teal underline underline-offset-2"
                >
                  Clear all filters
                </button>
              )}
            </div>

            <div className="flex flex-col gap-3">
              {filteredShifts.map((shift) => {
                const open = shift.total_slots - shift.filled_slots
                const pct = Math.round((shift.filled_slots / shift.total_slots) * 100)
                const day = EVENT_DAYS.find((item) => item.date === shift.day)

                return (
                  <div
                    key={shift.id}
                    className="card flex flex-col sm:flex-row sm:items-center gap-4"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="badge-default text-xs">{shift.role}</span>
                        <span className="text-xs text-gray-text">
                          {day?.label || shift.day} · {shift.start_time}-{shift.end_time}
                        </span>
                      </div>
                      <p className="text-sm text-charcoal">{shift.location}</p>
                      <div className="mt-2 flex items-center gap-2">
                        <div className="w-28 bg-gray-border rounded-full h-1.5">
                          <div
                            className={`h-1.5 rounded-full ${
                              pct === 100 ? 'bg-success' : 'bg-teal-500'
                            }`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <span className="text-xs text-gray-text">
                          {shift.filled_slots}/{shift.total_slots} filled
                          {open > 0 && (
                            <span className="text-orange font-medium"> · {open} open</span>
                          )}
                        </span>
                      </div>
                    </div>
                    {pct === 100 && (
                      <span className="text-xs text-success font-semibold shrink-0">Full</span>
                    )}
                  </div>
                )
              })}
              {filteredShifts.length === 0 && (
                <p className="text-center text-gray-text py-10 text-sm">
                  No shifts match those filters.
                </p>
              )}
            </div>
          </div>
        )}
      </main>

      {manageShift && (
        <div
          className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50"
          onClick={(event) => {
            if (event.target === event.currentTarget) setManageShiftId(null)
          }}
        >
          <div className="bg-white rounded-md w-full max-w-lg shadow-card max-h-[90vh] overflow-y-auto">
            <div className="p-6 flex flex-col gap-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="font-accent text-xl font-semibold text-charcoal">
                    {manageShift.role}
                  </h3>
                  <p className="text-sm text-gray-text mt-0.5">
                    Assign volunteers to this shift
                  </p>
                </div>
                <button
                  onClick={() => setManageShiftId(null)}
                  className="text-gray-mid hover:text-charcoal shrink-0"
                >
                  <CloseIcon />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3 bg-gray-light rounded-sm p-4 text-sm">
                <div>
                  <span className="text-gray-text">Time: </span>
                  <span className="font-medium text-charcoal">
                    {manageShift.start_time} - {manageShift.end_time}
                  </span>
                </div>
                <div>
                  <span className="text-gray-text">Location: </span>
                  <span className="font-medium text-charcoal">{manageShift.location}</span>
                </div>
                <div>
                  <span className="text-gray-text">Required: </span>
                  <span className="font-medium text-charcoal">
                    {manageShift.total_slots} volunteers
                  </span>
                </div>
                <div>
                  <span className="text-gray-text">Assigned: </span>
                  <span className="font-medium text-charcoal">
                    {getAssigned(manageShift).length} volunteers
                  </span>
                </div>
              </div>

              <div>
                <h4 className="font-accent font-semibold text-charcoal mb-3">
                  Currently Assigned ({getAssigned(manageShift).length})
                </h4>
                {getAssigned(manageShift).length === 0 ? (
                  <p className="text-sm text-gray-text italic">No volunteers assigned yet.</p>
                ) : (
                  <div className="flex flex-col gap-2">
                    {getAssigned(manageShift).map((volunteer) => (
                      <AssignmentActions
                        key={volunteer.id}
                        isAssigned={true}
                        volunteerName={volunteer.name}
                        volunteerEmail={volunteer.email}
                        onAssign={() => {}}
                        onRemove={() => handleRemoveVolunteer(manageShift.id, volunteer.id)}
                      />
                    ))}
                  </div>
                )}
              </div>

              <div>
                <h4 className="font-accent font-semibold text-charcoal mb-3">
                  Eligible Volunteers ({getEligible(manageShift).length})
                </h4>
                {getEligible(manageShift).length === 0 ? (
                  <p className="text-sm text-gray-text italic">
                    No confirmed volunteers available for this day.
                  </p>
                ) : (
                  <div className="flex flex-col gap-2">
                    {getEligible(manageShift).map((volunteer) => (
                      <AssignmentActions
                        key={volunteer.id}
                        isAssigned={false}
                        volunteerName={volunteer.name}
                        volunteerEmail={volunteer.email}
                        onAssign={() => handleAssignVolunteer(manageShift.id, volunteer.id)}
                        onRemove={() => {}}
                      />
                    ))}
                  </div>
                )}
              </div>

              <div className="flex justify-end pt-2">
                <button
                  onClick={() => setManageShiftId(null)}
                  className="text-sm font-medium text-white bg-charcoal px-8 py-2.5 rounded-sm hover:bg-black transition-colors"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <MessageModal
        isOpen={messageModal !== null}
        onClose={() => setMessageModal(null)}
        title={getMessageModalTitle()}
        subtitle={getMessageModalSubtitle()}
        onSend={handleSendMessage}
      />

      {reminderModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-md p-6 max-w-lg w-full shadow-card max-h-[90vh] overflow-y-auto">
            <div className="flex flex-col gap-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="font-accent text-xl font-semibold text-charcoal mb-1">
                    Automated reminders
                  </h3>
                  <p className="text-sm text-gray-text">
                    Vercel checks reminders every hour. Admins can keep the default 24-hour and
                    1-hour reminders, adjust the lead times, or run the check manually.
                  </p>
                </div>
                <button
                  onClick={() => setReminderModal(false)}
                  className="text-gray-mid hover:text-charcoal shrink-0"
                >
                  <CloseIcon />
                </button>
              </div>

              {reminderResult && (
                <div className="rounded-md border border-teal/20 bg-teal-light/40 px-4 py-3">
                  <div className="flex items-center gap-2 text-charcoal">
                    <CheckIcon className="w-4 h-4 text-teal" />
                    <p className="text-sm font-medium">Reminder check completed</p>
                  </div>
                  <p className="text-sm text-gray-text mt-1">
                    {reminderResult.queued} queued, {reminderResult.sent} sent,{' '}
                    {reminderResult.failed} failed, {reminderResult.skipped} skipped as already
                    handled.
                  </p>
                </div>
              )}

              <div className="rounded-md border border-gray-border bg-gray-light px-4 py-3 text-sm text-gray-text">
                Current timezone: <span className="font-medium text-charcoal">{reminderSettings.time_zone}</span>
                <br />
                Cron schedule: <span className="font-medium text-charcoal">hourly</span>
                {reminderPreview && (
                  <>
                    <br />
                    If the reminder check ran right now:
                    <span className="font-medium text-charcoal">
                      {' '}
                      {reminderPreview.counts.reminder_24h.queued} first reminder
                      {reminderPreview.counts.reminder_24h.queued === 1 ? '' : 's'} and{' '}
                      {reminderPreview.counts.reminder_1h.queued} second reminder
                      {reminderPreview.counts.reminder_1h.queued === 1 ? '' : 's'}
                    </span>{' '}
                    would be queued.
                  </>
                )}
              </div>

              <div className="rounded-md border border-gray-border p-4">
                <label className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-charcoal">Enable automated reminders</p>
                    <p className="text-xs text-gray-text">
                      Turn all shift reminder automation on or off.
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={reminderSettings.reminders_enabled}
                    onChange={() => handleReminderToggle('reminders_enabled')}
                    className="h-4 w-4"
                  />
                </label>
              </div>

              <div className="grid gap-4">
                <div className="rounded-md border border-gray-border p-4">
                  <label className="flex items-center justify-between gap-3 mb-3">
                    <div>
                      <p className="text-sm font-medium text-charcoal">First reminder</p>
                      <p className="text-xs text-gray-text">
                        Defaults to 24 hours before the shift.
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      checked={reminderSettings.reminder_24h_enabled}
                      onChange={() => handleReminderToggle('reminder_24h_enabled')}
                      className="h-4 w-4"
                    />
                  </label>
                  <div>
                    <label className="text-xs uppercase tracking-wide text-gray-text">
                      Hours before shift
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={336}
                      value={reminderSettings.reminder_24h_hours_before}
                      onChange={(event) =>
                        handleReminderNumberChange(
                          'reminder_24h_hours_before',
                          event.target.value
                        )
                      }
                      className="input mt-1"
                    />
                  </div>
                </div>

                <div className="rounded-md border border-gray-border p-4">
                  <label className="flex items-center justify-between gap-3 mb-3">
                    <div>
                      <p className="text-sm font-medium text-charcoal">Second reminder</p>
                      <p className="text-xs text-gray-text">
                        Defaults to 1 hour before the shift.
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      checked={reminderSettings.reminder_1h_enabled}
                      onChange={() => handleReminderToggle('reminder_1h_enabled')}
                      className="h-4 w-4"
                    />
                  </label>
                  <div>
                    <label className="text-xs uppercase tracking-wide text-gray-text">
                      Hours before shift
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={336}
                      value={reminderSettings.reminder_1h_hours_before}
                      onChange={(event) =>
                        handleReminderNumberChange(
                          'reminder_1h_hours_before',
                          event.target.value
                        )
                      }
                      className="input mt-1"
                    />
                  </div>
                </div>

                <div className="rounded-md border border-gray-border p-4">
                  <label className="text-xs uppercase tracking-wide text-gray-text">
                    Reminder send window in minutes
                  </label>
                  <input
                    type="number"
                    min={5}
                    max={240}
                    value={reminderSettings.send_window_minutes}
                    onChange={(event) =>
                      handleReminderNumberChange('send_window_minutes', event.target.value)
                    }
                    className="input mt-1"
                  />
                  <p className="text-xs text-gray-text mt-2">
                    Keep this at 60 for the hourly cron unless you have a reason to widen the
                    catch-up window.
                  </p>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  onClick={() => setReminderModal(false)}
                  className="btn-secondary"
                  disabled={savingReminderSettings || sendingReminders}
                >
                  Close
                </button>
                <button
                  onClick={handleSaveReminderSettings}
                  disabled={savingReminderSettings || sendingReminders}
                  className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {savingReminderSettings ? 'Saving...' : 'Save settings'}
                </button>
                <button
                  onClick={handleSendReminders}
                  disabled={savingReminderSettings || sendingReminders}
                  className="bg-teal-500 text-white px-6 py-2 rounded-md font-medium hover:bg-teal-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {sendingReminders ? 'Running...' : 'Run reminder check now'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
