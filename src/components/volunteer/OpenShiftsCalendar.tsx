'use client'

import FullCalendar from '@fullcalendar/react'
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin from '@fullcalendar/interaction'
import type { EventClickArg, EventInput } from '@fullcalendar/core'
import { useEffect, useMemo, useRef } from 'react'
import type { AssignmentStatus } from '@/lib/shifts/types'

interface VolunteerShift {
  id: string
  role: string
  day: string
  start_time: string
  end_time: string
  location: string
  total_slots: number
  filled_slots: number
}

interface OpenShiftsCalendarProps {
  shifts: VolunteerShift[]
  activeDay: string
  availableDays: string[]
  assignmentStatusByShiftId: Map<string, AssignmentStatus>
  onActiveDayChange: (day: string) => void
  onSelectShift: (shiftId: string) => void
}

function combineDayTime(day: string, time: string): string {
  const normalizedTime = time.length === 5 ? `${time}:00` : time
  return `${day}T${normalizedTime}`
}

function getShiftState(
  shift: VolunteerShift,
  relationshipStatus: AssignmentStatus | null
): 'assigned' | 'requested' | 'full' | 'open' {
  if (relationshipStatus === 'assigned') return 'assigned'
  if (relationshipStatus === 'requested') return 'requested'
  if (shift.filled_slots >= shift.total_slots) return 'full'
  return 'open'
}

function getEventColors(state: ReturnType<typeof getShiftState>) {
  switch (state) {
    case 'assigned':
      return {
        backgroundColor: '#6aa9ae',
        borderColor: '#4d8f93',
        textColor: '#ffffff',
      }
    case 'requested':
      return {
        backgroundColor: '#ef8f3d',
        borderColor: '#d97706',
        textColor: '#ffffff',
      }
    case 'full':
      return {
        backgroundColor: '#b9c1ca',
        borderColor: '#8d94a0',
        textColor: '#ffffff',
      }
    default:
      return {
        backgroundColor: '#eef8f8',
        borderColor: '#6aa9ae',
        textColor: '#31585c',
      }
  }
}

export function OpenShiftsCalendar({
  shifts,
  activeDay,
  availableDays,
  assignmentStatusByShiftId,
  onActiveDayChange,
  onSelectShift,
}: OpenShiftsCalendarProps) {
  const calendarRef = useRef<FullCalendar | null>(null)

  const events = useMemo<EventInput[]>(
    () =>
      shifts.map((shift) => {
        const openSpots = Math.max(0, shift.total_slots - shift.filled_slots)
        const relationshipStatus = assignmentStatusByShiftId.get(shift.id) ?? null
        const state = getShiftState(shift, relationshipStatus)
        const colors = getEventColors(state)

        return {
          id: shift.id,
          title: shift.role,
          start: combineDayTime(shift.day, shift.start_time),
          end: combineDayTime(shift.day, shift.end_time),
          ...colors,
          extendedProps: {
            location: shift.location,
            openSpots,
            totalSlots: shift.total_slots,
            relationshipStatus,
            state,
          },
        }
      }),
    [assignmentStatusByShiftId, shifts]
  )

  useEffect(() => {
    if (!activeDay) return
    calendarRef.current?.getApi().gotoDate(activeDay)
  }, [activeDay])

  const selectedDayIndex = availableDays.indexOf(activeDay)
  const canGoPrev = selectedDayIndex > 0
  const canGoNext = selectedDayIndex >= 0 && selectedDayIndex < availableDays.length - 1

  const handleEventClick = (arg: EventClickArg) => {
    const shift = shifts.find((item) => item.id === arg.event.id)
    if (shift) {
      onActiveDayChange(shift.day)
    }
    onSelectShift(arg.event.id)
  }

  return (
    <section className="mb-6 rounded-xl border border-[#dbe7e8] bg-white p-4 shadow-[0_1px_2px_rgba(26,26,26,0.05)] sm:p-5">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2
            className="text-2xl font-semibold text-[#3f4a56]"
            style={{ fontFamily: 'var(--font-accent)' }}
          >
            Calendar View
          </h2>
          <p className="mt-1 text-sm text-[#6f7883]">
            Scan open shifts by day, then click any block to preview and request it.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => canGoPrev && onActiveDayChange(availableDays[selectedDayIndex - 1])}
            disabled={!canGoPrev}
            className="rounded-full border border-[#d8dde3] px-3 py-1.5 text-sm font-medium text-[#505966] transition hover:border-[#6aa9ae] hover:text-[#6aa9ae] disabled:cursor-not-allowed disabled:opacity-40"
          >
            Previous day
          </button>
          <button
            type="button"
            onClick={() => canGoNext && onActiveDayChange(availableDays[selectedDayIndex + 1])}
            disabled={!canGoNext}
            className="rounded-full border border-[#d8dde3] px-3 py-1.5 text-sm font-medium text-[#505966] transition hover:border-[#6aa9ae] hover:text-[#6aa9ae] disabled:cursor-not-allowed disabled:opacity-40"
          >
            Next day
          </button>
        </div>
      </div>

      <div className="mb-4 flex flex-wrap gap-2 text-xs font-medium text-[#5f6772]">
        <span className="rounded-full bg-[#eef8f8] px-3 py-1 text-[#31585c]">Open</span>
        <span className="rounded-full bg-[#ef8f3d] px-3 py-1 text-white">Requested</span>
        <span className="rounded-full bg-[#6aa9ae] px-3 py-1 text-white">Assigned</span>
        <span className="rounded-full bg-[#b9c1ca] px-3 py-1 text-white">Full</span>
      </div>

      <div className="overflow-hidden rounded-lg border border-[#e7ebef]">
        <FullCalendar
          ref={calendarRef}
          plugins={[timeGridPlugin, interactionPlugin]}
          initialView="timeGridDay"
          initialDate={activeDay}
          headerToolbar={false}
          allDaySlot={false}
          height="auto"
          slotMinTime="06:00:00"
          slotMaxTime="22:00:00"
          dayHeaderFormat={{ weekday: 'long', month: 'short', day: 'numeric' }}
          validRange={
            availableDays.length > 0
              ? {
                  start: availableDays[0],
                  end: `${availableDays[availableDays.length - 1]}T23:59:59`,
                }
              : undefined
          }
          events={events}
          eventClick={handleEventClick}
          eventContent={(arg) => {
            const { location, openSpots, totalSlots, state } = arg.event.extendedProps as {
              location: string
              openSpots: number
              totalSlots: number
              state: 'assigned' | 'requested' | 'full' | 'open'
            }

            return (
              <div className="px-2 py-1 text-xs leading-tight">
                <div className="truncate font-semibold">{arg.event.title}</div>
                <div className="truncate opacity-90">{location}</div>
                <div className="opacity-90">
                  {state === 'full' ? 'Shift full' : `${openSpots} of ${totalSlots} spots open`}
                </div>
              </div>
            )
          }}
        />
      </div>
    </section>
  )
}
