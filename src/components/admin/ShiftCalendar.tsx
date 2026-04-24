'use client'

import FullCalendar from '@fullcalendar/react'
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin, { type DropArg } from '@fullcalendar/interaction'
import type {
  DateSelectArg,
  EventClickArg,
  EventDropArg,
  EventInput,
} from '@fullcalendar/core'
import type { EventResizeDoneArg } from '@fullcalendar/interaction'
import type { VolunteerShift, ShiftAssignment } from '@/lib/shifts/types'

interface ShiftCalendarProps {
  shifts: VolunteerShift[]
  assignments: ShiftAssignment[]
  onSelectSlot: (start: Date, end: Date) => void
  onClickShift: (shiftId: string) => void
  onMoveShift: (shiftId: string, start: Date, end: Date) => Promise<void>
  onDropVolunteer: (shiftId: string, volunteerId: string) => Promise<void>
}

function combineDayTime(day: string, time: string): string {
  // day 'YYYY-MM-DD', time 'HH:MM' or 'HH:MM:SS'
  const t = time.length === 5 ? `${time}:00` : time
  return `${day}T${t}`
}

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

function addDays(day: string, days: number): string {
  const date = new Date(`${day}T12:00:00`)
  date.setDate(date.getDate() + days)
  return toDateYMD(date)
}

export function ShiftCalendar({
  shifts,
  assignments,
  onSelectSlot,
  onClickShift,
  onMoveShift,
  onDropVolunteer,
}: ShiftCalendarProps) {
  const sortedShiftDays = [...new Set(shifts.map((shift) => shift.day))].sort((a, b) =>
    a.localeCompare(b)
  )
  const calendarStart = sortedShiftDays[0] ?? '2026-05-04'
  const calendarEnd = addDays(sortedShiftDays.at(-1) ?? '2026-05-08', 1)

  const events: EventInput[] = shifts.map((shift) => {
    const shiftAssignments = assignments.filter((a) => a.shift_id === shift.id)
    const filled = shift.filled_slots ?? shiftAssignments.length
    const isFull = filled >= shift.total_slots
    return {
      id: shift.id,
      title: `${shift.role} · ${filled}/${shift.total_slots}`,
      start: combineDayTime(shift.day, shift.start_time),
      end: combineDayTime(shift.day, shift.end_time),
      backgroundColor: isFull ? '#14b8a6' : '#f59e0b',
      borderColor: isFull ? '#0f766e' : '#d97706',
      textColor: '#ffffff',
      extendedProps: {
        role: shift.role,
        location: shift.location,
        filled,
        total: shift.total_slots,
        assignments: shiftAssignments,
      },
    }
  })

  const handleSelect = (arg: DateSelectArg) => {
    onSelectSlot(arg.start, arg.end)
  }

  const handleEventClick = (arg: EventClickArg) => {
    if (arg.event.id) onClickShift(arg.event.id)
  }

  const handleEventDrop = async (arg: EventDropArg) => {
    if (!arg.event.start || !arg.event.end) {
      arg.revert()
      return
    }
    try {
      await onMoveShift(arg.event.id, arg.event.start, arg.event.end)
    } catch {
      arg.revert()
    }
  }

  const handleEventResize = async (arg: EventResizeDoneArg) => {
    if (!arg.event.start || !arg.event.end) {
      arg.revert()
      return
    }
    try {
      await onMoveShift(arg.event.id, arg.event.start, arg.event.end)
    } catch {
      arg.revert()
    }
  }

  const handleExternalDrop = async (arg: DropArg) => {
    const volunteerId = arg.draggedEl.getAttribute('data-volunteer-id')
    if (!volunteerId) return

    // Find shift at this drop time - match by overlapping time
    const dropDate = arg.date
    const dropDay = toDateYMD(dropDate)
    const dropTime = toTimeHHMM(dropDate)

    const shift = shifts.find((s) => {
      if (s.day !== dropDay) return false
      const startT = s.start_time.slice(0, 5)
      const endT = s.end_time.slice(0, 5)
      return dropTime >= startT && dropTime < endT
    })

    if (!shift) {
      alert('Drop the volunteer directly onto an existing shift block.')
      return
    }

    try {
      await onDropVolunteer(shift.id, volunteerId)
    } catch (err) {
      console.error('Failed to assign volunteer:', err)
    }
  }

  return (
    <div className="card">
      <FullCalendar
        plugins={[timeGridPlugin, interactionPlugin]}
        initialView="timeGridWeek"
        initialDate={calendarStart}
        validRange={{ start: calendarStart, end: calendarEnd }}
        weekends={true}
        headerToolbar={{
          left: 'prev,next today',
          center: 'title',
          right: 'timeGridWeek,timeGridDay',
        }}
        slotMinTime="06:00:00"
        slotMaxTime="22:00:00"
        allDaySlot={false}
        height="auto"
        selectable={true}
        selectMirror={true}
        editable={true}
        droppable={true}
        events={events}
        select={handleSelect}
        eventClick={handleEventClick}
        eventDrop={handleEventDrop}
        eventResize={handleEventResize}
        drop={handleExternalDrop}
        eventContent={(arg) => {
          const { role, location, filled, total } = arg.event.extendedProps as {
            role: string
            location: string
            filled: number
            total: number
          }
          return (
            <div className="p-1 text-xs leading-tight overflow-hidden">
              <div className="font-semibold truncate">{role}</div>
              <div className="truncate opacity-90">{location}</div>
              <div className="opacity-90">
                {filled}/{total} filled
              </div>
            </div>
          )
        }}
      />
    </div>
  )
}
