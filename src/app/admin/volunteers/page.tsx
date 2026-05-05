'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useAuth } from '@/contexts/auth-context'
import {
  BellIcon,
  MailIcon,
  SearchIcon,
  CloseIcon,
} from '@/components/icons'
import { VolunteerTable } from '@/components/admin/VolunteerTable'
import { MessageModal } from '@/components/admin/MessageModal'
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

interface ReminderSettingsState {
  reminders_enabled: boolean
  reminder_24h_enabled: boolean
  reminder_24h_hours_before: number
  reminder_1h_enabled: boolean
  reminder_1h_hours_before: number
  send_window_minutes: number
  time_zone: string
}

type ReminderModalView = 'settings' | 'messages' | 'results'

interface SendMessageResponse {
  error?: string
}

interface EmailResult {
  id: string
  type: string
  delivery_scope: string | null
  status: string
  subject: string
  recipient_email: string | null
  scheduled_for: string
  sent_at: string | null
  error_message: string | null
  created_at: string | null
}

interface EmailResultSummary {
  sent: number
  failed: number
  pending: number
  other: number
}

export default function AdminVolunteersPage() {
  const { user, profile, loading: authLoading } = useAuth()
  const [volunteers, setVolunteers] = useState<AvailableVolunteer[]>([])
  const [shifts, setShifts] = useState<VolunteerShift[]>([])
  const [assignments, setAssignments] = useState<ShiftAssignment[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [volunteerSort, setVolunteerSort] = useState<'name' | 'most_shifts' | 'fewest_shifts'>('name')
  const [volunteerDayFilter, setVolunteerDayFilter] = useState<string[]>([])
  const [volunteerShiftFilter, setVolunteerShiftFilter] = useState<'all' | 'with_shifts' | 'no_shifts'>('all')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const [messageModal, setMessageModal] = useState<MessageTarget | null>(null)
  const [reminderModal, setReminderModal] = useState(false)
  const [reminderModalView, setReminderModalView] = useState<ReminderModalView>('settings')
  const [reminderSettings, setReminderSettings] = useState<ReminderSettingsState>({
    ...DEFAULT_REMINDER_SETTINGS,
  })
  const [savingReminderSettings, setSavingReminderSettings] = useState(false)
  const [scheduledMessageDay, setScheduledMessageDay] = useState<string>(EVENT_DAYS[0]?.date ?? '')
  const [scheduledMessageSubject, setScheduledMessageSubject] = useState('')
  const [scheduledMessageBody, setScheduledMessageBody] = useState('')
  const [sendingScheduledMessage, setSendingScheduledMessage] = useState(false)
  const [scheduledMessageNotice, setScheduledMessageNotice] = useState<string | null>(null)
  const [sendingTestReminder, setSendingTestReminder] = useState(false)
  const [testReminderNotice, setTestReminderNotice] = useState<string | null>(null)
  const [emailResults, setEmailResults] = useState<EmailResult[]>([])
  const [emailResultSummary, setEmailResultSummary] = useState<EmailResultSummary>({
    sent: 0,
    failed: 0,
    pending: 0,
    other: 0,
  })
  const [loadingEmailResults, setLoadingEmailResults] = useState(false)

  const openReminderModal = useCallback((day?: string) => {
    setScheduledMessageNotice(null)
    setTestReminderNotice(null)
    setReminderModalView('settings')
    if (day) {
      setScheduledMessageDay(day)
      setReminderModalView('messages')
    }
    setReminderModal(true)
  }, [])

  const loadEmailResults = useCallback(async () => {
    setLoadingEmailResults(true)
    setErrorMessage(null)

    try {
      const response = await fetch('/api/admin/notifications/results')
      const payload = await response.json().catch(() => ({}))

      if (!response.ok) {
        throw new Error(payload.error || 'Failed to load email results')
      }

      setEmailResults((payload.notifications || []) as EmailResult[])
      setEmailResultSummary({
        sent: payload.summary?.sent || 0,
        failed: payload.summary?.failed || 0,
        pending: payload.summary?.pending || 0,
        other: payload.summary?.other || 0,
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to load email results'
      setErrorMessage(message)
    } finally {
      setLoadingEmailResults(false)
    }
  }, [])

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

  useEffect(() => {
    if (!reminderModal || reminderModalView !== 'results') return

    const timeoutId = window.setTimeout(() => {
      void loadEmailResults()
    }, 0)

    return () => {
      window.clearTimeout(timeoutId)
    }
  }, [loadEmailResults, reminderModal, reminderModalView])

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

  const tableVolunteers = useMemo(() => {
    let result = filteredVolunteers.map((volunteer) => ({
      ...volunteer,
      status: volunteer.status === 'confirmed' ? 'confirmed' : 'pending',
    }))

    if (volunteerShiftFilter === 'with_shifts') {
      result = result.filter((v) => v.shift_count > 0)
    } else if (volunteerShiftFilter === 'no_shifts') {
      result = result.filter((v) => v.shift_count === 0)
    }

    if (volunteerDayFilter.length > 0) {
      result = result.filter((v) =>
        volunteerDayFilter.some((day) => v.availability.includes(day))
      )
    }

    if (volunteerSort === 'most_shifts') {
      result = [...result].sort((a, b) => b.shift_count - a.shift_count || a.name.localeCompare(b.name))
    } else if (volunteerSort === 'fewest_shifts') {
      result = [...result].sort((a, b) => a.shift_count - b.shift_count || a.name.localeCompare(b.name))
    } else {
      result = [...result].sort((a, b) => a.name.localeCompare(b.name))
    }

    return result
  }, [filteredVolunteers, volunteerSort, volunteerDayFilter, volunteerShiftFilter])

  const confirmedVolunteers = useMemo(
    () => volunteers.filter((volunteer) => volunteer.status === 'confirmed'),
    [volunteers]
  )

  const assignedVolunteerCount = useMemo(
    () => confirmedVolunteers.filter((v) => v.shift_count > 0).length,
    [confirmedVolunteers]
  )
  const unassignedVolunteerCount = confirmedVolunteers.length - assignedVolunteerCount
  const totalShiftAssignments = useMemo(
    () => confirmedVolunteers.reduce((acc, v) => acc + v.shift_count, 0),
    [confirmedVolunteers]
  )





  const resolveMessageVolunteerIds = useCallback((): string[] => {
    if (!messageModal) return []

    if (messageModal.kind === 'all') {
      return confirmedVolunteers.map((volunteer) => volunteer.id)
    }

    if (messageModal.kind === 'volunteer') {
      return [messageModal.volunteerId]
    }

    return []
  }, [confirmedVolunteers, messageModal])

  const getVolunteerIdsForDay = useCallback(
    (day: string) => {
      const shiftIdsForDay = new Set(shifts.filter((shift) => shift.day === day).map((shift) => shift.id))

      return [
        ...new Set(
          assignments
            .filter((assignment) => shiftIdsForDay.has(assignment.shift_id))
            .map((assignment) => assignment.volunteer_id)
        ),
      ]
    },
    [assignments, shifts]
  )

  const handleSendMessage = async (subject: string, message: string) => {
    const volunteerIds = resolveMessageVolunteerIds()

    if (volunteerIds.length === 0) {
      throw new Error('No volunteers found for this message')
    }

    const response = await fetch('/api/admin/notifications/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        volunteerIds,
        subject,
        message,
      }),
    })

    const payload = (await response.json().catch(() => ({}))) as SendMessageResponse

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
    key: 'reminder_24h_hours_before' | 'reminder_1h_hours_before',
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
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Failed to save reminder settings'
      setErrorMessage(message)
      window.alert(message)
    } finally {
      setSavingReminderSettings(false)
    }
  }

  const handleQueueTestReminder = async () => {
    setSendingTestReminder(true)
    setTestReminderNotice(null)
    setErrorMessage(null)

    try {
      const response = await fetch('/api/admin/notifications/reminders/test', {
        method: 'POST',
      })
      const payload = await response.json().catch(() => ({}))

      if (!response.ok) {
        throw new Error(payload.error || 'Failed to queue test reminder')
      }

      setTestReminderNotice(
        `Test reminder queued for ${payload.recipientEmail || 'your email'}. Supabase checks the email queue every 10 minutes, so it should send soon.`
      )
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to queue test reminder'
      setErrorMessage(message)
      window.alert(message)
    } finally {
      setSendingTestReminder(false)
    }
  }



  const handleScheduleStartOfDayMessage = async () => {
    const volunteerIds = getVolunteerIdsForDay(scheduledMessageDay)

    if (volunteerIds.length === 0) {
      const message = 'No scheduled volunteers were found for that day.'
      setScheduledMessageNotice(message)
      window.alert(message)
      return
    }

    if (!scheduledMessageSubject.trim() || !scheduledMessageBody.trim()) {
      const message = 'Subject and message are required.'
      setScheduledMessageNotice(message)
      window.alert(message)
      return
    }

    setSendingScheduledMessage(true)
    setScheduledMessageNotice(null)
    setErrorMessage(null)

    try {
      const response = await fetch('/api/admin/notifications/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          volunteerIds,
          subject: scheduledMessageSubject,
          message: scheduledMessageBody,
          filters: { day: scheduledMessageDay },
        }),
      })

      const payload = (await response.json().catch(() => ({}))) as SendMessageResponse

      if (!response.ok) {
        throw new Error(payload.error || 'Failed to schedule start-of-day message')
      }

      setScheduledMessageNotice('Start-of-day message scheduled.')
      setScheduledMessageSubject('')
      setScheduledMessageBody('')
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Failed to schedule start-of-day message'
      setScheduledMessageNotice(message)
      setErrorMessage(message)
      window.alert(message)
    } finally {
      setSendingScheduledMessage(false)
    }
  }

  const getMessageModalTitle = () => {
    if (!messageModal) return 'Message volunteers'

    if (messageModal.kind === 'all') {
      return 'Send message to all volunteers now'
    }

    if (messageModal.kind === 'volunteer') {
      const volunteer = volunteerById.get(messageModal.volunteerId)
      return volunteer ? `Send message to ${volunteer.name} now` : 'Send message now'
    }

    return 'Send message now'
  }

  const getMessageModalSubtitle = () => {
    if (!messageModal) return 'This sends immediately to the selected volunteers.'

    if (messageModal.kind === 'all') {
      return 'This sends immediately to every confirmed volunteer.'
    }

    if (messageModal.kind === 'volunteer') {
      const volunteer = volunteerById.get(messageModal.volunteerId)
      return volunteer
        ? `This sends immediately to ${volunteer.email}.`
        : 'This sends immediately to the selected volunteer.'
    }

    return 'This sends immediately to the selected volunteers.'
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
                openReminderModal()
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

        <div className="card mb-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div>
              <p className="text-3xl font-bold font-accent text-charcoal">
                {confirmedVolunteers.length}
              </p>
              <p className="text-sm text-gray-text">Confirmed volunteers</p>
            </div>
            <div>
              <p className="text-3xl font-bold font-accent text-teal">
                {assignedVolunteerCount}
              </p>
              <p className="text-sm text-gray-text">Assigned</p>
            </div>
            <div>
              <p className="text-3xl font-bold font-accent text-orange">
                {unassignedVolunteerCount}
              </p>
              <p className="text-sm text-gray-text">Need placement</p>
            </div>
            <div>
              <p className="text-3xl font-bold font-accent text-charcoal">
                {totalShiftAssignments}
              </p>
              <p className="text-sm text-gray-text">Total shifts taken</p>
            </div>
          </div>
          <p className="mt-3 text-xs text-gray-text">
            Shift coverage and scheduling live on the{' '}
            <Link href="/admin/shifts" className="text-teal underline underline-offset-2">
              Shifts page
            </Link>
            .
          </p>
        </div>

            <div className="mb-5 rounded-2xl border border-gray-border bg-white p-4 shadow-sm">
              <div className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-end">
                <div>
                  <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-gray-text">
                    Find a volunteer
                  </label>
                  <div className="relative">
                  <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-mid" />
                  <input
                    className="input input-icon w-full"
                    placeholder="Search by name, email, or phone..."
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                  />
                  </div>
                </div>
                <div>
                  <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-gray-text">
                    Sort list
                  </label>
                <select
                  value={volunteerSort}
                  onChange={(e) => setVolunteerSort(e.target.value as typeof volunteerSort)}
                    className="input min-w-44 py-2 pr-8 text-sm"
                >
                    <option value="name">Name A–Z</option>
                    <option value="most_shifts">Most shifts first</option>
                    <option value="fewest_shifts">Fewest shifts first</option>
                </select>
              </div>
              </div>

              <div className="mt-4 grid gap-4 border-t border-gray-border pt-4 lg:grid-cols-[auto_1fr_auto] lg:items-start">
                <div>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-text">
                    Show volunteers
                  </p>
                  <div className="flex flex-wrap gap-2">
                {(['all', 'with_shifts', 'no_shifts'] as const).map((val) => {
                      const labels = { all: 'Everyone', with_shifts: 'Assigned', no_shifts: 'Unassigned' }
                  return (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setVolunteerShiftFilter(val)}
                          className={`rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-colors ${
                        volunteerShiftFilter === val
                          ? 'border-teal-500 bg-teal-500 text-white'
                              : 'border-gray-border bg-white text-charcoal hover:border-teal-300 hover:text-teal'
                      }`}
                    >
                      {labels[val]}
                    </button>
                  )
                })}
                  </div>
                </div>

                <div>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-text">
                    Available on
                  </p>
                  <div className="flex flex-wrap gap-2">
                {EVENT_DAYS.map((day) => (
                  <button
                    key={day.date}
                    type="button"
                    onClick={() =>
                      setVolunteerDayFilter((current) =>
                        current.includes(day.date)
                          ? current.filter((d) => d !== day.date)
                          : [...current, day.date]
                      )
                    }
                        className={`rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-colors ${
                      volunteerDayFilter.includes(day.date)
                        ? 'border-teal-500 bg-teal-500 text-white'
                            : 'border-gray-border bg-white text-charcoal hover:border-teal-300 hover:text-teal'
                    }`}
                  >
                    {day.label.replace(/^(Mon|Tue|Wed|Thu|Fri|Sat|Sun),\s*/, '')}
                  </button>
                ))}
                  </div>
                </div>

                <div className="flex items-center justify-between gap-3 lg:flex-col lg:items-end">
                  <span className="rounded-full bg-gray-light px-3 py-1.5 text-xs font-semibold text-gray-text">
                    Showing {tableVolunteers.length} of {volunteers.length}
                  </span>
                {(volunteerDayFilter.length > 0 || volunteerShiftFilter !== 'all' || search) && (
                  <button
                    type="button"
                    onClick={() => {
                      setVolunteerDayFilter([])
                      setVolunteerShiftFilter('all')
                      setSearch('')
                    }}
                      className="text-xs font-semibold text-teal underline underline-offset-2 hover:text-teal-700 transition-colors"
                  >
                      Clear filters
                  </button>
                )}
                </div>
              </div>
            </div>

            <VolunteerTable
              volunteers={tableVolunteers}
              availableDays={EVENT_DAYS.map((day) => ({ date: day.date, label: day.label }))}
              onMessageVolunteer={(volunteerId) =>
                setMessageModal({ kind: 'volunteer', volunteerId })
              }
              onRefresh={refresh}
              assignments={assignments}
              shifts={shifts}
            />
      </main>

      <MessageModal
        isOpen={messageModal !== null}
        onClose={() => setMessageModal(null)}
        title={getMessageModalTitle()}
        subtitle={getMessageModalSubtitle()}
        submitLabel="Send Message"
        successTitle="Message sent!"
        successMessage="Volunteers will receive the message shortly."
        onSend={handleSendMessage}
      />

      {reminderModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-md p-6 max-w-2xl w-full shadow-card max-h-[90vh] overflow-y-auto">
            <div className="flex flex-col gap-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="font-accent text-xl font-semibold text-charcoal mb-1">
                    Automated reminders
                  </h3>
                  <p className="text-sm text-gray-text">
                    Supabase checks every 10 minutes and sends reminders when confirmed volunteers
                    enter the active reminder window.
                  </p>
                </div>
                <button
                  onClick={() => setReminderModal(false)}
                  className="text-gray-mid hover:text-charcoal shrink-0"
                >
                  <CloseIcon />
                </button>
              </div>

              <div className="grid grid-cols-3 gap-1 rounded-md border border-gray-border bg-gray-light p-1">
                {[
                  ['settings', 'Reminder settings'],
                  ['messages', 'Messages'],
                  ['results', 'Email results'],
                ].map(([view, label]) => (
                  <button
                    key={view}
                    type="button"
                    onClick={() => setReminderModalView(view as ReminderModalView)}
                    className={`rounded px-3 py-2 text-sm font-medium transition-colors ${
                      reminderModalView === view
                        ? 'bg-white text-charcoal shadow-sm'
                        : 'text-gray-text hover:text-charcoal'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>

              {reminderModalView === 'settings' && (
                <>
                  <div className="rounded-md border border-gray-border p-4">
                    <label className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-medium text-charcoal">
                          Enable automated reminders
                        </p>
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

                  <div className="grid gap-4 sm:grid-cols-2">
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
                  </div>
                </>
              )}

              {reminderModalView === 'messages' && (
                <div className="grid gap-4">
                  <div className="rounded-md border border-gray-border p-4">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <p className="text-sm font-medium text-charcoal">Test reminder email</p>
                        <p className="text-sm text-gray-text mt-1">
                          Queue a sample reminder to your email. Supabase checks the email queue
                          every 10 minutes, so it should send soon.
                        </p>
                        {testReminderNotice && (
                          <p className="text-sm text-gray-text mt-3">{testReminderNotice}</p>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => void handleQueueTestReminder()}
                        disabled={sendingTestReminder}
                        className="bg-teal-500 text-white px-5 py-2 rounded-md font-medium hover:bg-teal-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {sendingTestReminder ? 'Queueing...' : 'Queue test email'}
                      </button>
                    </div>
                  </div>

                  <div className="rounded-md border border-gray-border p-4">
                    <div className="mb-3">
                      <p className="text-sm font-medium text-charcoal">Start-of-day broadcast</p>
                      <p className="text-sm text-gray-text">
                        Queue a day-specific volunteer email now and have it send automatically at
                        8:00 PM the night before in America/Denver.
                      </p>
                    </div>

                    <div className="grid gap-3">
                    <div>
                      <label className="text-xs uppercase tracking-wide text-gray-text">Day</label>
                      <select
                        value={scheduledMessageDay}
                        onChange={(event) => setScheduledMessageDay(event.target.value)}
                        className="input mt-1"
                      >
                        {EVENT_DAYS.map((day) => {
                          const count = getVolunteerIdsForDay(day.date).length
                          return (
                            <option key={day.date} value={day.date}>
                              {day.label} ({count} scheduled)
                            </option>
                          )
                        })}
                      </select>
                    </div>

                    <div>
                      <label className="text-xs uppercase tracking-wide text-gray-text">
                        Subject
                      </label>
                      <input
                        type="text"
                        value={scheduledMessageSubject}
                        onChange={(event) => setScheduledMessageSubject(event.target.value)}
                        className="input mt-1"
                        placeholder="Enter scheduled message subject"
                      />
                    </div>

                    <div>
                      <label className="text-xs uppercase tracking-wide text-gray-text">
                        Message
                      </label>
                      <textarea
                        value={scheduledMessageBody}
                        onChange={(event) => setScheduledMessageBody(event.target.value)}
                        className="input mt-1"
                        rows={5}
                        placeholder="Enter the message volunteers should receive at the start of the day..."
                      />
                    </div>

                    <p className="text-xs text-gray-text">
                      This will go to{' '}
                      <span className="font-medium text-charcoal">
                        {getVolunteerIdsForDay(scheduledMessageDay).length}
                      </span>{' '}
                      volunteer
                      {getVolunteerIdsForDay(scheduledMessageDay).length === 1 ? '' : 's'} currently scheduled that day.
                    </p>

                    {scheduledMessageNotice && (
                      <p className="text-sm text-gray-text">{scheduledMessageNotice}</p>
                    )}

                    <div className="flex justify-end">
                      <button
                        type="button"
                        onClick={() => void handleScheduleStartOfDayMessage()}
                        disabled={sendingScheduledMessage}
                        className="bg-teal-500 text-white px-6 py-2 rounded-md font-medium hover:bg-teal-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {sendingScheduledMessage ? 'Scheduling...' : 'Schedule message'}
                      </button>
                    </div>
                  </div>
                </div>
                </div>
              )}

              {reminderModalView === 'results' && (
                <div className="grid gap-4">
                  <div className="grid gap-3 sm:grid-cols-4">
                    {[
                      { label: 'Sent', value: emailResultSummary.sent, colorClass: 'text-green-700' },
                      { label: 'Failed', value: emailResultSummary.failed, colorClass: 'text-red-700' },
                      { label: 'Pending', value: emailResultSummary.pending, colorClass: 'text-amber-700' },
                      { label: 'Other', value: emailResultSummary.other, colorClass: 'text-gray-text' },
                    ].map((item) => (
                      <div key={item.label} className="rounded-md border border-gray-border p-3">
                        <p className="text-xs uppercase tracking-wide text-gray-text">{item.label}</p>
                        <p className={`mt-1 text-2xl font-semibold ${item.colorClass}`}>{item.value}</p>
                      </div>
                    ))}
                  </div>

                  <div className="rounded-md border border-gray-border p-4">
                    <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <p className="text-sm font-medium text-charcoal">Recent email activity</p>
                        <p className="text-sm text-gray-text">
                          Shows the latest reminder and admin message email records.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => void loadEmailResults()}
                        disabled={loadingEmailResults}
                        className="btn-secondary"
                      >
                        {loadingEmailResults ? 'Refreshing...' : 'Refresh'}
                      </button>
                    </div>

                    {emailResults.length === 0 ? (
                      <p className="text-sm text-gray-text">
                        {loadingEmailResults ? 'Loading email results...' : 'No email results found yet.'}
                      </p>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-border text-sm">
                          <thead>
                            <tr className="text-left text-xs uppercase tracking-wide text-gray-text">
                              <th className="py-2 pr-4 font-medium">Status</th>
                              <th className="py-2 pr-4 font-medium">Message kind</th>
                              <th className="py-2 pr-4 font-medium">Subject</th>
                              <th className="py-2 pr-4 font-medium">Recipient</th>
                              <th className="py-2 pr-4 font-medium">Time</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-border">
                            {emailResults.map((result) => {
                              const timestamp = result.sent_at || result.created_at || result.scheduled_for
                              const statusClass =
                                result.status === 'sent'
                                  ? 'bg-green-50 text-green-700'
                                  : result.status === 'failed'
                                    ? 'bg-red-50 text-red-700'
                                    : 'bg-amber-50 text-amber-700'
                              const messageKind = result.delivery_scope
                                ? result.delivery_scope.replaceAll('_', ' ')
                                : result.type.replaceAll('_', ' ')

                              return (
                                <tr key={result.id}>
                                  <td className="py-3 pr-4 align-top">
                                    <span className={`rounded-full px-2 py-1 text-xs font-medium ${statusClass}`}>
                                      {result.status}
                                    </span>
                                    {result.error_message && (
                                      <p className="mt-1 max-w-xs text-xs text-red-700">
                                        {result.error_message}
                                      </p>
                                    )}
                                  </td>
                                  <td className="py-3 pr-4 align-top text-gray-text">
                                    {messageKind}
                                  </td>
                                  <td className="py-3 pr-4 align-top text-charcoal">
                                    {result.subject}
                                  </td>
                                  <td className="py-3 pr-4 align-top text-gray-text">
                                    {result.recipient_email || 'Account email'}
                                  </td>
                                  <td className="py-3 pr-4 align-top text-gray-text">
                                    {new Date(timestamp).toLocaleString()}
                                  </td>
                                </tr>
                              )
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-2">
                <button
                  onClick={() => setReminderModal(false)}
                  className="btn-secondary"
                  disabled={savingReminderSettings}
                >
                  Close
                </button>
                {reminderModalView === 'settings' && (
                  <button
                    onClick={handleSaveReminderSettings}
                    disabled={savingReminderSettings}
                    className="bg-teal-500 text-white px-6 py-2 rounded-md font-medium hover:bg-teal-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {savingReminderSettings ? 'Saving...' : 'Save settings'}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
