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
import { AdminCoverageCalendar } from '@/components/admin/AdminCoverageCalendar'
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

interface SendMessageResponse {
  error?: string
}

export default function AdminVolunteersPage() {
  const { user, profile, loading: authLoading } = useAuth()
  const [activeTab, setActiveTab] = useState('volunteers')
  const [coverageView, setCoverageView] = useState<'list' | 'calendar'>('calendar')
  const [volunteers, setVolunteers] = useState<AvailableVolunteer[]>([])
  const [shifts, setShifts] = useState<VolunteerShift[]>([])
  const [assignments, setAssignments] = useState<ShiftAssignment[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [coveredShiftSearch, setCoveredShiftSearch] = useState('')
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
  const [sendingShiftReminderId, setSendingShiftReminderId] = useState<string | null>(null)
  const [coverageDay, setCoverageDay] = useState<string>(EVENT_DAYS[0]?.date ?? '')
  const [scheduledMessageDay, setScheduledMessageDay] = useState<string>(EVENT_DAYS[0]?.date ?? '')
  const [scheduledMessageSubject, setScheduledMessageSubject] = useState('')
  const [scheduledMessageBody, setScheduledMessageBody] = useState('')
  const [sendingScheduledMessage, setSendingScheduledMessage] = useState(false)
  const [scheduledMessageNotice, setScheduledMessageNotice] = useState<string | null>(null)

  const openReminderModal = useCallback((day?: string) => {
    setReminderResult(null)
    setScheduledMessageNotice(null)
    if (day) {
      setScheduledMessageDay(day)
    }
    setReminderModal(true)
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

  const shiftById = useMemo(
    () => new Map(shifts.map((shift) => [shift.id, shift])),
    [shifts]
  )

  const openShifts = useMemo(
    () => shifts.filter((shift) => shift.filled_slots < shift.total_slots),
    [shifts]
  )

  const coveredShifts = useMemo(
    () => shifts.filter((shift) => shift.filled_slots >= shift.total_slots),
    [shifts]
  )

  const totalFilledSlots = useMemo(
    () => shifts.reduce((acc, shift) => acc + shift.filled_slots, 0),
    [shifts]
  )

  const totalShiftSlots = useMemo(
    () => shifts.reduce((acc, shift) => acc + shift.total_slots, 0),
    [shifts]
  )

  const totalOpenSlots = Math.max(0, totalShiftSlots - totalFilledSlots)

  const fillRate = useMemo(() => {
    if (totalShiftSlots === 0) return 0

    return Math.round((totalFilledSlots / totalShiftSlots) * 100)
  }, [totalFilledSlots, totalShiftSlots])

  const getAssigned = useCallback(
    (shift: VolunteerShift) =>
      assignments
        .filter((assignment) => assignment.shift_id === shift.id)
        .map((assignment) => volunteerById.get(assignment.volunteer_id))
        .filter((volunteer): volunteer is AvailableVolunteer => Boolean(volunteer)),
    [assignments, volunteerById]
  )

  const hasOverlappingAssignment = useCallback(
    (shift: VolunteerShift, volunteerId: string) =>
      assignments.some((assignment) => {
        if (assignment.volunteer_id !== volunteerId) return false
        if (assignment.status === 'cancelled') return false
        if (assignment.shift_id === shift.id) return false

        const assignedShift = shiftById.get(assignment.shift_id)
        if (!assignedShift || assignedShift.day !== shift.day) return false

        return (
          shift.start_time < assignedShift.end_time &&
          assignedShift.start_time < shift.end_time
        )
      }),
    [assignments, shiftById]
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
          !volunteer.blocked &&
          !assignedIds.has(volunteer.id) &&
          !hasOverlappingAssignment(shift, volunteer.id)
      )
    },
    [assignments, hasOverlappingAssignment, volunteers]
  )

  const getAutoAssignable = useCallback(
    (shift: VolunteerShift) =>
      [...getEligible(shift)].sort((left, right) => {
        if (left.shift_count !== right.shift_count) {
          return left.shift_count - right.shift_count
        }

        return left.name.localeCompare(right.name)
      }),
    [getEligible]
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

  const handleAutoAssignVolunteer = async (shift: VolunteerShift) => {
    const candidate = getAutoAssignable(shift)[0]

    if (!candidate) {
      const message =
        'No eligible volunteers are available who match this day and do not overlap another shift.'
      setErrorMessage(message)
      window.alert(message)
      return
    }

    await handleAssignVolunteer(shift.id, candidate.id)
  }

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

  const handleSendShiftReminder = async (shift: VolunteerShift) => {
    const assignedCount = getAssigned(shift).length
    if (assignedCount === 0) {
      window.alert('No assigned volunteers are available for this shift reminder.')
      return
    }

    const confirmed = window.confirm(
      `Send the 24-hour reminder email now for "${shift.role}" at ${shift.location}?`
    )

    if (!confirmed) return

    setSendingShiftReminderId(shift.id)
    setErrorMessage(null)

    try {
      const response = await fetch('/api/admin/notifications/reminders/manual', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ shiftIds: [shift.id] }),
      })

      const payload = await response.json().catch(() => ({}))

      if (!response.ok) {
        throw new Error(payload.error || 'Failed to send shift reminder')
      }

      window.alert(
        `Reminder run complete: ${payload.sent || 0} sent, ${payload.failed || 0} failed, ${payload.skipped || 0} skipped.`
      )
      await refresh()
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to send shift reminder'
      setErrorMessage(message)
      window.alert(message)
    } finally {
      setSendingShiftReminderId(null)
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

  const allShiftRoles = [...new Set(coveredShifts.map((shift) => shift.role))].sort()
  const allShiftLocations = [...new Set(coveredShifts.map((shift) => shift.location))].sort()
  const coverageDays = Array.from(new Set(openShifts.map((shift) => shift.day))).sort((a, b) =>
    a.localeCompare(b)
  )
  const activeCoverageDay = coverageDays.includes(coverageDay)
    ? coverageDay
    : coverageDays[0] ?? ''

  const coveredShiftQuery = coveredShiftSearch.trim().toLowerCase()

  const filteredShifts = coveredShifts.filter((shift) => {
    if (shiftFilters.days.length > 0 && !shiftFilters.days.includes(shift.day)) return false
    if (shiftFilters.roles.length > 0 && !shiftFilters.roles.includes(shift.role)) return false
    if (
      shiftFilters.locations.length > 0 &&
      !shiftFilters.locations.includes(shift.location)
    ) {
      return false
    }

    if (coveredShiftQuery) {
      const day = EVENT_DAYS.find((item) => item.date === shift.day)
      const assigned = getAssigned(shift)
      const searchableText = [
        shift.role,
        shift.location,
        shift.day,
        day?.label,
        shift.start_time,
        shift.end_time,
        ...assigned.flatMap((volunteer) => [volunteer.name, volunteer.email, volunteer.phone]),
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()

      if (!searchableText.includes(coveredShiftQuery)) return false
    }

    return true
  })

  const hasShiftFilters =
    shiftFilters.days.length > 0 ||
    shiftFilters.roles.length > 0 ||
    shiftFilters.locations.length > 0
  const hasCoveredShiftSearch = coveredShiftQuery.length > 0
  const hasCoveredShiftFilters = hasShiftFilters || hasCoveredShiftSearch

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

        <div className="card mb-6 flex flex-col gap-5">
          {/* Top row: overall fill rate + volunteer counts */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
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
                    className={`h-2 rounded-full transition-all ${
                      fillRate >= 80 ? 'bg-success' : fillRate >= 60 ? 'bg-orange' : 'bg-error'
                    }`}
                    style={{ width: `${fillRate}%` }}
                  />
                </div>
              </div>
            </div>
            <div className="flex gap-6 text-sm shrink-0">
              <div className="text-center">
                <p className="text-2xl font-bold font-accent text-charcoal">{confirmedVolunteers.length}</p>
                <p className="text-gray-text">Volunteers signed up</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold font-accent text-teal">
                  {totalFilledSlots}
                </p>
                <p className="text-gray-text">Filled slots</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold font-accent text-orange">{totalOpenSlots}</p>
                <p className="text-gray-text">Open slots</p>
              </div>
            </div>
          </div>

          {/* Per-day coverage breakdown */}
          <div className="border-t border-gray-border pt-4">
            <p className="text-xs font-medium text-gray-text uppercase tracking-wide mb-3">
              Open slots by day
            </p>
            <div className="grid grid-cols-5 gap-2">
              {EVENT_DAYS.map((day) => {
                const dayShifts = shifts.filter((shift) => shift.day === day.date)
                const dayTotal = dayShifts.reduce((acc, shift) => acc + shift.total_slots, 0)
                const dayFilled = dayShifts.reduce((acc, shift) => acc + shift.filled_slots, 0)
                const dayOpen = Math.max(0, dayTotal - dayFilled)
                const dayPct = dayTotal > 0 ? Math.round((dayFilled / dayTotal) * 100) : 0
                const isCovered = dayOpen === 0

                const [dayName, dateStr] = day.label.split(', ')

                return (
                  <div
                    key={day.date}
                    className={`rounded-lg p-3 border flex flex-col gap-2 ${
                      isCovered
                        ? 'border-success/25 bg-success/5'
                        : dayPct >= 60
                          ? 'border-orange/30 bg-orange-light'
                          : 'border-error/25 bg-red-50'
                    }`}
                  >
                    <div>
                      <p className="text-xs font-semibold text-charcoal">{dayName}</p>
                      <p className="text-xs text-gray-mid">{dateStr}</p>
                    </div>

                    <div className="flex items-end gap-1">
                      <span
                        className={`text-2xl font-bold font-accent leading-none ${
                          isCovered ? 'text-success' : dayPct >= 60 ? 'text-orange' : 'text-error'
                        }`}
                      >
                        {isCovered ? '✓' : dayOpen}
                      </span>
                      <span className="text-xs text-gray-text pb-0.5">
                        {isCovered ? 'covered' : 'open'}
                      </span>
                    </div>

                    <div>
                      <div className="bg-white/60 rounded-full h-1.5 overflow-hidden">
                        <div
                          className={`h-1.5 rounded-full transition-all ${
                            isCovered ? 'bg-success' : dayPct >= 60 ? 'bg-orange' : 'bg-error'
                          }`}
                          style={{ width: `${dayPct}%` }}
                        />
                      </div>
                      <p className="text-xs text-gray-mid mt-1">{dayPct}% filled</p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        <div className="flex gap-1 border-b border-gray-border mb-6">
          {[
            { id: 'volunteers', label: `Volunteers (${confirmedVolunteers.length})` },
            { id: 'coverage', label: 'Needs Coverage' },
            { id: 'shifts', label: `Covered Shifts (${coveredShifts.length})` },
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
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm text-gray-text">
                These are the shifts that still have open slots. Use list view for quick triage or
                calendar view to assign directly against the schedule.
              </p>
              <div className="inline-flex rounded-full border border-gray-border bg-white p-1">
                {(['calendar', 'list'] as const).map((view) => (
                  <button
                    key={view}
                    type="button"
                    onClick={() => setCoverageView(view)}
                    className={`rounded-full px-3 py-1.5 text-sm font-medium transition ${
                      coverageView === view
                        ? 'bg-teal-500 text-white'
                        : 'text-gray-text hover:text-teal'
                    }`}
                  >
                    {view === 'calendar' ? 'Calendar' : 'List'}
                  </button>
                ))}
              </div>
            </div>



            {openShifts.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-success text-lg font-semibold">All shifts covered.</p>
                <p className="text-gray-text text-sm mt-1">Nice work.</p>
              </div>
            ) : (
              <>
                <p className="mb-4 text-sm text-gray-text">
                  {openShifts.length} shift{openShifts.length !== 1 ? 's' : ''} still need
                  volunteers
                </p>

                {coverageView === 'calendar' ? (
                  <AdminCoverageCalendar
                    shifts={openShifts}
                    activeDay={activeCoverageDay}
                    availableDays={coverageDays}
                    onActiveDayChange={setCoverageDay}
                    onSelectShift={setManageShiftId}
                  />
                ) : null}

                {coverageView === 'list' ? (
                  <div className="flex flex-col gap-3">
                    {openShifts.map((shift) => {
                      const open = shift.total_slots - shift.filled_slots
                      const pct = Math.round((shift.filled_slots / shift.total_slots) * 100)
                      const day = EVENT_DAYS.find((item) => item.date === shift.day)
                      const autoAssignable = getAutoAssignable(shift)

                      return (
                        <div
                          key={shift.id}
                          className="card flex flex-col sm:flex-row sm:items-center gap-4"
                        >
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                              <span className="badge-featured text-xs">{shift.role}</span>
                              <span className="text-xs text-gray-text">
                                {day?.label || shift.day}
                              </span>
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
                            <p className="mt-2 text-xs text-gray-text">
                              {autoAssignable.length} volunteer
                              {autoAssignable.length === 1 ? '' : 's'} ready to auto-assign
                            </p>
                          </div>
                          <div className="flex gap-2 shrink-0">
                            <button
                              onClick={() => void handleAutoAssignVolunteer(shift)}
                              className="btn-secondary text-sm py-2 px-4"
                            >
                              Auto-assign
                            </button>
                            <button
                              onClick={() => setManageShiftId(shift.id)}
                              className="btn-secondary text-sm py-2 px-4 shrink-0"
                            >
                              Manage
                            </button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                ) : null}
              </>
            )}
          </div>
        )}

        {activeTab === 'volunteers' && (
          <div>
            <div className="relative mb-4">
              <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-mid" />
              <input
                className="input input-icon"
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
          <div className="flex flex-col gap-5">
            <div className="rounded-md border border-gray-border bg-white">
              <div className="border-b border-gray-border p-4">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                  <div className="relative flex-1">
                    <SearchIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-mid" />
                    <input
                      className="input input-icon text-sm"
                      placeholder="Search covered shifts by volunteer, role, location, or time..."
                      value={coveredShiftSearch}
                      onChange={(event) => setCoveredShiftSearch(event.target.value)}
                    />
                  </div>
                  {hasCoveredShiftFilters && (
                    <button
                      type="button"
                      onClick={() => {
                        setCoveredShiftSearch('')
                        setShiftFilters({ days: [], locations: [], roles: [] })
                      }}
                      className="text-sm font-medium text-gray-text underline underline-offset-2 transition-colors hover:text-teal"
                    >
                      Reset view
                    </button>
                  )}
                </div>
              </div>

              <div className="p-4">
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
                  onClearDayFilters={() =>
                    setShiftFilters((current) => ({ ...current, days: [] }))
                  }
                  onClearLocationFilters={() =>
                    setShiftFilters((current) => ({ ...current, locations: [] }))
                  }
                  onClearRoleFilters={() =>
                    setShiftFilters((current) => ({ ...current, roles: [] }))
                  }
                  onClearAllFilters={() =>
                    setShiftFilters({ days: [], locations: [], roles: [] })
                  }
                />
              </div>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-medium text-charcoal">
                  Showing {filteredShifts.length} of {coveredShifts.length} covered shift
                  {coveredShifts.length === 1 ? '' : 's'}
                </p>
                {hasCoveredShiftFilters && (
                  <p className="text-xs text-gray-text">
                    Narrowed by search or filters. Reset the view to see every covered shift.
                  </p>
                )}
              </div>
            </div>

            <div className="flex flex-col gap-3">
              {filteredShifts.map((shift) => {
                const open = shift.total_slots - shift.filled_slots
                const pct = Math.round((shift.filled_slots / shift.total_slots) * 100)
                const day = EVENT_DAYS.find((item) => item.date === shift.day)
                const assigned = getAssigned(shift)

                return (
                  <div
                    key={shift.id}
                    className="rounded-md border border-success/20 bg-white p-4 shadow-card transition-shadow hover:shadow-md"
                  >
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                      <div className="min-w-0 flex-1">
                        <div className="mb-2 flex flex-wrap items-center gap-2">
                          <span className="inline-flex items-center gap-1 rounded-full bg-success/10 px-2.5 py-1 text-xs font-semibold text-success">
                            <CheckIcon className="h-3.5 w-3.5" />
                            Full
                          </span>
                          <span className="badge-default text-xs">{shift.role}</span>
                          <span className="text-xs font-medium text-gray-text">
                            {day?.label || shift.day} · {shift.start_time}-{shift.end_time}
                          </span>
                        </div>
                        <p className="truncate text-base font-semibold text-charcoal">
                          {shift.location}
                        </p>
                        <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-gray-text">
                          <span className="font-semibold text-success">
                            {shift.filled_slots}/{shift.total_slots} filled
                          </span>
                          <span aria-hidden="true">·</span>
                          <span>
                            {assigned.length} assigned volunteer
                            {assigned.length === 1 ? '' : 's'}
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-col gap-3 lg:w-[420px]">
                        <div className="flex flex-wrap gap-2">
                          {assigned.slice(0, 4).map((volunteer) => (
                            <button
                              key={volunteer.id}
                              type="button"
                              onClick={() =>
                                setMessageModal({ kind: 'volunteer', volunteerId: volunteer.id })
                              }
                              className="rounded-full border border-gray-border bg-gray-light px-3 py-1 text-xs font-medium text-charcoal transition-colors hover:border-teal-500 hover:text-teal"
                              title={`Message ${volunteer.email}`}
                            >
                              {volunteer.name}
                            </button>
                          ))}
                          {assigned.length > 4 && (
                            <span className="rounded-full border border-gray-border px-3 py-1 text-xs font-medium text-gray-text">
                              +{assigned.length - 4} more
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="h-2 flex-1 overflow-hidden rounded-full bg-gray-border">
                            <div
                              className="h-2 rounded-full bg-success"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                          <span className="w-14 text-right text-xs font-semibold text-success">
                            {pct}%
                          </span>
                        </div>
                      </div>

                      <div className="flex shrink-0 gap-2">
                        <button
                          type="button"
                          onClick={() => void handleSendShiftReminder(shift)}
                          disabled={sendingShiftReminderId === shift.id}
                          className="rounded-sm border border-gray-border px-3 py-2 text-sm font-medium text-charcoal transition-colors hover:bg-gray-light disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {sendingShiftReminderId === shift.id ? 'Sending...' : 'Remind'}
                        </button>
                        <button
                          type="button"
                          onClick={() => setManageShiftId(shift.id)}
                          className="rounded-sm bg-charcoal px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-black"
                        >
                          Manage
                        </button>
                      </div>
                    </div>

                    {open > 0 && (
                      <p className="mt-3 rounded-sm bg-orange-light px-3 py-2 text-xs font-medium text-orange-dark">
                        This shift is no longer full and will move back to Needs Coverage after
                        refresh.
                      </p>
                    )}
                  </div>
                )
              })}
              {filteredShifts.length === 0 && (
                <div className="rounded-md border border-dashed border-gray-border bg-white py-12 text-center">
                  <p className="font-accent text-lg font-semibold text-charcoal">
                    {coveredShifts.length === 0
                      ? 'No covered shifts yet'
                      : 'No covered shifts match this view'}
                  </p>
                  <p className="mt-1 text-sm text-gray-text">
                    {coveredShifts.length === 0
                      ? 'Covered shifts will appear here as soon as every slot is filled.'
                      : 'Try a broader search or reset the filters to bring the list back.'}
                  </p>
                  {hasCoveredShiftFilters && (
                    <button
                      type="button"
                      onClick={() => {
                        setCoveredShiftSearch('')
                        setShiftFilters({ days: [], locations: [], roles: [] })
                      }}
                      className="mt-4 rounded-sm border border-teal-500 px-4 py-2 text-sm font-medium text-teal transition-colors hover:bg-teal-50"
                    >
                      Reset view
                    </button>
                  )}
                </div>
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
                <div className="mb-3 flex flex-wrap items-center justify-between gap-3 rounded-md border border-[#dbe7e8] bg-[#f8fbfb] px-3 py-2">
                  <p className="text-xs text-gray-text">
                    Auto-assign chooses the confirmed, unblocked volunteer with matching
                    availability, no overlap conflict, and the lowest current shift count.
                  </p>
                  <button
                    type="button"
                    onClick={() => void handleAutoAssignVolunteer(manageShift)}
                    className="rounded-full bg-[#6aa9ae] px-4 py-1.5 text-xs font-semibold text-white transition hover:bg-[#5a9a9f]"
                  >
                    Auto-assign next
                  </button>
                </div>
                {getEligible(manageShift).length === 0 ? (
                  <p className="text-sm text-gray-text italic">
                    No confirmed volunteers are available for this day without a conflict.
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
                  onClick={() => void handleSendShiftReminder(manageShift)}
                  disabled={sendingShiftReminderId === manageShift.id}
                  className="text-sm font-medium text-charcoal border border-gray-border px-4 py-2.5 rounded-sm hover:bg-gray-light transition-colors disabled:opacity-60 disabled:cursor-not-allowed mr-3"
                >
                  {sendingShiftReminderId === manageShift.id
                    ? 'Sending reminder...'
                    : 'Send 24-hour reminder now'}
                </button>
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
        submitLabel="Send Message"
        successTitle="Message sent!"
        successMessage="Volunteers will receive the message shortly."
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
                  {reminderResult.queued === 0 && (
                    <p className="text-sm text-gray-text mt-2">
                      Nothing is due right now. Reminder checks only queue emails for confirmed
                      volunteers whose shifts are within the active lead-time windows.
                    </p>
                  )}
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
                    {reminderPreview.counts.reminder_24h.queued === 0 &&
                      reminderPreview.counts.reminder_1h.queued === 0 && (
                        <>
                          <br />
                          No reminders are currently due for confirmed volunteers in the active
                          send window.
                        </>
                      )}
                  </>
                )}
              </div>

              <div className="rounded-md border border-gray-border p-4">
                <div className="mb-3">
                  <p className="text-sm font-medium text-charcoal">Start-of-day message</p>
                  <p className="text-xs text-gray-text">
                    Queue a day-specific volunteer email now and have it send automatically at the
                    start of that day in America/Denver.
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
                    <label className="text-xs uppercase tracking-wide text-gray-text">Subject</label>
                    <input
                      type="text"
                      value={scheduledMessageSubject}
                      onChange={(event) => setScheduledMessageSubject(event.target.value)}
                      className="input mt-1"
                      placeholder="Enter scheduled message subject"
                    />
                  </div>

                  <div>
                    <label className="text-xs uppercase tracking-wide text-gray-text">Message</label>
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
                    volunteer{getVolunteerIdsForDay(scheduledMessageDay).length === 1 ? '' : 's'} currently scheduled that day.
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
                      {sendingScheduledMessage ? 'Scheduling...' : 'Schedule for Start of Day'}
                    </button>
                  </div>
                </div>
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
