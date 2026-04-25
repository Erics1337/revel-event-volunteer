'use client'

import { useDeferredValue, useEffect, useMemo, useState } from 'react'
import * as Popover from '@radix-ui/react-popover'
import { Command } from 'cmdk'
import type {
  VolunteerShift,
  ShiftAssignment,
  AvailableVolunteer,
  VenueRecord,
} from '@/lib/shifts/types'
import {
  DEFAULT_SHIFT_ROLE,
  EVENT_DAYS,
  VENUE_ADDRESSES,
  VENUE_NAMES,
  getPreferredShiftRole,
} from '@/lib/shifts/types'
import type { ShiftEditorInput } from '@/components/admin/useShiftAdminData'
import { LocationCombobox } from '@/components/admin/LocationCombobox'
import { RoleCombobox } from '@/components/admin/RoleCombobox'

const inputClassName =
  'w-full rounded-md border border-gray-border bg-white px-2 py-2 text-sm text-charcoal outline-none transition focus:border-teal focus:ring-2 focus:ring-teal/20 disabled:bg-gray-100 disabled:text-gray-500'

function matchesVolunteer(volunteer: AvailableVolunteer, search: string) {
  const normalizedSearch = search.trim().toLowerCase()
  if (!normalizedSearch) return true

  return [volunteer.name, volunteer.email, volunteer.phone].some((value) =>
    value.toLowerCase().includes(normalizedSearch)
  )
}

interface ShiftModalProps {
  mode: 'create' | 'edit'
  initial?: Partial<VolunteerShift>
  availableRoles?: string[]
  assignments?: ShiftAssignment[]
  volunteers?: AvailableVolunteer[]
  venues?: VenueRecord[]
  onClose: () => void
  onSave: (values: ShiftEditorInput) => Promise<void>
  onCreateVenue?: (values: { name: string; address: string }) => Promise<VenueRecord | undefined>
  onUpdateVenue?: (
    id: string,
    values: { name: string; address: string }
  ) => Promise<VenueRecord | undefined>
  onDelete?: () => Promise<void>
  onAssign?: (volunteerId: string) => Promise<void>
  onUnassign?: (volunteerId: string) => Promise<void>
}

export function ShiftModal({
  mode,
  initial,
  availableRoles = [],
  assignments = [],
  volunteers = [],
  venues = [],
  onClose,
  onSave,
  onCreateVenue,
  onUpdateVenue,
  onDelete,
  onAssign,
  onUnassign,
}: ShiftModalProps) {
  const [role, setRole] = useState(
    initial?.role ?? getPreferredShiftRole(availableRoles) ?? DEFAULT_SHIFT_ROLE
  )
  const [day, setDay] = useState(initial?.day ?? EVENT_DAYS[0].date)
  const [startTime, setStartTime] = useState(initial?.start_time?.slice(0, 5) ?? '09:00')
  const [endTime, setEndTime] = useState(initial?.end_time?.slice(0, 5) ?? '11:00')
  const [location, setLocation] = useState(initial?.location ?? VENUE_NAMES[0])
  const [address, setAddress] = useState(
    initial?.address ??
      venues.find((v) => v.name === initial?.location)?.address ??
      VENUE_ADDRESSES[(initial?.location ?? VENUE_NAMES[0]) as keyof typeof VENUE_ADDRESSES] ??
      ''
  )
  const [notes, setNotes] = useState(initial?.notes ?? '')
  const [urgent, setUrgent] = useState(Boolean(initial?.urgent))
  const [saving, setSaving] = useState(false)
  const [pickerOpen, setPickerOpen] = useState(false)
  const [volunteerSearch, setVolunteerSearch] = useState('')
  const [assignmentBusyId, setAssignmentBusyId] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const deferredVolunteerQuery = useDeferredValue(volunteerSearch)

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleEsc)
    return () => window.removeEventListener('keydown', handleEsc)
  }, [onClose])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      await onSave({
        role,
        day,
        start_time: startTime,
        end_time: endTime,
        location,
        address,
        total_slots: 1,
        urgent,
        notes,
      })
      onClose()
    } catch (err) {
      console.error(err)
      alert('Failed to save shift.')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!onDelete) return
    if (!confirm('Delete this shift? This will remove all assignments.')) return
    setSaving(true)
    try {
      await onDelete()
      onClose()
    } catch {
      alert('Failed to delete shift.')
    } finally {
      setSaving(false)
    }
  }

  const handleAssign = async (volunteerId: string) => {
    if (!volunteerId || !onAssign) return
    setAssignmentBusyId(volunteerId)
    setMessage(null)
    try {
      await onAssign(volunteerId)
      setVolunteerSearch('')
      setPickerOpen(false)
      setMessage('Assigned volunteer to shift.')
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Failed to assign volunteer')
    } finally {
      setAssignmentBusyId(null)
    }
  }

  const assignedIds = new Set(assignments.map((a) => a.volunteer_id))
  const unassignedVolunteers = volunteers.filter((v) => !assignedIds.has(v.id))
  const filteredVolunteers = useMemo(
    () =>
      unassignedVolunteers
        .filter((volunteer) => {
          if (volunteer.status !== 'confirmed') return false
          return matchesVolunteer(volunteer, deferredVolunteerQuery)
        })
        .sort((left, right) => {
          const leftAvailable = left.availability.includes(day) ? 1 : 0
          const rightAvailable = right.availability.includes(day) ? 1 : 0
          if (leftAvailable !== rightAvailable) return rightAvailable - leftAvailable

          return left.name.localeCompare(right.name)
        }),
    [day, deferredVolunteerQuery, unassignedVolunteers]
  )

  const noopCreateVenue = async () => undefined as VenueRecord | undefined
  const noopUpdateVenue = async () => undefined as VenueRecord | undefined

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-charcoal">
              {mode === 'create' ? 'Create Shift' : 'Edit Shift'}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-text hover:text-charcoal text-2xl leading-none"
              aria-label="Close"
            >
              ×
            </button>
          </div>

          {message ? (
            <div className="mb-4 rounded-md border border-gray-border bg-gray-50 px-3 py-2 text-sm text-charcoal">
              {message}
            </div>
          ) : null}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-charcoal mb-1">Role</label>
              <RoleCombobox
                currentRole={role}
                availableRoles={availableRoles}
                onSelectRole={setRole}
                className="w-full px-3 py-2 border border-gray-border rounded-md flex items-center justify-between gap-3 text-left text-sm text-charcoal bg-white hover:border-teal transition"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-charcoal mb-1">Day</label>
              <input
                type="date"
                value={day}
                onChange={(e) => setDay(e.target.value)}
                list="shift-modal-day-options"
                className="w-full px-3 py-2 border border-gray-border rounded-md"
                required
              />
              <datalist id="shift-modal-day-options">
                {EVENT_DAYS.map((d) => (
                  <option key={d.date} value={d.date}>
                    {d.label}
                  </option>
                ))}
              </datalist>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-charcoal mb-1">Start</label>
                <input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-border rounded-md"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-charcoal mb-1">End</label>
                <input
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-border rounded-md"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-charcoal mb-1">Location</label>
              <LocationCombobox
                currentLocation={location}
                address={address}
                venues={venues}
                onCreateVenue={onCreateVenue ?? noopCreateVenue}
                onUpdateVenue={onUpdateVenue ?? noopUpdateVenue}
                onSelectLocation={({ location: loc, address: addr }) => {
                  setLocation(loc)
                  setAddress(addr)
                }}
                onMessage={setMessage}
                className="w-full px-3 py-2 border border-gray-border rounded-md flex items-center justify-between gap-3 text-left text-sm text-charcoal bg-white hover:border-teal transition"
              />
              {address && (
                <p className="mt-1 text-xs text-gray-text truncate">{address}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-charcoal mb-1">Notes</label>
              <textarea
                value={notes ?? ''}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-3 py-2 border border-gray-border rounded-md"
                rows={3}
                placeholder="Optional shift notes"
              />
            </div>

            <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-orange-200 bg-orange-50/70 p-3">
              <input
                type="checkbox"
                checked={urgent}
                onChange={(event) => setUrgent(event.target.checked)}
                className="mt-1 h-4 w-4 rounded border-orange-300 text-orange-500 focus:ring-orange-500"
              />
              <span>
                <span className="block text-sm font-semibold text-charcoal">Mark as urgent</span>
                <span className="mt-1 block text-xs leading-5 text-gray-text">
                  Urgent shifts get a special callout on the volunteer open shifts page.
                </span>
              </span>
            </label>

            <div className="flex items-center justify-between pt-2">
              {mode === 'edit' && onDelete ? (
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={saving}
                  className="text-red-600 hover:text-red-700 text-sm font-medium disabled:opacity-50"
                >
                  Delete shift
                </button>
              ) : (
                <span />
              )}
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 border border-gray-border rounded-md text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 bg-teal-500 text-white rounded-md text-sm font-medium hover:bg-teal-600 disabled:opacity-50"
                >
                  {saving ? 'Saving...' : mode === 'create' ? 'Create' : 'Save'}
                </button>
              </div>
            </div>
          </form>

          {mode === 'edit' && (
            <div className="mt-6 pt-6 border-t border-gray-border">
              <h3 className="text-sm font-semibold text-charcoal mb-3">
                Assigned Volunteers ({assignments.length})
              </h3>
              {assignments.length === 0 ? (
                <p className="text-sm text-gray-text italic">None assigned yet.</p>
              ) : (
                <ul className="space-y-2 mb-3">
                  {assignments.map((a) => (
                    <li
                      key={a.id}
                      className="flex items-center justify-between bg-gray-50 px-3 py-2 rounded-md"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-charcoal truncate">
                          {a.volunteer?.name ?? 'Unknown'}
                        </p>
                        <p className="text-xs text-gray-text truncate">
                          {a.volunteer?.email}
                        </p>
                      </div>
                      {onUnassign && a.volunteer && (
                        <button
                          onClick={async () => {
                            try {
                              setMessage(null)
                              await onUnassign(a.volunteer!.id)
                              setMessage(`Removed ${a.volunteer!.name} from shift.`)
                            } catch (error) {
                              setMessage(error instanceof Error ? error.message : 'Failed to remove volunteer')
                            }
                          }}
                          className="text-xs text-red-600 hover:text-red-700 ml-2 shrink-0"
                        >
                          Remove
                        </button>
                      )}
                    </li>
                  ))}
                </ul>
              )}

              {onAssign ? (
                filteredVolunteers.length > 0 || unassignedVolunteers.length > 0 ? (
                  <div className="space-y-2">
                    <Popover.Root open={pickerOpen} onOpenChange={setPickerOpen}>
                      <Popover.Anchor asChild>
                        <div className="relative">
                          <input
                            type="text"
                            value={volunteerSearch}
                            onFocus={() => setPickerOpen(true)}
                            onChange={(event) => {
                              setVolunteerSearch(event.target.value)
                              setPickerOpen(true)
                            }}
                            className={`${inputClassName} pr-20`}
                            placeholder="Search volunteers to assign"
                          />
                          <button
                            type="button"
                            onClick={() => setPickerOpen((current) => !current)}
                            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full border border-gray-border px-2 py-1 text-[11px] font-medium text-teal"
                          >
                            Search
                          </button>
                        </div>
                      </Popover.Anchor>
                      <Popover.Portal>
                        <Popover.Content
                          sideOffset={8}
                          align="start"
                          onOpenAutoFocus={(event) => event.preventDefault()}
                          className="z-50 w-[360px] rounded-xl border border-gray-border bg-white p-3 shadow-xl"
                        >
                          <div className="mb-2">
                            <div className="text-xs font-medium uppercase tracking-wide text-gray-text">
                              Volunteer Picker
                            </div>
                            <p className="text-sm text-gray-text">
                              Search and assign a volunteer to this shift.
                            </p>
                          </div>
                          <Command className="w-full">
                            <Command.List className="max-h-64 overflow-y-auto rounded-lg border border-gray-border p-1">
                              <Command.Empty className="px-3 py-4 text-sm text-gray-text">
                                No matching volunteers for this shift.
                              </Command.Empty>
                              {filteredVolunteers.map((volunteer) => (
                                <Command.Item
                                  key={volunteer.id}
                                  value={`${volunteer.name} ${volunteer.email} ${volunteer.phone}`}
                                  onSelect={() => void handleAssign(volunteer.id)}
                                  className="cursor-pointer rounded-md px-3 py-2 data-[selected=true]:bg-teal-50"
                                >
                                  <div className="min-w-0">
                                    <div className="flex items-center gap-2 truncate font-medium text-charcoal">
                                      <span className="truncate">{volunteer.name}</span>
                                      {volunteer.availability.includes(day) ? (
                                        <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-700">
                                          Available
                                        </span>
                                      ) : (
                                        <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-700">
                                          Outside availability
                                        </span>
                                      )}
                                    </div>
                                    <div className="truncate text-xs text-gray-text">
                                      {volunteer.email} · {volunteer.phone}
                                    </div>
                                  </div>
                                </Command.Item>
                              ))}
                            </Command.List>
                          </Command>
                        </Popover.Content>
                      </Popover.Portal>
                    </Popover.Root>
                    {assignmentBusyId ? (
                      <p className="text-xs text-gray-text">Assigning volunteer…</p>
                    ) : null}
                  </div>
                ) : (
                  <p className="text-sm text-gray-text italic">All confirmed volunteers are already assigned.</p>
                )
              ) : null}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
