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
  address?: string | null
  total_slots: number
  filled_slots: number
  urgent: boolean
  notes?: string | null
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
): 'assigned' | 'full' | 'open' {
  if (relationshipStatus === 'assigned') return 'assigned'
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
            address: shift.address,
            openSpots,
            totalSlots: shift.total_slots,
            urgent: shift.urgent,
            relationshipStatus,
            state,
          },
        }
      }),
    [assignmentStatusByShiftId, shifts]
  )

  useEffect(() => {
    if (!activeDay) return
    window.setTimeout(() => {
      calendarRef.current?.getApi().gotoDate(activeDay)
    }, 0)
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
            Browse by day and click any shift to preview and request it.
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
        <span className="rounded-full bg-[#6aa9ae] px-3 py-1 text-white">Your assigned shifts</span>
        <span className="rounded-full bg-[#b9c1ca] px-3 py-1 text-white">Full shifts</span>
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
            const { location, state } = arg.event.extendedProps as {
              location: string
              state: 'assigned' | 'full' | 'open'
            }

            return (
              <div className="px-2 py-1 text-xs leading-tight">
                <div className="truncate font-semibold">{arg.event.title}</div>
                <div className="truncate opacity-90">{location}</div>
                {state === 'full' && (
                  <div className="opacity-90">Full</div>
                )}
              </div>
            )
          }}
        />
      </div>
    </section>
  )
}
