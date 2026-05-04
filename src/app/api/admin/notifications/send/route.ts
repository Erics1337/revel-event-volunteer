import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { isAdmin } from '@/lib/auth/roles'
import { sendBulkMessage } from '@/lib/notifications/dispatcher'
import { DEFAULT_REMINDER_SETTINGS } from '@/lib/notifications/reminder-settings'

function getTimeZoneOffsetMilliseconds(date: Date, timeZone: string) {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  })

  const parts = formatter.formatToParts(date)
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]))
  const asUtc = Date.UTC(
    Number(values.year),
    Number(values.month) - 1,
    Number(values.day),
    Number(values.hour),
    Number(values.minute),
    Number(values.second)
  )

  return asUtc - date.getTime()
}

function getStartOfDaySchedule(day: string, timeZone: string) {
  const guess = new Date(`${day}T00:00:00Z`)
  const offset = getTimeZoneOffsetMilliseconds(guess, timeZone)
  return new Date(guess.getTime() - offset).toISOString()
}

export async function POST(request: Request) {
  const supabase = await createClient()

  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || !isAdmin(profile.role)) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const { volunteerIds, subject, message, filters } = await request.json()

    if ((!volunteerIds || volunteerIds.length === 0) && !filters) {
      return NextResponse.json({ error: 'No recipients specified' }, { status: 400 })
    }

    if (!subject || !message) {
      return NextResponse.json({ error: 'Subject and message are required' }, { status: 400 })
    }

    let targetVolunteerIds = volunteerIds || []

    if (filters && !volunteerIds) {
      if (filters.shiftIds && filters.shiftIds.length > 0) {
        const { data: assignments } = await supabase
          .from('volunteer_assignments')
          .select('volunteer_id')
          .in('shift_id', filters.shiftIds)
          .eq('status', 'assigned')
        
        if (assignments) {
          targetVolunteerIds = assignments.map(a => a.volunteer_id)
        }
      }
    }

    if (targetVolunteerIds.length === 0) {
      return NextResponse.json({ error: 'No volunteers found matching criteria' }, { status: 400 })
    }

    const scheduledFor =
      typeof filters?.day === 'string'
        ? getStartOfDaySchedule(filters.day, DEFAULT_REMINDER_SETTINGS.time_zone)
        : undefined

    const result = await sendBulkMessage(targetVolunteerIds, subject, message, {
      scheduledFor,
      deliveryScope: scheduledFor
        ? 'scheduled_day'
        : targetVolunteerIds.length === 1
          ? 'direct'
          : 'bulk',
    })

    return NextResponse.json({
      success: true,
      sent: result.sent,
      failed: result.failed,
      queued: result.queued,
      total: targetVolunteerIds.length,
      scheduledFor: result.scheduledFor,
    })
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}
