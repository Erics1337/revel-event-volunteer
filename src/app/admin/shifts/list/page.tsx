'use client'

import React, { useCallback, useMemo, useEffect, useRef, useState } from 'react'
import * as Popover from '@radix-ui/react-popover'
import { Command } from 'cmdk'
import { ShiftModal } from '@/components/admin/ShiftModal'
import { useShiftAdminData } from '@/components/admin/useShiftAdminData'
import { SearchIcon } from '@/components/icons'
import {
  EVENT_DAYS,
  getShiftRoles,
  type VolunteerShift,
  type AvailableVolunteer,
  type ShiftAssignment,
} from '@/lib/shifts/types'

type ModalState =
  | { kind: 'closed' }
  | { kind: 'create'; seed?: { role?: string; day?: string; location?: string } }
  | { kind: 'edit'; shift: VolunteerShift }
  | { kind: 'coverage'; shift: VolunteerShift }

type CoverageFilter = 'all' | 'open' | 'covered' | 'urgent'

export default function AdminShiftsListPage() {
  const {
    shifts,
    assignments,
    volunteers,
    venues,
    loading,
    error,
    createShift,
    updateShift,
    deleteShift,
    createVenue,
    updateVenue,
    deleteVenue,
    renameRole,
    deleteRole,
    assignVolunteer,
    unassignVolunteer,
  } = useShiftAdminData()

  const [modal, setModal] = useState<ModalState>({ kind: 'closed' })
  const [search, setSearch] = useState('')
  const [dayFilter, setDayFilter] = useState<string[]>([])
  const [roleFilter, setRoleFilter] = useState<string[]>([])
  const [locationFilter, setLocationFilter] = useState<string[]>([])
  const [coverageFilter, setCoverageFilter] = useState<CoverageFilter>('all')
  const [filterMessage, setFilterMessage] = useState<string | null>(null)

  const availableRoles = useMemo(() => getShiftRoles(shifts), [shifts])
  const availableLocations = useMemo(
    () => [...new Set(shifts.map((s) => s.location))].sort(),
    [shifts]
  )

  const filledByShift = useMemo(() => {
    const counts = new Map<string, number>()
    for (const a of assignments) {
      if (a.status === 'cancelled') continue
      counts.set(a.shift_id, (counts.get(a.shift_id) ?? 0) + 1)
    }
    return counts
  }, [assignments])

  const getFilled = useCallback(
    (shift: VolunteerShift) => {
      const fromAssignments = filledByShift.get(shift.id)
      if (fromAssignments !== undefined) return fromAssignments
      return shift.filled_slots ?? 0
    },
    [filledByShift]
  )

  const stats = useMemo(() => {
    const totalSlots = shifts.reduce((sum, s) => sum + (s.total_slots ?? 0), 0)
    const filledSlots = shifts.reduce((sum, s) => sum + Math.min(getFilled(s), s.total_slots ?? 0), 0)
    const openSlots = Math.max(0, totalSlots - filledSlots)
    const coveredShifts = shifts.filter((s) => getFilled(s) >= s.total_slots).length
    const fillPct = totalSlots > 0 ? Math.round((filledSlots / totalSlots) * 100) : 0
    return {
      totalShifts: shifts.length,
      totalSlots,
      filledSlots,
      openSlots,
      coveredShifts,
      fillPct,
    }
  }, [shifts, getFilled])

  const sortedShifts = useMemo(
    () =>
      [...shifts].sort(
        (a, b) =>
          a.day.localeCompare(b.day) ||
          a.start_time.localeCompare(b.start_time) ||
          a.location.localeCompare(b.location) ||
          a.role.localeCompare(b.role)
      ),
    [shifts]
  )

  const query = search.trim().toLowerCase()

  const filteredShifts = useMemo(() => {
    return sortedShifts.filter((shift) => {
      if (dayFilter.length > 0 && !dayFilter.includes(shift.day)) return false
      if (roleFilter.length > 0 && !roleFilter.includes(shift.role)) return false
      if (locationFilter.length > 0 && !locationFilter.includes(shift.location)) return false

      const filled = getFilled(shift)
      if (coverageFilter === 'open' && filled >= shift.total_slots) return false
      if (coverageFilter === 'covered' && filled < shift.total_slots) return false
      if (coverageFilter === 'urgent' && !shift.urgent) return false

      if (query) {
        const haystack = [
          shift.role,
          shift.location,
          shift.day,
          shift.start_time,
          shift.end_time,
          shift.address ?? '',
          shift.notes ?? '',
        ]
          .join(' ')
          .toLowerCase()
        if (!haystack.includes(query)) return false
      }

      return true
    })
  }, [sortedShifts, dayFilter, roleFilter, locationFilter, coverageFilter, query, getFilled])

  const modalAssignments = useMemo(() => {
    if (modal.kind !== 'edit') return []
    return assignments.filter((assignment) => assignment.shift_id === modal.shift.id)
  }, [assignments, modal])

  const toggleFilter = (
    setter: React.Dispatch<React.SetStateAction<string[]>>,
    value: string
  ) => {
    setter((current) =>
      current.includes(value) ? current.filter((v) => v !== value) : [...current, value]
    )
  }

  const hasFilters =
    dayFilter.length > 0 ||
    roleFilter.length > 0 ||
    locationFilter.length > 0 ||
    coverageFilter !== 'all' ||
    query.length > 0

  const resetFilters = () => {
    setDayFilter([])
    setRoleFilter([])
    setLocationFilter([])
    setCoverageFilter('all')
    setSearch('')
  }

  if (loading) {
    return (
      <div className="card flex items-center justify-center py-16">
        <div className="w-8 h-8 border-4 border-teal-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {error ? (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-gray-text">
          Browse, search, and edit every shift. Click a row to open the shift editor.
        </p>
        <button
          onClick={() => setModal({ kind: 'create' })}
          className="bg-teal-500 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-teal-600"
        >
          + New Shift
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <button
          type="button"
          onClick={() => { setCoverageFilter('all'); }}
          className="rounded-xl border border-gray-border bg-white px-4 py-3 shadow-sm text-left transition hover:border-teal-300 hover:shadow"
        >
          <p className="text-xs font-medium text-gray-mid">Total Shifts</p>
          <p className="mt-0.5 text-xl font-bold text-charcoal">{stats.totalShifts}</p>
        </button>

        <button
          type="button"
          onClick={() => { setCoverageFilter('covered'); }}
          className="rounded-xl border border-gray-border bg-white px-4 py-3 shadow-sm text-left transition hover:border-emerald-300 hover:shadow"
        >
          <p className="text-xs font-medium text-gray-mid">Covered</p>
          <p className={`mt-0.5 text-xl font-bold ${stats.coveredShifts === stats.totalShifts ? 'text-emerald-600' : 'text-charcoal'}`}>
            {stats.coveredShifts} <span className="text-sm font-normal text-gray-mid">/ {stats.totalShifts}</span>
          </p>
        </button>

        <button
          type="button"
          onClick={() => { setCoverageFilter('open'); }}
          className={`rounded-xl border px-4 py-3 shadow-sm text-left transition hover:shadow ${
            stats.openSlots === 0
              ? 'border-gray-border bg-white hover:border-teal-300'
              : 'border-orange-200 bg-orange-50 hover:border-orange-300'
          }`}
        >
          <p className={`text-xs font-medium ${stats.openSlots === 0 ? 'text-gray-mid' : 'text-orange-600'}`}>Open Slots</p>
          <p className={`mt-0.5 text-xl font-bold ${stats.openSlots === 0 ? 'text-charcoal' : 'text-orange-700'}`}>
            {stats.openSlots}
          </p>
        </button>

        <div className="rounded-xl border border-gray-border bg-white px-4 py-3 shadow-sm">
          <p className="text-xs font-medium text-gray-mid">Fill Rate</p>
          <p className={`mt-0.5 text-xl font-bold ${
            stats.fillPct >= 80 ? 'text-emerald-600' : stats.fillPct >= 50 ? 'text-amber-600' : 'text-red-600'
          }`}>
            {stats.fillPct}%
          </p>
          <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-gray-border">
            <div
              className={`h-full rounded-full transition-all ${
                stats.fillPct >= 80 ? 'bg-emerald-500' : stats.fillPct >= 50 ? 'bg-amber-400' : 'bg-red-400'
              }`}
              style={{ width: `${stats.fillPct}%` }}
            />
          </div>
        </div>
      </div>
      {filterMessage ? (
        <div className="rounded-md border border-gray-border bg-gray-50 px-3 py-2 text-sm text-charcoal">
          {filterMessage}
        </div>
      ) : null}

      <div className="rounded-2xl border border-gray-border bg-white shadow-sm overflow-hidden">
        <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-border bg-gray-light/40">
          <SearchIcon className="h-4 w-4 shrink-0 text-gray-mid" />
          <input
            className="flex-1 bg-transparent text-sm text-charcoal placeholder:text-gray-mid outline-none"
            placeholder="Search by role, location, time, or notes…"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
          <span className="shrink-0 text-xs text-gray-mid">
            {filteredShifts.length} / {shifts.length}
          </span>
          {hasFilters && (
            <button
              type="button"
              onClick={resetFilters}
              className="shrink-0 rounded-full bg-gray-border/60 px-2.5 py-1 text-xs font-medium text-gray-text transition-colors hover:bg-gray-border hover:text-charcoal"
            >
              Clear all
            </button>
          )}
        </div>

        <div className="divide-y divide-gray-border/60">
          <FilterRow label="Status">
            {(['all', 'open', 'covered', 'urgent'] as const).map((value) => {
              const config: Record<CoverageFilter, { label: string; activeClass: string }> = {
                all: { label: 'All', activeClass: 'bg-charcoal text-white border-charcoal' },
                open: { label: 'Needs coverage', activeClass: 'bg-orange-500 text-white border-orange-500' },
                covered: { label: 'Covered', activeClass: 'bg-emerald-500 text-white border-emerald-500' },
                urgent: { label: 'Urgent', activeClass: 'bg-red-500 text-white border-red-500' },
              }
              const active = coverageFilter === value
              return (
                <button
                  key={value}
                  type="button"
                  onClick={() => setCoverageFilter(value)}
                  className={`rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-all ${
                    active
                      ? config[value].activeClass
                      : 'border-gray-border bg-white text-charcoal hover:border-teal-300 hover:text-teal'
                  }`}
                >
                  {config[value].label}
                </button>
              )
            })}
          </FilterRow>

          <FilterRow
            label="Day"
            onClear={dayFilter.length > 0 ? () => setDayFilter([]) : undefined}
            onAdd={() => setModal({ kind: 'create' })}
          >
            {EVENT_DAYS.map((day) => (
              <FilterPill
                key={day.date}
                label={day.label}
                active={dayFilter.includes(day.date)}
                onToggle={() => toggleFilter(setDayFilter, day.date)}
              />
            ))}
          </FilterRow>

          <FilterRow
            label="Location"
            onClear={locationFilter.length > 0 ? () => setLocationFilter([]) : undefined}
          >
            {availableLocations.map((loc) => {
              const venue = venues.find((v) => v.name === loc) ?? null
              return (
                <FilterPillWithEdit
                  key={loc}
                  label={loc}
                  active={locationFilter.includes(loc)}
                  onToggle={() => toggleFilter(setLocationFilter, loc)}
                  editForm={
                    <VenueForm
                      mode="edit"
                      initialName={venue?.name ?? loc}
                      initialAddress={venue?.address ?? ''}
                      otherLocations={availableLocations.filter((l) => l !== loc)}
                      onSave={async (name, address) => {
                        if (!venue) return
                        try {
                          const result = await updateVenue(venue.id, { name, address })
                          if (result) setFilterMessage(`Updated location "${result.name}".`)
                        } catch (err) {
                          console.error('Failed to update location', err)
                          setFilterMessage(`Failed to update location: ${err instanceof Error ? err.message : 'Unknown error'}`)
                        }
                      }}
                      onDelete={venue ? async (replacementLocation) => {
                        try {
                          await deleteVenue(venue.id, replacementLocation)
                          setLocationFilter((f) => f.filter((x) => x !== loc))
                          setFilterMessage(
                            replacementLocation
                              ? `Removed "${loc}", shifts reassigned to "${replacementLocation}".`
                              : `Deleted location "${loc}".`
                          )
                        } catch (err) {
                          console.error('Failed to remove location', err)
                          setFilterMessage(`Failed to remove location: ${err instanceof Error ? err.message : 'Unknown error'}`)
                        }
                      } : undefined}
                    />
                  }
                />
              )
            })}
            <AddPopover
              triggerLabel="+ Add location"
              form={
                <VenueForm
                  mode="add"
                  initialName=""
                  initialAddress=""
                  onSave={async (name, address) => {
                    const result = await createVenue({ name, address })
                    if (result) setFilterMessage(`Added location "${result.name}".`)
                  }}
                />
              }
            />
          </FilterRow>

          <FilterRow
            label="Role"
            onClear={roleFilter.length > 0 ? () => setRoleFilter([]) : undefined}
          >
            {availableRoles.map((role) => (
              <FilterPillWithEdit
                key={role}
                label={role}
                active={roleFilter.includes(role)}
                onToggle={() => toggleFilter(setRoleFilter, role)}
                editForm={
                  <RoleEditForm
                    initialRole={role}
                    otherRoles={availableRoles.filter((r) => r !== role)}
                    onSave={async (newRole) => {
                      try {
                        await renameRole(role, newRole)
                        setRoleFilter((f) => f.map((r) => (r === role ? newRole : r)))
                        setFilterMessage(`Renamed role to "${newRole}".`)
                      } catch (err) {
                        console.error('Failed to rename role', err)
                        setFilterMessage(`Failed to rename role: ${err instanceof Error ? err.message : 'Unknown error'}`)
                      }
                    }}
                    onDelete={async (replacementRole) => {
                      try {
                        await deleteRole(role, replacementRole)
                        setRoleFilter((f) => f.filter((r) => r !== role))
                        setFilterMessage(`Reassigned all "${role}" shifts to "${replacementRole}".`)
                      } catch (err) {
                        console.error('Failed to remove role', err)
                        setFilterMessage(`Failed to remove role: ${err instanceof Error ? err.message : 'Unknown error'}`)
                      }
                    }}
                  />
                }
              />
            ))}
            <AddPopover
              triggerLabel="+ Add role"
              form={
                <RoleForm
                  onSave={(role) => {
                    setModal({ kind: 'create', seed: { role } })
                  }}
                />
              }
            />
          </FilterRow>
        </div>
      </div>

      <div className="overflow-hidden rounded-md border border-gray-border bg-white">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-light text-xs font-semibold uppercase tracking-wide text-gray-text">
            <tr>
              <th className="px-4 py-3 text-left">Day</th>
              <th className="px-4 py-3 text-left">Time</th>
              <th className="px-4 py-3 text-left">Role</th>
              <th className="px-4 py-3 text-left">Location</th>
              <th className="px-4 py-3 text-left">Coverage</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredShifts.map((shift) => {
              const filled = getFilled(shift)
              const open = Math.max(0, shift.total_slots - filled)
              const over = Math.max(0, filled - shift.total_slots)
              const isCovered = open === 0
              const isOverstaffed = over > 0
              const day = EVENT_DAYS.find((d) => d.date === shift.day)
              const pillClass = coveragePillClass(filled, shift.total_slots)
              return (
                <tr
                  key={shift.id}
                  className="border-t border-gray-border transition-colors hover:bg-gray-light/60"
                >
                  <td className="px-4 py-3 align-top">
                    <p className="font-medium text-charcoal">{day?.label || shift.day}</p>
                    {shift.urgent ? (
                      <span className="mt-1 inline-block rounded-full bg-error/10 px-2 py-0.5 text-xs font-semibold text-error">
                        Urgent
                      </span>
                    ) : null}
                  </td>
                  <td className="px-4 py-3 align-top text-charcoal">
                    {shift.start_time.slice(0, 5)} – {shift.end_time.slice(0, 5)}
                  </td>
                  <td className="px-4 py-3 align-top text-charcoal">{shift.role}</td>
                  <td className="px-4 py-3 align-top">
                    <p className="text-charcoal">{shift.location}</p>
                    {shift.address ? (
                      <p className="text-xs text-gray-text">{shift.address}</p>
                    ) : null}
                  </td>
                  <td className="px-4 py-3 align-top">
                    <button
                      type="button"
                      onClick={() => setModal({ kind: 'coverage', shift })}
                      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold transition-opacity hover:opacity-75 ${pillClass}`}
                    >
                      {filled}/{shift.total_slots}{' '}
                      {isOverstaffed
                        ? `· ${over} over`
                        : isCovered
                          ? 'covered'
                          : `· ${open} open`}
                    </button>
                  </td>
                  <td className="px-4 py-3 align-top text-right">
                    <button
                      type="button"
                      onClick={() => setModal({ kind: 'edit', shift })}
                      className="rounded-md border border-gray-border px-3 py-1.5 text-xs font-semibold text-charcoal transition-colors hover:border-teal-500 hover:text-teal"
                    >
                      Edit
                    </button>
                  </td>
                </tr>
              )
            })}
            {filteredShifts.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center">
                  <p className="font-accent text-lg font-semibold text-charcoal">
                    {shifts.length === 0
                      ? 'No shifts created yet'
                      : 'No shifts match these filters'}
                  </p>
                  <p className="mt-1 text-sm text-gray-text">
                    {shifts.length === 0
                      ? 'Use the + New Shift button to add the first one.'
                      : 'Try clearing some filters or adjusting your search.'}
                  </p>
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      {modal.kind === 'create' ? (
        <ShiftModal
          mode="create"
          availableRoles={availableRoles}
          venues={venues}
          initial={modal.seed ? {
            role: modal.seed.role,
            day: modal.seed.day,
            location: modal.seed.location,
          } : undefined}
          onClose={() => setModal({ kind: 'closed' })}
          onSave={createShift}
          onCreateVenue={createVenue}
          onUpdateVenue={updateVenue}
        />
      ) : null}

      {modal.kind === 'edit' ? (
        <ShiftModal
          mode="edit"
          availableRoles={availableRoles}
          initial={modal.shift}
          assignments={modalAssignments}
          volunteers={volunteers}
          venues={venues}
          onClose={() => setModal({ kind: 'closed' })}
          onSave={(values) => updateShift(modal.shift.id, values)}
          onCreateVenue={createVenue}
          onUpdateVenue={updateVenue}
          onDelete={async () => {
            await deleteShift(modal.shift.id)
            setModal({ kind: 'closed' })
          }}
          onAssign={(volunteerId) => assignVolunteer(modal.shift.id, volunteerId)}
          onUnassign={(volunteerId) => unassignVolunteer(modal.shift.id, volunteerId)}
        />
      ) : null}

      {modal.kind === 'coverage' ? (
        <CoverageModal
          shift={modal.shift}
          assignments={assignments.filter((a) => a.shift_id === modal.shift.id)}
          volunteers={volunteers}
          onClose={() => setModal({ kind: 'closed' })}
          onEdit={() => setModal({ kind: 'edit', shift: modal.shift })}
          onAssign={(volunteerId: string) => assignVolunteer(modal.shift.id, volunteerId)}
          onUnassign={(volunteerId: string) => unassignVolunteer(modal.shift.id, volunteerId)}
        />
      ) : null}
    </div>
  )
}

function coveragePillClass(filled: number, total: number): string {
  if (total > 0 && filled > total) return 'bg-purple-100 text-purple-700'
  if (total === 0 || filled >= total) return 'bg-success/10 text-success'
  const ratio = filled / total
  if (filled === 0) return 'bg-red-100 text-red-700'
  if (ratio <= 0.5) return 'bg-orange-100 text-orange-700'
  return 'bg-amber-100 text-amber-700'
}

interface FilterRowProps {
  label: string
  onClear?: () => void
  onAdd?: () => void
  children: React.ReactNode
}

function FilterRow({ label, onClear, onAdd, children }: FilterRowProps) {
  return (
    <div className="flex items-start gap-4 px-4 py-3">
      <div className="flex w-20 shrink-0 flex-col gap-1 pt-1">
        <span className="text-xs font-semibold uppercase tracking-wide text-gray-mid">{label}</span>
        <div className="flex items-center gap-1.5">
          {onAdd ? (
            <button
              type="button"
              onClick={onAdd}
              className="text-[10px] font-semibold text-teal hover:underline"
            >
              + Add
            </button>
          ) : null}
          {onClear ? (
            <button
              type="button"
              onClick={onClear}
              className="text-[10px] font-semibold text-gray-mid hover:text-charcoal"
            >
              Clear
            </button>
          ) : null}
        </div>
      </div>
      <div className="flex flex-wrap gap-1.5">{children}</div>
    </div>
  )
}

interface FilterPillWithEditProps {
  label: string
  active: boolean
  onToggle: () => void
  editForm: React.ReactNode
}

function FilterPillWithEdit({ label, active, onToggle, editForm }: FilterPillWithEditProps) {
  const [open, setOpen] = useState(false)
  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <div className="group relative flex items-center">
        <button
          type="button"
          onClick={onToggle}
          className={`rounded-full border py-1 pl-3 pr-7 text-xs font-medium transition-all ${
            active
              ? 'border-teal-500 bg-teal-500 text-white shadow-sm'
              : 'border-gray-border bg-white text-charcoal hover:border-teal-300 hover:text-teal'
          }`}
        >
          {label}
        </button>
        <Popover.Trigger asChild>
          <button
            type="button"
            className={`absolute right-1 flex h-4 w-4 items-center justify-center rounded-full text-[9px] transition-opacity ${
              active ? 'text-white/80 hover:text-white' : 'text-gray-mid hover:text-charcoal'
            }`}
            title="Edit location"
          >
            ✎
          </button>
        </Popover.Trigger>
      </div>
      <Popover.Portal>
        <Popover.Content
          sideOffset={8}
          align="start"
          className="z-50 w-[300px] rounded-xl border border-gray-border bg-white p-4 shadow-xl"
          onOpenAutoFocus={(e) => e.preventDefault()}
        >
          {editForm}
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  )
}

interface AddPopoverProps {
  triggerLabel: string
  form: React.ReactNode
}

function AddPopover({ triggerLabel, form }: AddPopoverProps) {
  const [open, setOpen] = useState(false)
  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger asChild>
        <button
          type="button"
          className="rounded-full border border-dashed border-teal-300 px-3 py-1 text-xs font-medium text-teal transition-colors hover:border-teal-500 hover:bg-teal-50"
        >
          {triggerLabel}
        </button>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          sideOffset={8}
          align="start"
          className="z-50 w-[300px] rounded-xl border border-gray-border bg-white p-4 shadow-xl"
          onOpenAutoFocus={(e) => e.preventDefault()}
        >
          {form}
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  )
}

const popoverInputClass =
  'w-full rounded-md border border-gray-border bg-white px-2 py-2 text-sm text-charcoal outline-none transition focus:border-teal focus:ring-2 focus:ring-teal/20'

interface VenueFormProps {
  mode: 'add' | 'edit'
  initialName: string
  initialAddress: string
  otherLocations?: string[]
  onSave: (name: string, address: string) => Promise<void>
  onDelete?: (replacementLocation: string) => Promise<void>
}

function VenueForm({ mode, initialName, initialAddress, otherLocations = [], onSave, onDelete }: VenueFormProps) {
  const [name, setName] = useState(initialName)
  const [address, setAddress] = useState(initialAddress)
  const [saving, setSaving] = useState(false)
  const [confirming, setConfirming] = useState(false)
  const [replacement, setReplacement] = useState(otherLocations[0] ?? '')
  return (
    <div className="space-y-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-gray-mid">
        {mode === 'edit' ? 'Edit Location' : 'Add Location'}
      </p>
      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        className={popoverInputClass}
        placeholder="Location name"
        autoFocus
      />
      <textarea
        value={address}
        onChange={(e) => setAddress(e.target.value)}
        className={`${popoverInputClass} min-h-[72px] resize-y`}
        placeholder="Street address"
      />
      <button
        type="button"
        disabled={saving || !name.trim()}
        onClick={async () => {
          setSaving(true)
          try { await onSave(name.trim(), address.trim()) } finally { setSaving(false) }
        }}
        className="rounded-full bg-teal px-4 py-1.5 text-xs font-semibold text-white disabled:opacity-50"
      >
        {saving ? 'Saving…' : mode === 'edit' ? 'Save' : 'Add'}
      </button>
      {onDelete ? (
        <div className="border-t border-gray-border pt-3">
          {confirming ? (
            <div className="space-y-2">
              <p className="text-xs text-gray-text">Reassign all <strong>{initialName}</strong> shifts to:</p>
              {otherLocations.length > 0 ? (
                <select
                  value={replacement}
                  onChange={(e) => setReplacement(e.target.value)}
                  className={popoverInputClass}
                >
                  {otherLocations.map((l) => <option key={l} value={l}>{l}</option>)}
                </select>
              ) : (
                <p className="text-xs text-gray-text italic">No other locations — shifts will have no location.</p>
              )}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={saving || !replacement || otherLocations.length === 0}
                  onClick={async () => { if (!replacement) return; setSaving(true); try { await onDelete(replacement) } finally { setSaving(false) } }}
                  className="rounded-full bg-red-500 px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50"
                >
                  {saving ? 'Saving…' : 'Reassign & remove'}
                </button>
                <button type="button" onClick={() => setConfirming(false)} className="text-xs text-gray-mid hover:text-charcoal">
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setConfirming(true)}
              className="text-xs text-red-500 hover:text-red-700 hover:underline"
            >
              Remove location…
            </button>
          )}
        </div>
      ) : null}
    </div>
  )
}

interface RoleEditFormProps {
  initialRole: string
  otherRoles: string[]
  onSave: (newRole: string) => Promise<void>
  onDelete: (replacementRole: string) => Promise<void>
}

function RoleEditForm({ initialRole, otherRoles, onSave, onDelete }: RoleEditFormProps) {
  const [role, setRole] = useState(initialRole)
  const [saving, setSaving] = useState(false)
  const [confirming, setConfirming] = useState(false)
  const [replacement, setReplacement] = useState(otherRoles[0] ?? '')
  return (
    <div className="space-y-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-gray-mid">Edit Role</p>
      <input
        type="text"
        value={role}
        onChange={(e) => setRole(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && role.trim() && role.trim() !== initialRole) {
            void (async () => { setSaving(true); try { await onSave(role.trim()) } finally { setSaving(false) } })()
          }
        }}
        className={popoverInputClass}
        placeholder="Role name"
        autoFocus
      />
      <button
        type="button"
        disabled={saving || !role.trim() || role.trim() === initialRole}
        onClick={async () => { setSaving(true); try { await onSave(role.trim()) } finally { setSaving(false) } }}
        className="rounded-full bg-teal px-4 py-1.5 text-xs font-semibold text-white disabled:opacity-50"
      >
        {saving ? 'Saving…' : 'Rename'}
      </button>
      <div className="border-t border-gray-border pt-3">
        {confirming ? (
          <div className="space-y-2">
            <p className="text-xs text-gray-text">Reassign all <strong>{initialRole}</strong> shifts to:</p>
            <select
              value={replacement}
              onChange={(e) => setReplacement(e.target.value)}
              className={popoverInputClass}
            >
              {otherRoles.map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={saving || !replacement}
                onClick={async () => { setSaving(true); try { await onDelete(replacement) } finally { setSaving(false) } }}
                className="rounded-full bg-red-500 px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50"
              >
                {saving ? 'Saving…' : 'Reassign & remove role'}
              </button>
              <button type="button" onClick={() => setConfirming(false)} className="text-xs text-gray-mid hover:text-charcoal">
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setConfirming(true)}
            disabled={otherRoles.length === 0}
            className="text-xs text-red-500 hover:text-red-700 hover:underline disabled:opacity-40"
            title={otherRoles.length === 0 ? 'No other roles to reassign to' : undefined}
          >
            Remove role…
          </button>
        )}
      </div>
    </div>
  )
}

interface RoleFormProps {
  onSave: (role: string) => void
}

function RoleForm({ onSave }: RoleFormProps) {
  const [role, setRole] = useState('')
  return (
    <div className="space-y-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-gray-mid">Add Role</p>
      <p className="text-xs text-gray-text">A new shift will open pre-filled with this role.</p>
      <input
        type="text"
        value={role}
        onChange={(e) => setRole(e.target.value)}
        onKeyDown={(e) => { if (e.key === 'Enter' && role.trim()) onSave(role.trim()) }}
        className={popoverInputClass}
        placeholder="Role name"
        autoFocus
      />
      <button
        type="button"
        disabled={!role.trim()}
        onClick={() => { if (role.trim()) onSave(role.trim()) }}
        className="rounded-full bg-teal px-4 py-1.5 text-xs font-semibold text-white disabled:opacity-50"
      >
        Create shift with this role →
      </button>
    </div>
  )
}

interface FilterPillProps {
  label: string
  active: boolean
  onToggle: () => void
}

function FilterPill({ label, active, onToggle }: FilterPillProps) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={`rounded-full border px-3 py-1 text-xs font-medium transition-all ${
        active
          ? 'border-teal-500 bg-teal-500 text-white shadow-sm'
          : 'border-gray-border bg-white text-charcoal hover:border-teal-300 hover:text-teal'
      }`}
    >
      {label}
    </button>
  )
}

interface CoverageModalProps {
  shift: VolunteerShift
  assignments: ShiftAssignment[]
  volunteers: AvailableVolunteer[]
  onClose: () => void
  onEdit: () => void
  onAssign: (volunteerId: string) => Promise<void>
  onUnassign: (volunteerId: string) => Promise<void>
}

function CoverageModal({
  shift,
  assignments,
  volunteers,
  onClose,
  onEdit,
  onAssign,
  onUnassign,
}: CoverageModalProps) {
  const [search, setSearch] = useState('')
  const [busyId, setBusyId] = useState<string | null>(null)
  const [assignError, setAssignError] = useState<string | null>(null)
  const dialogRef = useRef<HTMLDivElement>(null)
  const titleId = `coverage-modal-title-${shift.id}`

  useEffect(() => {
    const previousFocus = document.activeElement as HTMLElement | null

    const focusableSelectors =
      'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

    const getFocusable = () =>
      Array.from(dialogRef.current?.querySelectorAll<HTMLElement>(focusableSelectors) ?? [])

    getFocusable()[0]?.focus()

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
        return
      }
      if (e.key === 'Tab') {
        const focusable = getFocusable()
        if (focusable.length === 0) return
        const first = focusable[0]
        const last = focusable[focusable.length - 1]
        if (e.shiftKey) {
          if (document.activeElement === first) {
            e.preventDefault()
            last.focus()
          }
        } else {
          if (document.activeElement === last) {
            e.preventDefault()
            first.focus()
          }
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      previousFocus?.focus()
    }
  }, [onClose])

  const activeAssignments = assignments.filter((a) => a.status !== 'cancelled')
  const assignedIds = new Set(assignments.map((a) => a.volunteer_id))
  const filled = activeAssignments.length
  const open = Math.max(0, shift.total_slots - filled)
  const over = Math.max(0, filled - shift.total_slots)
  const isFull = filled >= shift.total_slots
  const isOverstaffed = over > 0

  const day = EVENT_DAYS.find((d) => d.date === shift.day)

  const unassignedVolunteers = volunteers.filter((v) => !assignedIds.has(v.id) && !v.blocked)

  const handleAssign = async (volunteerId: string) => {
    setBusyId(volunteerId)
    setAssignError(null)
    try {
      await onAssign(volunteerId)
    } catch (err) {
      console.error('Failed to assign volunteer', err)
      setAssignError(err instanceof Error ? err.message : 'Failed to assign volunteer.')
    } finally {
      setBusyId(null)
    }
  }

  const handleUnassign = async (volunteerId: string) => {
    setBusyId(volunteerId)
    setAssignError(null)
    try {
      await onUnassign(volunteerId)
    } catch (err) {
      console.error('Failed to remove volunteer', err)
      setAssignError(err instanceof Error ? err.message : 'Failed to remove volunteer.')
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div
      ref={dialogRef}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
    >
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative z-10 w-full max-w-md rounded-2xl border border-gray-border bg-white shadow-2xl">
        <div className="flex items-start justify-between border-b border-gray-border px-5 py-4">
          <div className="min-w-0">
            <h2 id={titleId} className="font-accent text-lg font-semibold text-charcoal">{shift.role}</h2>
            <p className="text-sm text-gray-text">
              {day?.label ?? shift.day} · {shift.start_time.slice(0, 5)}–{shift.end_time.slice(0, 5)} · {shift.location}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="ml-3 shrink-0 rounded-full p-1 text-gray-mid hover:text-charcoal"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <div className="px-5 py-4 space-y-4">
          {assignError ? (
            <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {assignError}
            </div>
          ) : null}
          <div className="flex items-center justify-between">
            <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${coveragePillClass(filled, shift.total_slots)}`}>
              {filled}/{shift.total_slots}{' '}
              {isOverstaffed ? `· ${over} over` : isFull ? 'covered' : `· ${open} open`}
            </span>
            <button
              type="button"
              onClick={onEdit}
              className="text-xs font-medium text-teal hover:underline"
            >
              Edit shift →
            </button>
          </div>

          {assignments.length > 0 ? (
            <div className="space-y-1">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-mid">Assigned</p>
              <ul className="divide-y divide-gray-border/60 rounded-lg border border-gray-border">
                {assignments.map((assignment) => {
                  const vol = volunteers.find((v) => v.id === assignment.volunteer_id)
                  return (
                    <li key={assignment.id} className="flex items-center justify-between gap-3 px-3 py-2">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-charcoal">
                          {vol?.name ?? 'Unknown volunteer'}
                        </p>
                        {vol ? (
                          <p className="truncate text-xs text-gray-text">{vol.email} · {vol.phone}</p>
                        ) : null}
                      </div>
                      <button
                        type="button"
                        disabled={busyId !== null}
                        onClick={() => void handleUnassign(assignment.volunteer_id)}
                        className="shrink-0 rounded-full border border-gray-border px-2.5 py-1 text-xs font-semibold text-red-500 transition-colors hover:border-red-300 hover:bg-red-50 disabled:opacity-40"
                      >
                        {busyId === assignment.volunteer_id ? '…' : 'Remove'}
                      </button>
                    </li>
                  )
                })}
              </ul>
            </div>
          ) : (
            <p className="text-sm text-gray-text italic">No volunteers assigned yet.</p>
          )}

          {!isFull ? (
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-mid">Add volunteer</p>
              <Command>
                <div className="relative">
                  <Command.Input
                    value={search}
                    onValueChange={setSearch}
                    placeholder="Search volunteers…"
                    className="w-full rounded-md border border-gray-border px-3 py-2 text-sm text-charcoal outline-none transition focus:border-teal focus:ring-2 focus:ring-teal/20"
                  />
                </div>
                <Command.List className="mt-1 max-h-48 overflow-y-auto rounded-lg border border-gray-border p-1">
                  <Command.Empty className="px-3 py-4 text-sm text-gray-text">
                    No matching volunteers.
                  </Command.Empty>
                  {unassignedVolunteers.map((vol) => (
                    <Command.Item
                      key={vol.id}
                      value={`${vol.name} ${vol.email} ${vol.phone}`}
                      onSelect={() => void handleAssign(vol.id)}
                      disabled={busyId !== null}
                      className="cursor-pointer rounded-md px-3 py-2 data-[selected=true]:bg-teal-50 data-[disabled=true]:opacity-40"
                    >
                      <div className="flex items-center gap-2">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 truncate font-medium text-charcoal text-sm">
                            <span className="truncate">{vol.name}</span>
                            {vol.availability.includes(shift.day) ? (
                              <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-700">
                                Available
                              </span>
                            ) : (
                              <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-700">
                                Outside availability
                              </span>
                            )}
                          </div>
                          <div className="truncate text-xs text-gray-text">{vol.email} · {vol.phone}</div>
                        </div>
                        {busyId === vol.id ? (
                          <span className="text-xs text-gray-mid">Adding…</span>
                        ) : null}
                      </div>
                    </Command.Item>
                  ))}
                </Command.List>
              </Command>
            </div>
          ) : (
            <p className="text-sm text-gray-text italic">
              Shift is full. Edit the shift to increase the slot count.
            </p>
          )}
        </div>

        <div className="flex justify-end border-t border-gray-border px-5 py-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-full bg-gray-light px-4 py-1.5 text-sm font-medium text-charcoal hover:bg-gray-border"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  )
}
