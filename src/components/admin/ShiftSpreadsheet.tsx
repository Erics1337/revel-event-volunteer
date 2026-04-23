'use client'

import {
  memo,
  useCallback,
  useDeferredValue,
  useMemo,
  useRef,
  useState,
} from 'react'
import * as Popover from '@radix-ui/react-popover'
import { Command } from 'cmdk'
import {
  DEFAULT_SHIFT_ROLE,
  EVENT_DAYS,
  VENUE_ADDRESSES,
  VENUE_NAMES,
  type AvailableVolunteer,
  type ShiftAssignment,
  type VenueRecord,
  type VolunteerShift,
} from '@/lib/shifts/types'
import { sanitizeShiftInput, shiftsToCsv, shiftsToTabularData, sortShifts } from '@/lib/shifts/admin'
import type { ShiftEditorInput } from '@/components/admin/useShiftAdminData'

interface SpreadsheetRow extends ShiftEditorInput {
  draftKey?: string
}

interface VolunteerDraft {
  name: string
  phone: string
  email: string
}

interface ShiftSpreadsheetProps {
  shifts: VolunteerShift[]
  availableRoles: string[]
  assignments: ShiftAssignment[]
  volunteers: AvailableVolunteer[]
  venues: VenueRecord[]
  onSave: (shifts: ShiftEditorInput[], deletedShiftIds: string[]) => Promise<void>
  onImportFile: (file: File) => Promise<number | undefined>
  onCreateVenue: (values: { name: string; address: string }) => Promise<VenueRecord | undefined>
  onUpdateVenue: (
    id: string,
    values: { name: string; address: string }
  ) => Promise<VenueRecord | undefined>
  onAssignVolunteer: (shiftId: string, volunteerId: string) => Promise<void>
  onUnassignVolunteer: (shiftId: string, volunteerId: string) => Promise<void>
}

interface LocationComboboxProps {
  address: string
  currentLocation: string
  onCreateVenue: (values: { name: string; address: string }) => Promise<VenueRecord | undefined>
  onMessage: (message: string | null) => void
  onSelectLocation: (values: { location: string; address: string }) => void
  onUpdateVenue: (
    id: string,
    values: { name: string; address: string }
  ) => Promise<VenueRecord | undefined>
  venues: VenueRecord[]
}

interface SpreadsheetTableRowProps {
  assignments: ShiftAssignment[]
  onAssignVolunteer: (shiftId: string, volunteerId: string) => Promise<void>
  onCreateVenue: (values: { name: string; address: string }) => Promise<VenueRecord | undefined>
  onDelete: () => void
  onDuplicate: () => void
  onMessage: (message: string | null) => void
  onRowChange: (key: keyof ShiftEditorInput, value: string | number) => void
  onUnassignVolunteer: (shiftId: string, volunteerId: string) => Promise<void>
  onUpdateVenue: (
    id: string,
    values: { name: string; address: string }
  ) => Promise<VenueRecord | undefined>
  row: SpreadsheetRow
  volunteers: AvailableVolunteer[]
  venues: VenueRecord[]
}

const inputClassName =
  'w-full rounded-md border border-gray-border bg-white px-2 py-2 text-sm text-charcoal outline-none transition focus:border-teal focus:ring-2 focus:ring-teal/20 disabled:bg-gray-100 disabled:text-gray-500'

function createDraftKey() {
  return `draft-${crypto.randomUUID()}`
}

function normalizePhone(value: string): string {
  return value.replace(/\D/g, '')
}

function toEditableShift(shift: VolunteerShift): SpreadsheetRow {
  return {
    id: shift.id,
    role: shift.role,
    day: shift.day,
    start_time: shift.start_time.slice(0, 5),
    end_time: shift.end_time.slice(0, 5),
    location: shift.location,
    address: shift.address ?? VENUE_ADDRESSES[shift.location as keyof typeof VENUE_ADDRESSES] ?? '',
    total_slots: shift.total_slots,
    notes: shift.notes ?? '',
  }
}

function toComparableRows(rows: SpreadsheetRow[]) {
  return rows.map((row) => {
    const next = { ...row }
    delete next.draftKey
    return next
  })
}

function sameShifts(left: SpreadsheetRow[], right: SpreadsheetRow[]): boolean {
  return JSON.stringify(toComparableRows(left)) === JSON.stringify(toComparableRows(right))
}

function getDefaultAddress(location: string, venues: VenueRecord[]) {
  return (
    venues.find((venue) => venue.name === location)?.address ??
    VENUE_ADDRESSES[location as keyof typeof VENUE_ADDRESSES] ??
    ''
  )
}

function matchesVolunteer(volunteer: AvailableVolunteer, search: string) {
  const normalizedSearch = search.trim().toLowerCase()
  if (!normalizedSearch) return true

  return [volunteer.name, volunteer.email, volunteer.phone].some((value) =>
    value.toLowerCase().includes(normalizedSearch)
  )
}

function getShiftVolunteerDraft(assignments: ShiftAssignment[]): VolunteerDraft {
  if (assignments.length !== 1 || !assignments[0].volunteer) {
    return { name: '', phone: '', email: '' }
  }

  const volunteer = assignments[0].volunteer
  return {
    name: volunteer.name ?? '',
    phone: volunteer.phone ?? '',
    email: volunteer.email ?? '',
  }
}

function resolveVolunteer(volunteers: AvailableVolunteer[], draft: VolunteerDraft) {
  const name = draft.name.trim().toLowerCase()
  const email = draft.email.trim().toLowerCase()
  const phone = normalizePhone(draft.phone)

  return volunteers.filter((volunteer) => {
    if (volunteer.status !== 'confirmed') return false
    if (name && volunteer.name.trim().toLowerCase() !== name) return false
    if (email && volunteer.email.trim().toLowerCase() !== email) return false
    if (phone && normalizePhone(volunteer.phone) !== phone) return false
    return true
  })
}

function LocationCombobox({
  address,
  currentLocation,
  onCreateVenue,
  onMessage,
  onSelectLocation,
  onUpdateVenue,
  venues,
}: LocationComboboxProps) {
  const [open, setOpen] = useState(false)
  const [mode, setMode] = useState<'browse' | 'add' | 'edit'>('browse')
  const [search, setSearch] = useState('')
  const [saving, setSaving] = useState(false)
  const [formName, setFormName] = useState(currentLocation)
  const [formAddress, setFormAddress] = useState(address)

  const currentVenue = useMemo(
    () => venues.find((venue) => venue.name === currentLocation) ?? null,
    [currentLocation, venues]
  )

  const availableVenues = useMemo(() => {
    const seen = new Set<string>()
    return [...venues]
      .sort((left, right) => left.name.localeCompare(right.name))
      .filter((venue) => {
        if (seen.has(venue.name)) return false
        seen.add(venue.name)
        return true
      })
  }, [venues])

  const filteredVenues = useMemo(
    () =>
      availableVenues.filter((venue) => {
        const needle = search.trim().toLowerCase()
        if (!needle) return true
        return [venue.name, venue.address].some((value) => value.toLowerCase().includes(needle))
      }),
    [availableVenues, search]
  )

  const handleSaveVenue = async () => {
    if (!formName.trim() || !formAddress.trim()) {
      onMessage('Location name and address are both required.')
      return
    }

    setSaving(true)
    onMessage(null)

    try {
      const values = { name: formName.trim(), address: formAddress.trim() }
      const result =
        mode === 'edit' && currentVenue
          ? await onUpdateVenue(currentVenue.id, values)
          : await onCreateVenue(values)

      if (!result) return

      onSelectLocation({ location: result.name, address: result.address })
      onMessage(mode === 'edit' ? `Updated location ${result.name}.` : `Added location ${result.name}.`)
      setOpen(false)
    } catch (error) {
      onMessage(error instanceof Error ? error.message : 'Failed to update location')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Popover.Root
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen)

        if (!nextOpen) {
          setMode('browse')
          setSearch('')
          setFormName(currentLocation)
          setFormAddress(address)
        }
      }}
    >
      <Popover.Trigger asChild>
        <button
          type="button"
          className={`${inputClassName} flex min-w-[220px] items-center justify-between gap-3 text-left`}
        >
          <span className="truncate">{currentLocation}</span>
          <span className="text-xs font-medium uppercase tracking-wide text-teal">Edit</span>
        </button>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          sideOffset={8}
          align="start"
          className="z-50 w-[340px] rounded-xl border border-gray-border bg-white p-3 shadow-xl"
        >
          {mode === 'browse' ? (
            <Command className="w-full">
              <div className="mb-2 text-xs font-medium uppercase tracking-wide text-gray-text">
                Location Picker
              </div>
              <Command.Input
                value={search}
                onValueChange={setSearch}
                placeholder="Search locations or addresses…"
                className={`${inputClassName} mb-2`}
              />
              <Command.List className="max-h-64 overflow-y-auto rounded-lg border border-gray-border p-1">
                <Command.Empty className="px-3 py-4 text-sm text-gray-text">
                  No matching locations.
                </Command.Empty>
                {filteredVenues.map((venue) => (
                  <Command.Item
                    key={venue.id}
                    value={`${venue.name} ${venue.address}`}
                    onSelect={() => {
                      onSelectLocation({ location: venue.name, address: venue.address })
                      onMessage(null)
                      setOpen(false)
                    }}
                    className="cursor-pointer rounded-md px-3 py-2 data-[selected=true]:bg-teal-50"
                  >
                    <div className="min-w-0">
                      <div className="truncate font-medium text-charcoal">{venue.name}</div>
                      <div className="truncate text-xs text-gray-text">{venue.address}</div>
                    </div>
                  </Command.Item>
                ))}
              </Command.List>
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setMode('add')
                    setFormName(search.trim() || currentLocation)
                    setFormAddress(address)
                  }}
                  className="rounded-full border border-teal/30 bg-teal-50 px-3 py-1 text-xs font-medium text-teal"
                >
                  + Add location
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMode('edit')
                    setFormName(currentVenue?.name ?? currentLocation)
                    setFormAddress(currentVenue?.address ?? address)
                  }}
                  className="rounded-full border border-gray-border px-3 py-1 text-xs font-medium text-charcoal"
                >
                  Edit current
                </button>
              </div>
            </Command>
          ) : (
            <div className="space-y-3">
              <div>
                <div className="text-xs font-medium uppercase tracking-wide text-gray-text">
                  {mode === 'edit' ? 'Edit Location' : 'Add Location'}
                </div>
                <p className="mt-1 text-sm text-gray-text">
                  Save a venue and immediately use it in this row.
                </p>
              </div>
              <input
                type="text"
                value={formName}
                onChange={(event) => setFormName(event.target.value)}
                className={inputClassName}
                placeholder="Location name"
              />
              <textarea
                value={formAddress}
                onChange={(event) => setFormAddress(event.target.value)}
                className={`${inputClassName} min-h-[96px] resize-y`}
                placeholder="Street address"
              />
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => void handleSaveVenue()}
                  disabled={saving}
                  className="rounded-full bg-teal px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
                >
                  {saving ? 'Saving…' : mode === 'edit' ? 'Save location' : 'Add location'}
                </button>
                <button
                  type="button"
                  onClick={() => setMode('browse')}
                  className="rounded-full border border-gray-border px-4 py-2 text-sm font-medium text-charcoal"
                >
                  Back
                </button>
              </div>
            </div>
          )}
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  )
}

const SpreadsheetTableRow = memo(function SpreadsheetTableRow({
  assignments,
  onAssignVolunteer,
  onCreateVenue,
  onDelete,
  onDuplicate,
  onMessage,
  onRowChange,
  onUnassignVolunteer,
  onUpdateVenue,
  row,
  volunteers,
  venues,
}: SpreadsheetTableRowProps) {
  const [assignmentBusyKey, setAssignmentBusyKey] = useState<string | null>(null)
  const [pickerOpen, setPickerOpen] = useState(false)
  const [volunteerDraftOverride, setVolunteerDraftOverride] = useState<VolunteerDraft | null>(null)
  const volunteerDraft = volunteerDraftOverride ?? getShiftVolunteerDraft(assignments)
  const deferredVolunteerQuery = useDeferredValue(
    `${volunteerDraft.name} ${volunteerDraft.email} ${volunteerDraft.phone}`.trim()
  )

  const hasMultipleAssignments = assignments.length > 1
  const currentAssignedVolunteer = assignments[0]?.volunteer ?? null

  const filteredVolunteers = useMemo(() => {
    if (!row.id || hasMultipleAssignments) return []

    const assignedIds = new Set(assignments.map((assignment) => assignment.volunteer_id))

    return volunteers.filter((volunteer) => {
      if (volunteer.status !== 'confirmed') return false

      const isCurrent = currentAssignedVolunteer?.id === volunteer.id
      const isEligible = volunteer.availability.includes(row.day)

      if (!isCurrent && !isEligible) return false
      if (!isCurrent && assignedIds.has(volunteer.id)) return false

      return matchesVolunteer(volunteer, deferredVolunteerQuery)
    })
  }, [
    assignments,
    currentAssignedVolunteer?.id,
    deferredVolunteerQuery,
    hasMultipleAssignments,
    row.day,
    row.id,
    volunteers,
  ])

  const updateVolunteerDraft = (field: keyof VolunteerDraft, value: string) => {
    setVolunteerDraftOverride((current) => ({
      ...(current ?? volunteerDraft),
      [field]: value,
    }))
  }

  const handleSelectVolunteer = async (volunteer: AvailableVolunteer) => {
    if (!row.id) return
    if (hasMultipleAssignments) {
      onMessage('This shift has multiple assigned volunteers. Use the calendar view to edit it.')
      return
    }

    setAssignmentBusyKey(`pick:${row.id}`)
    onMessage(null)

    try {
      if (currentAssignedVolunteer?.id && currentAssignedVolunteer.id !== volunteer.id) {
        await onUnassignVolunteer(row.id, currentAssignedVolunteer.id)
      }

      if (currentAssignedVolunteer?.id !== volunteer.id) {
        await onAssignVolunteer(row.id, volunteer.id)
      }

      setVolunteerDraftOverride({
        name: volunteer.name,
        phone: volunteer.phone,
        email: volunteer.email,
      })
      setPickerOpen(false)
      onMessage('Updated shift assignments.')
    } catch (error) {
      onMessage(error instanceof Error ? error.message : 'Failed to assign volunteer')
    } finally {
      setAssignmentBusyKey(null)
    }
  }

  const handleApplyVolunteer = async () => {
    if (!row.id) return
    if (hasMultipleAssignments) {
      onMessage('This shift has multiple assigned volunteers. Use the calendar view to edit it.')
      return
    }

    const hasValues = [volunteerDraft.name, volunteerDraft.phone, volunteerDraft.email].some(
      (value) => value.trim() !== ''
    )

    setAssignmentBusyKey(`apply:${row.id}`)
    onMessage(null)

    try {
      if (!hasValues) {
        if (currentAssignedVolunteer?.id) {
          await onUnassignVolunteer(row.id, currentAssignedVolunteer.id)
          setVolunteerDraftOverride({ name: '', phone: '', email: '' })
          onMessage('Removed volunteer from shift.')
        }
        return
      }

      const matches = resolveVolunteer(volunteers, volunteerDraft)
      if (matches.length === 0) {
        throw new Error('No confirmed volunteer matches the typed name, cell, and email values.')
      }
      if (matches.length > 1) {
        throw new Error('Multiple volunteers match those values. Add a more specific email or cell number.')
      }

      const volunteer = matches[0]

      if (currentAssignedVolunteer?.id === volunteer.id) {
        setVolunteerDraftOverride({
          name: volunteer.name,
          phone: volunteer.phone,
          email: volunteer.email,
        })
        onMessage('Volunteer assignment already matches this row.')
        return
      }

      if (currentAssignedVolunteer?.id) {
        await onUnassignVolunteer(row.id, currentAssignedVolunteer.id)
      }

      await onAssignVolunteer(row.id, volunteer.id)
      setVolunteerDraftOverride({
        name: volunteer.name,
        phone: volunteer.phone,
        email: volunteer.email,
      })
      onMessage('Updated shift assignments.')
    } catch (error) {
      onMessage(error instanceof Error ? error.message : 'Failed to update volunteer')
    } finally {
      setAssignmentBusyKey(null)
    }
  }

  const handleRemoveAssignment = async (volunteerId: string, volunteerName: string) => {
    if (!row.id) return

    setAssignmentBusyKey(`remove:${row.id}:${volunteerId}`)
    onMessage(null)

    try {
      await onUnassignVolunteer(row.id, volunteerId)
      setVolunteerDraftOverride({ name: '', phone: '', email: '' })
      onMessage(`Removed ${volunteerName} from shift.`)
    } catch (error) {
      onMessage(error instanceof Error ? error.message : 'Failed to remove volunteer')
    } finally {
      setAssignmentBusyKey(null)
    }
  }

  return (
    <tr className={`border-b border-gray-border align-top ${row.id ? '' : 'bg-orange-50/60'}`}>
      <td className="px-3 py-3">
        <select
          value={row.day}
          onChange={(event) => onRowChange('day', event.target.value)}
          className={`${inputClassName} min-w-[140px]`}
        >
          {EVENT_DAYS.map((day) => (
            <option key={day.date} value={day.date}>
              {day.label}
            </option>
          ))}
        </select>
      </td>
      <td className="px-3 py-3">
        <input
          type="text"
          value={row.role}
          onChange={(event) => onRowChange('role', event.target.value)}
          list="shift-spreadsheet-role-options"
          className={`${inputClassName} min-w-[220px]`}
          placeholder="Shift role"
        />
      </td>
      <td className="min-w-[240px] px-3 py-3">
        <div className="space-y-2">
          <Popover.Root open={pickerOpen && !!row.id && !hasMultipleAssignments} onOpenChange={setPickerOpen}>
            <Popover.Anchor asChild>
              <div className="relative">
                <input
                  type="text"
                  value={hasMultipleAssignments ? 'Multiple assigned' : volunteerDraft.name}
                  onFocus={() => {
                    if (row.id && !hasMultipleAssignments) {
                      setPickerOpen(true)
                    }
                  }}
                  onChange={(event) => {
                    updateVolunteerDraft('name', event.target.value)
                    if (row.id && !hasMultipleAssignments) {
                      setPickerOpen(true)
                    }
                  }}
                  disabled={!row.id || hasMultipleAssignments}
                  className={`${inputClassName} pr-20`}
                  placeholder={row.id ? 'Volunteer name' : 'Save row first'}
                />
                {row.id && !hasMultipleAssignments ? (
                  <button
                    type="button"
                    onClick={() => setPickerOpen((current) => !current)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full border border-gray-border px-2 py-1 text-[11px] font-medium text-teal"
                  >
                    Search
                  </button>
                ) : null}
              </div>
            </Popover.Anchor>
            <Popover.Portal>
              <Popover.Content
                sideOffset={8}
                align="start"
                className="z-50 w-[360px] rounded-xl border border-gray-border bg-white p-3 shadow-xl"
              >
                <div className="mb-2 flex items-center justify-between">
                  <div>
                    <div className="text-xs font-medium uppercase tracking-wide text-gray-text">
                      Volunteer Picker
                    </div>
                    <p className="text-sm text-gray-text">
                      Type in the row or choose a matching volunteer here.
                    </p>
                  </div>
                </div>
                <Command className="w-full">
                  <Command.List className="max-h-64 overflow-y-auto rounded-lg border border-gray-border p-1">
                    <Command.Empty className="px-3 py-4 text-sm text-gray-text">
                      No matching volunteers for this row.
                    </Command.Empty>
                    {filteredVolunteers.map((volunteer) => (
                      <Command.Item
                        key={volunteer.id}
                        value={`${volunteer.name} ${volunteer.email} ${volunteer.phone}`}
                        onSelect={() => void handleSelectVolunteer(volunteer)}
                        className="cursor-pointer rounded-md px-3 py-2 data-[selected=true]:bg-teal-50"
                      >
                        <div className="min-w-0">
                          <div className="truncate font-medium text-charcoal">{volunteer.name}</div>
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
          {row.id ? (
            <button
              type="button"
              onClick={() => void handleApplyVolunteer()}
              disabled={assignmentBusyKey === `apply:${row.id}`}
              className="text-left text-xs font-medium text-teal hover:underline disabled:opacity-50"
            >
              {assignmentBusyKey === `apply:${row.id}` ? 'Applying typed values…' : 'Apply typed values'}
            </button>
          ) : null}
        </div>
      </td>
      <td className="min-w-[160px] px-3 py-3">
        <input
          type="text"
          value={hasMultipleAssignments ? 'Multiple assigned' : volunteerDraft.phone}
          onChange={(event) => updateVolunteerDraft('phone', event.target.value)}
          disabled={!row.id || hasMultipleAssignments}
          className={inputClassName}
          placeholder={row.id ? 'Volunteer cell' : 'Save row first'}
        />
      </td>
      <td className="min-w-[220px] px-3 py-3">
        <input
          type="email"
          value={hasMultipleAssignments ? 'Multiple assigned' : volunteerDraft.email}
          onChange={(event) => updateVolunteerDraft('email', event.target.value)}
          disabled={!row.id || hasMultipleAssignments}
          className={inputClassName}
          placeholder={row.id ? 'Volunteer email' : 'Save row first'}
        />
      </td>
      <td className="px-3 py-3">
        <LocationCombobox
          address={row.address ?? ''}
          currentLocation={row.location}
          venues={venues}
          onCreateVenue={onCreateVenue}
          onUpdateVenue={onUpdateVenue}
          onMessage={(message) => onMessage(message)}
          onSelectLocation={({ address, location }) => {
            onRowChange('location', location)
            onRowChange('address', address)
          }}
        />
      </td>
      <td className="px-3 py-3">
        <input
          type="text"
          value={row.address ?? ''}
          onChange={(event) => onRowChange('address', event.target.value)}
          className={`${inputClassName} min-w-[260px]`}
          placeholder="Venue address"
        />
      </td>
      <td className="px-3 py-3">
        <input
          type="time"
          value={row.start_time}
          onChange={(event) => onRowChange('start_time', event.target.value)}
          className={`${inputClassName} min-w-[110px]`}
        />
      </td>
      <td className="px-3 py-3">
        <input
          type="time"
          value={row.end_time}
          onChange={(event) => onRowChange('end_time', event.target.value)}
          className={`${inputClassName} min-w-[110px]`}
        />
      </td>
      <td className="px-3 py-3">
        <input
          type="number"
          min={1}
          value={row.total_slots}
          onChange={(event) => onRowChange('total_slots', Number(event.target.value))}
          className={`${inputClassName} min-w-[100px]`}
        />
      </td>
      <td className="px-3 py-3">
        <textarea
          value={row.notes ?? ''}
          onChange={(event) => onRowChange('notes', event.target.value)}
          className={`${inputClassName} min-h-[72px] min-w-[220px] resize-y`}
          rows={2}
          placeholder="Optional notes"
        />
      </td>
      <td className="px-3 py-3">
        <div className="flex min-w-[220px] flex-col gap-2">
          {row.id ? (
            assignments.map((assignment) =>
              assignment.volunteer ? (
                <button
                  key={assignment.id}
                  type="button"
                  onClick={() =>
                    void handleRemoveAssignment(assignment.volunteer!.id, assignment.volunteer!.name)
                  }
                  disabled={assignmentBusyKey === `remove:${row.id}:${assignment.volunteer.id}`}
                  className="text-left text-xs font-medium text-red-600 hover:underline disabled:opacity-50"
                >
                  {assignmentBusyKey === `remove:${row.id}:${assignment.volunteer.id}`
                    ? `Removing ${assignment.volunteer.name}…`
                    : `Remove ${assignment.volunteer.name}`}
                </button>
              ) : null
            )
          ) : (
            <span className="text-xs italic text-gray-text">Save this row before assigning volunteers.</span>
          )}
          <button
            type="button"
            onClick={onDuplicate}
            className="text-left text-xs font-medium text-teal hover:underline"
          >
            {row.id ? 'Duplicate' : 'Duplicate draft'}
          </button>
          <button
            type="button"
            onClick={onDelete}
            className="text-left text-xs font-medium text-red-600 hover:underline"
          >
            Delete
          </button>
          {!row.id ? <span className="text-xs font-medium text-orange-700">New unsaved row</span> : null}
        </div>
      </td>
    </tr>
  )
})

export function ShiftSpreadsheet({
  shifts,
  availableRoles,
  assignments,
  volunteers,
  venues,
  onSave,
  onImportFile,
  onCreateVenue,
  onUpdateVenue,
  onAssignVolunteer,
  onUnassignVolunteer,
}: ShiftSpreadsheetProps) {
  const [rows, setRows] = useState<SpreadsheetRow[]>(() => sortShifts(shifts.map(toEditableShift)))
  const [deletedShiftIds, setDeletedShiftIds] = useState<string[]>([])
  const [saving, setSaving] = useState(false)
  const [importing, setImporting] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const baselineRows = useMemo(() => sortShifts(shifts.map(toEditableShift)), [shifts])
  const assignmentsByShiftId = useMemo(() => {
    const grouped = new Map<string, ShiftAssignment[]>()

    assignments.forEach((assignment) => {
      const current = grouped.get(assignment.shift_id) || []
      current.push(assignment)
      grouped.set(assignment.shift_id, current)
    })

    return grouped
  }, [assignments])

  const isDirty = useMemo(
    () => deletedShiftIds.length > 0 || !sameShifts(rows, baselineRows),
    [baselineRows, deletedShiftIds.length, rows]
  )

  const updateRow = useCallback(
    (index: number, key: keyof ShiftEditorInput, value: string | number) => {
      setRows((current) =>
        current.map((row, rowIndex) => {
          if (rowIndex !== index) return row

          if (key === 'location') {
            const nextLocation = String(value)
            const previousDefault = getDefaultAddress(row.location, venues)
            const nextDefault = getDefaultAddress(nextLocation, venues)

            return {
              ...row,
              location: nextLocation,
              address:
                !row.address || row.address === previousDefault ? nextDefault || row.address : row.address,
            }
          }

          return { ...row, [key]: value }
        })
      )
    },
    [venues]
  )

  const addRow = useCallback(() => {
    setRows((current) => [
      ...current,
      { ...createEmptyShift(availableRoles[0] ?? DEFAULT_SHIFT_ROLE), draftKey: createDraftKey() },
    ])
    setMessage(null)
  }, [availableRoles])

  const duplicateRow = useCallback(
    (index: number) => {
      const row = rows[index]
      if (!row) return

      const clone = {
        role: row.role,
        day: row.day,
        start_time: row.start_time,
        end_time: row.end_time,
        location: row.location,
        address: row.address ?? '',
        total_slots: row.total_slots,
        notes: row.notes ?? '',
        draftKey: createDraftKey(),
      }

      setRows((current) => [...current, clone])
      setMessage(null)
    },
    [rows]
  )

  const deleteRow = useCallback((index: number) => {
    setRows((current) => {
      const row = current[index]
      if (!row) return current

      if (row.id) {
        setDeletedShiftIds((deleted) => [...deleted, row.id!])
      }

      return current.filter((_, currentIndex) => currentIndex !== index)
    })
    setMessage(null)
  }, [])

  const handleSave = useCallback(async () => {
    setSaving(true)
    setMessage(null)

    try {
      const sanitizedRows = rows.map((row, index) => {
        const shiftRow = { ...row }
        delete shiftRow.draftKey
        const result = sanitizeShiftInput(shiftRow, index + 1)
        if (result.error || !result.value) {
          throw new Error(result.error || 'Invalid shift')
        }
        return result.value
      })

      await onSave(sortShifts(sanitizedRows), deletedShiftIds)
      setDeletedShiftIds([])
      setMessage('Saved shift spreadsheet.')
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Failed to save shifts')
    } finally {
      setSaving(false)
    }
  }, [deletedShiftIds, onSave, rows])

  const handleExport = useCallback(() => {
    const csv = shiftsToCsv(rows)
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'BSW_2026_Volunteer_Shifts.csv'
    link.click()
    URL.revokeObjectURL(url)
  }, [rows])

  const handleExportXlsx = useCallback(async () => {
    const XLSX = await import('xlsx')
    const worksheet = XLSX.utils.json_to_sheet(shiftsToTabularData(rows))
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, 'BSW_2026_Volunteer_Shifts.csv')
    XLSX.writeFile(workbook, 'BSW_2026_Volunteer_Shifts.xlsx')
  }, [rows])

  const handleImportClick = useCallback(() => {
    fileInputRef.current?.click()
  }, [])

  const handleImportFile = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0]
      event.target.value = ''
      if (!file) return

      const proceed = confirm(
        'Importing a file replaces the entire shift schedule and removes existing assignments. Continue?'
      )
      if (!proceed) return

      setImporting(true)
      setMessage(null)

      try {
        const importedCount = await onImportFile(file)
        setMessage(
          importedCount != null
            ? `Imported ${importedCount} shifts from file.`
            : 'Imported shifts from file.'
        )
      } catch (error) {
        setMessage(error instanceof Error ? error.message : 'Failed to import file')
      } finally {
        setImporting(false)
      }
    },
    [onImportFile]
  )

  return (
    <div className="space-y-4">
      <div className="card">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-charcoal">Shift Spreadsheet</h2>
            <p className="text-sm text-gray-text">
              Edit shift rows inline, then save the schedule in one batch.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={handleImportClick}
              disabled={importing}
              className="rounded-md border border-gray-border px-4 py-2 text-sm font-medium hover:border-teal hover:text-teal disabled:opacity-50"
            >
              {importing ? 'Importing...' : 'Import CSV/XLSX'}
            </button>
            <button
              type="button"
              onClick={handleExport}
              className="rounded-md border border-gray-border px-4 py-2 text-sm font-medium hover:border-teal hover:text-teal"
            >
              Export CSV
            </button>
            <button
              type="button"
              onClick={() => void handleExportXlsx()}
              className="rounded-md border border-gray-border px-4 py-2 text-sm font-medium hover:border-teal hover:text-teal"
            >
              Export XLSX
            </button>
            <button
              type="button"
              onClick={addRow}
              className="rounded-md border border-gray-border px-4 py-2 text-sm font-medium hover:border-teal hover:text-teal"
            >
              + Add Row
            </button>
            <button
              type="button"
              onClick={() => void handleSave()}
              disabled={!isDirty || saving}
              className="rounded-md bg-teal-500 px-4 py-2 text-sm font-medium text-white hover:bg-teal-600 disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save All'}
            </button>
          </div>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,text/csv,.xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
          onChange={handleImportFile}
          className="hidden"
        />

        <div className="mt-3 text-sm text-gray-text">
          Import and export use the same BSW workbook shape as your original spreadsheet.
        </div>
        <div className="mt-1 text-sm text-gray-text">
          Volunteer search now lives in the volunteer name cell, and location editing happens inside
          the location dropdown itself.
        </div>

        {message ? (
          <div className="mt-3 rounded-md border border-gray-border bg-gray-50 px-3 py-2 text-sm text-charcoal">
            {message}
          </div>
        ) : null}
      </div>

      <div className="card overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="min-w-[1180px] w-full text-sm">
            <thead className="border-b border-gray-border bg-gray-50">
              <tr>
                {[
                  'Day',
                  'Role',
                  'Volunteer Name',
                  'Volunteer Cell',
                  'Volunteer Email',
                  'Location',
                  'Address',
                  'Start',
                  'End',
                  'Total Slots',
                  'Notes',
                  '',
                ].map((header) => (
                  <th
                    key={header || 'actions'}
                    className="whitespace-nowrap px-3 py-3 text-left font-semibold text-charcoal"
                  >
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={12} className="px-4 py-10 text-center text-gray-text">
                    No shifts yet. Add a row or import a CSV to get started.
                  </td>
                </tr>
              ) : (
                rows.map((row, index) => (
                  (() => {
                    const rowAssignments = row.id ? assignmentsByShiftId.get(row.id) || [] : []
                    const assignmentKey = rowAssignments
                      .map((assignment) => `${assignment.id}:${assignment.volunteer_id}`)
                      .join('|')

                    return (
                  <SpreadsheetTableRow
                    key={`${row.id ?? row.draftKey ?? `draft-${index}`}:${assignmentKey}`}
                    row={row}
                    assignments={rowAssignments}
                    volunteers={volunteers}
                    venues={venues}
                    onAssignVolunteer={onAssignVolunteer}
                    onUnassignVolunteer={onUnassignVolunteer}
                    onCreateVenue={onCreateVenue}
                    onUpdateVenue={onUpdateVenue}
                    onRowChange={(key, value) => updateRow(index, key, value)}
                    onDuplicate={() => duplicateRow(index)}
                    onDelete={() => deleteRow(index)}
                    onMessage={setMessage}
                  />
                    )
                  })()
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      <datalist id="shift-spreadsheet-role-options">
        {availableRoles.map((role) => (
          <option key={role} value={role} />
        ))}
      </datalist>
    </div>
  )
}

function createEmptyShift(role: string): ShiftEditorInput {
  return {
    role,
    day: EVENT_DAYS[0].date,
    start_time: '09:00',
    end_time: '11:00',
    location: VENUE_NAMES[0],
    address: VENUE_ADDRESSES[VENUE_NAMES[0]],
    total_slots: 1,
    notes: '',
  }
}
