'use client'

import { useMemo, useState } from 'react'
import { ShiftCalendar } from '@/components/admin/ShiftCalendar'
import { ShiftModal } from '@/components/admin/ShiftModal'
import { VolunteerPool } from '@/components/admin/VolunteerPool'
import { useShiftAdminData } from '@/components/admin/useShiftAdminData'
import type { VolunteerShift } from '@/lib/shifts/types'

type ModalState =
  | { kind: 'closed' }
  | { kind: 'create'; start: Date; end: Date }
  | { kind: 'edit'; shift: VolunteerShift }

function toTimeHHMM(date: Date): string {
  const h = String(date.getHours()).padStart(2, '0')
  const m = String(date.getMinutes()).padStart(2, '0')
  return `${h}:${m}`
}

function toDateYMD(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export default function AdminShiftsCalendarPage() {
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
    assignVolunteer,
    unassignVolunteer,
  } = useShiftAdminData()
  const [modal, setModal] = useState<ModalState>({ kind: 'closed' })

  const modalAssignments = useMemo(() => {
    if (modal.kind !== 'edit') return []
    return assignments.filter((assignment) => assignment.shift_id === modal.shift.id)
  }, [assignments, modal])

  const handleClickShift = (shiftId: string) => {
    const shift = shifts.find((entry) => entry.id === shiftId)
    if (shift) setModal({ kind: 'edit', shift })
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

      <div className="flex items-center justify-between">
        <p className="text-gray-text">
          Click an empty slot to create a shift. Drag shifts to reschedule. Drag a volunteer onto
          a shift to assign.
        </p>
        <button
          onClick={() =>
            setModal({
              kind: 'create',
              start: new Date('2026-05-04T09:00:00'),
              end: new Date('2026-05-04T11:00:00'),
            })
          }
          className="bg-teal-500 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-teal-600"
        >
          + New Shift
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
        <ShiftCalendar
          shifts={shifts}
          assignments={assignments}
          onSelectSlot={(start, end) => setModal({ kind: 'create', start, end })}
          onClickShift={handleClickShift}
          onMoveShift={(shiftId, start, end) =>
            updateShift(shiftId, {
              role: shifts.find((shift) => shift.id === shiftId)?.role || '',
              day: toDateYMD(start),
              start_time: toTimeHHMM(start),
              end_time: toTimeHHMM(end),
              location: shifts.find((shift) => shift.id === shiftId)?.location || '',
              address: shifts.find((shift) => shift.id === shiftId)?.address ?? '',
              total_slots: shifts.find((shift) => shift.id === shiftId)?.total_slots || 1,
              notes: shifts.find((shift) => shift.id === shiftId)?.notes ?? '',
            })
          }
          onDropVolunteer={assignVolunteer}
        />
        <VolunteerPool volunteers={volunteers} />
      </div>

      {modal.kind === 'create' ? (
        <ShiftModal
          mode="create"
          initial={{
            day: toDateYMD(modal.start),
            start_time: toTimeHHMM(modal.start),
            end_time: toTimeHHMM(modal.end),
          }}
          venues={venues}
          onClose={() => setModal({ kind: 'closed' })}
          onSave={createShift}
          onCreateVenue={createVenue}
          onUpdateVenue={updateVenue}
        />
      ) : null}

      {modal.kind === 'edit' ? (
        <ShiftModal
          mode="edit"
          initial={modal.shift}
          assignments={modalAssignments}
          volunteers={volunteers}
          venues={venues}
          onClose={() => setModal({ kind: 'closed' })}
          onSave={(values) => updateShift(modal.shift.id, values)}
          onCreateVenue={createVenue}
          onUpdateVenue={updateVenue}
          onDelete={() => deleteShift(modal.shift.id)}
          onAssign={(volunteerId) => assignVolunteer(modal.shift.id, volunteerId)}
          onUnassign={(volunteerId) => unassignVolunteer(modal.shift.id, volunteerId)}
        />
      ) : null}
    </div>
  )
}
