import { createClient } from '@/lib/supabase/server'

const CALENDAR_NAME = 'BSW Volunteer Shifts'
const EVENT_TIME_ZONE = 'America/Denver'

function padCalendarNumber(value: number) {
  return value.toString().padStart(2, '0')
}

function formatCalendarDate(day: string, time: string) {
  const [hours, minutes] = time.split(':').map(Number)
  return `${day.replace(/-/g, '')}T${padCalendarNumber(hours)}${padCalendarNumber(minutes)}00`
}

function formatUtcTimestamp(date: Date) {
  return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z')
}

function escapeCalendarText(value: string) {
  return value
    .replace(/\\/g, '\\\\')
    .replace(/\r\n/g, '\n')
    .replace(/\n/g, '\\n')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
}

function buildCalendarFile(
  assignments: Array<{
    id: string
    assigned_at: string | null
    shift: {
      role: string
      day: string
      start_time: string
      end_time: string
      location: string
      address: string | null
      notes: string | null
    } | null
  }>
) {
  const stamp = formatUtcTimestamp(new Date())

  const events = assignments
    .filter(
      (
        assignment
      ): assignment is {
        id: string
        assigned_at: string | null
        shift: {
          role: string
          day: string
          start_time: string
          end_time: string
          location: string
          address: string | null
          notes: string | null
        }
      } => Boolean(assignment.shift)
    )
    .sort((left, right) => {
      if (left.shift.day !== right.shift.day) return left.shift.day.localeCompare(right.shift.day)
      return left.shift.start_time.localeCompare(right.shift.start_time)
    })
    .map((assignment) => {
      const summary = escapeCalendarText(`BSW Volunteer Shift: ${assignment.shift.role}`)
      const locationParts = [assignment.shift.location, assignment.shift.address].filter(Boolean)
      const location = escapeCalendarText(locationParts.join(', '))
      const description = escapeCalendarText(
        [
          `Role: ${assignment.shift.role}`,
          `Location: ${assignment.shift.location}`,
          assignment.shift.address ? `Address: ${assignment.shift.address}` : null,
          assignment.shift.notes ? `Notes: ${assignment.shift.notes}` : null,
        ]
          .filter(Boolean)
          .join('\n')
      )
      const createdAt = assignment.assigned_at ? formatUtcTimestamp(new Date(assignment.assigned_at)) : stamp

      return [
        'BEGIN:VEVENT',
        `UID:${assignment.id}@revel-event-volunteer`,
        `DTSTAMP:${stamp}`,
        `DTSTART;TZID=${EVENT_TIME_ZONE}:${formatCalendarDate(assignment.shift.day, assignment.shift.start_time)}`,
        `DTEND;TZID=${EVENT_TIME_ZONE}:${formatCalendarDate(assignment.shift.day, assignment.shift.end_time)}`,
        `SUMMARY:${summary}`,
        `LOCATION:${location}`,
        `DESCRIPTION:${description}`,
        `CREATED:${createdAt}`,
        'STATUS:CONFIRMED',
        'END:VEVENT',
      ].join('\r\n')
    })

  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'PRODID:-//Revel Event Volunteer//BSW Volunteer Shifts//EN',
    `NAME:${CALENDAR_NAME}`,
    `X-WR-CALNAME:${CALENDAR_NAME}`,
    ...events,
    'END:VCALENDAR',
    '',
  ].join('\r\n')
}

export async function GET() {
  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return new Response('Unauthorized', { status: 401 })
  }

  const { data: volunteer, error: volunteerError } = await supabase
    .from('volunteers')
    .select('id')
    .eq('user_id', user.id)
    .maybeSingle()

  if (volunteerError) {
    return new Response(volunteerError.message, { status: 500 })
  }

  let assignments: Array<{
    id: string
    assigned_at: string | null
    shift: {
      role: string
      day: string
      start_time: string
      end_time: string
      location: string
      address: string | null
      notes: string | null
    } | null
  }> = []

  if (volunteer) {
    const { data, error: assignmentsError } = await supabase
      .from('volunteer_assignments')
      .select(
        `
          id,
          assigned_at,
          shift:volunteer_shifts (
            role,
            day,
            start_time,
            end_time,
            location,
            address,
            notes
          )
        `
      )
      .eq('volunteer_id', volunteer.id)
      .eq('status', 'assigned')

    if (assignmentsError) {
      return new Response(assignmentsError.message, { status: 500 })
    }

    assignments = data ?? []
  }

  const calendarFile = buildCalendarFile(assignments)

  return new Response(calendarFile, {
    headers: {
      'Content-Type': 'text/calendar; charset=utf-8',
      'Content-Disposition': 'attachment; filename="bsw-volunteer-shifts.ics"',
      'Cache-Control': 'no-store',
    },
  })
}
