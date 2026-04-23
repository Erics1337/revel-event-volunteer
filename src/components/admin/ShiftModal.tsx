'use client'

import { useEffect, useState } from 'react'
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
} from '@/lib/shifts/types'
import type { ShiftEditorInput } from '@/components/admin/useShiftAdminData'

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
  const [role, setRole] = useState(initial?.role ?? availableRoles[0] ?? DEFAULT_SHIFT_ROLE)
  const [day, setDay] = useState(initial?.day ?? EVENT_DAYS[0].date)
  const [startTime, setStartTime] = useState(initial?.start_time?.slice(0, 5) ?? '09:00')
  const [endTime, setEndTime] = useState(initial?.end_time?.slice(0, 5) ?? '11:00')
  const [location, setLocation] = useState(initial?.location ?? VENUE_NAMES[0])
  const [address, setAddress] = useState(
    initial?.address ?? VENUE_ADDRESSES[(initial?.location as keyof typeof VENUE_ADDRESSES) ?? VENUE_NAMES[0]]
  )
  const [totalSlots, setTotalSlots] = useState(initial?.total_slots ?? 2)
  const [notes, setNotes] = useState(initial?.notes ?? '')
  const [saving, setSaving] = useState(false)
  const [assigningId, setAssigningId] = useState('')
  const venueNames = [
    ...venues.map((venue) => venue.name),
    ...VENUE_NAMES.filter((name) => !venues.some((venue) => venue.name === name)),
  ]

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
        total_slots: Number(totalSlots),
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

  const handleAssign = async () => {
    if (!assigningId || !onAssign) return
    try {
      await onAssign(assigningId)
      setAssigningId('')
    } catch {
      alert('Failed to assign volunteer.')
    }
  }

  const handleLocationChange = (nextLocation: string) => {
    if (nextLocation === '__add__') {
      void handleAddLocation()
      return
    }

    const previousDefault = VENUE_ADDRESSES[location as keyof typeof VENUE_ADDRESSES] ?? null
    const nextDefault =
      venues.find((venue) => venue.name === nextLocation)?.address ??
      VENUE_ADDRESSES[nextLocation as keyof typeof VENUE_ADDRESSES] ??
      null
    setLocation(nextLocation)
    setAddress((current) => (!current || current === previousDefault ? nextDefault ?? current : current))
  }

  const handleAddLocation = async () => {
    if (!onCreateVenue) return
    const name = prompt('New location name:')
    if (!name?.trim()) return
    const nextAddress = prompt('Location address:')
    if (!nextAddress?.trim()) return

    try {
      const venue = await onCreateVenue({ name: name.trim(), address: nextAddress.trim() })
      if (!venue) return
      setLocation(venue.name)
      setAddress(venue.address)
    } catch {
      alert('Failed to create location.')
    }
  }

  const handleEditLocation = async () => {
    const existingVenue = venues.find((venue) => venue.name === location)
    if (!existingVenue || !onUpdateVenue) return

    const nextName = prompt('Edit location name:', existingVenue.name)
    if (!nextName?.trim()) return
    const nextAddress = prompt('Edit location address:', existingVenue.address)
    if (!nextAddress?.trim()) return

    try {
      const venue = await onUpdateVenue(existingVenue.id, {
        name: nextName.trim(),
        address: nextAddress.trim(),
      })
      if (!venue) return
      setLocation(venue.name)
      setAddress(venue.address)
    } catch {
      alert('Failed to update location.')
    }
  }

  const assignedIds = new Set(assignments.map((a) => a.volunteer_id))
  const unassignedVolunteers = volunteers.filter((v) => !assignedIds.has(v.id))

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

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-charcoal mb-1">Role</label>
              <input
                type="text"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                list="shift-modal-role-options"
                className="w-full px-3 py-2 border border-gray-border rounded-md"
                placeholder="Shift role"
                required
              />
              <datalist id="shift-modal-role-options">
                {availableRoles.map((availableRole) => (
                  <option key={availableRole} value={availableRole} />
                ))}
              </datalist>
            </div>

            <div>
              <label className="block text-sm font-medium text-charcoal mb-1">Day</label>
              <select
                value={day}
                onChange={(e) => setDay(e.target.value)}
                className="w-full px-3 py-2 border border-gray-border rounded-md"
                required
              >
                {EVENT_DAYS.map((d) => (
                  <option key={d.date} value={d.date}>
                    {d.label}
                  </option>
                ))}
              </select>
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
              <select
                value={location}
                onChange={(e) => handleLocationChange(e.target.value)}
                className="w-full px-3 py-2 border border-gray-border rounded-md"
                required
              >
                {venueNames.map((venue) => (
                  <option key={venue} value={venue}>
                    {venue}
                  </option>
                ))}
                <option value="__add__">+ Add location…</option>
              </select>
              {venues.some((venue) => venue.name === location) ? (
                <button
                  type="button"
                  onClick={() => void handleEditLocation()}
                  className="mt-2 text-xs font-medium text-teal hover:underline"
                >
                  Edit location
                </button>
              ) : null}
            </div>

            <div>
              <label className="block text-sm font-medium text-charcoal mb-1">Address</label>
              <input
                type="text"
                value={address ?? ''}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full px-3 py-2 border border-gray-border rounded-md"
                placeholder="Venue address"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-charcoal mb-1">
                Total slots
              </label>
              <input
                type="number"
                min={1}
                value={totalSlots}
                onChange={(e) => setTotalSlots(Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-border rounded-md"
                required
              />
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
                          onClick={() => onUnassign(a.volunteer!.id)}
                          className="text-xs text-red-600 hover:text-red-700 ml-2 shrink-0"
                        >
                          Remove
                        </button>
                      )}
                    </li>
                  ))}
                </ul>
              )}

              {onAssign && unassignedVolunteers.length > 0 && (
                <div className="flex gap-2">
                  <select
                    value={assigningId}
                    onChange={(e) => setAssigningId(e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-border rounded-md text-sm"
                  >
                    <option value="">Select a volunteer...</option>
                    {unassignedVolunteers.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.name} ({v.email})
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={handleAssign}
                    disabled={!assigningId}
                    className="px-4 py-2 bg-teal-500 text-white rounded-md text-sm font-medium hover:bg-teal-600 disabled:opacity-50"
                  >
                    Assign
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
