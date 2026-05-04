/* eslint-disable @typescript-eslint/no-explicit-any */
import type { SupabaseClient } from '@supabase/supabase-js'
import { createAdminClient, createClient } from '@/lib/supabase/server'
import type { Database } from '@/lib/supabase/database.types'
import { sendEmail } from './resend'
import {
  volunteerConfirmationTemplate,
  reminder24hTemplate,
  reminder1hTemplate,
  adminBulkMessageTemplate,
} from './templates'
import { getReminderRules, getReminderSettings, type ReminderRule } from './reminder-settings'

interface Shift {
  id: string
  role: string
  day: string
  start_time: string
  end_time: string
  location: string
  address?: string | null
}

interface Volunteer {
  id: string
  user_id: string | null
  name: string
  email: string
}

interface Notification {
  id: string
  user_id: string | null
  recipient_email: string | null
  delivery_scope: string | null
  type: string
  subject: string
  body: string
  sent_at: string | null
  status: string
  error_message: string | null
  shift_id: string | null
  scheduled_for: string
  created_at: string
}

interface EligibleAssignment {
  volunteer_id: string
  shift_id: string
  status: string
  volunteer: {
    id: string
    user_id: string | null
    fallback_name?: string | null
    fallback_email?: string | null
    status?: string
    user: {
      name?: string
      email?: string
    } | null
  } | null
  shift: Shift | null
}

function resolveVolunteerContact(volunteer: EligibleAssignment['volunteer']): Volunteer | null {
  if (!volunteer) return null

  return {
    id: volunteer.id,
    user_id: volunteer.user_id ?? null,
    name: volunteer.user?.name || volunteer.fallback_name || 'Volunteer',
    email: volunteer.user?.email || volunteer.fallback_email || '',
  }
}

interface ReminderDispatchCounts {
  queued: number
  sent: number
  failed: number
  skipped: number
}

export interface ReminderDispatchResult {
  settings: Awaited<ReturnType<typeof getReminderSettings>>
  now: string
  counts: {
    reminder_24h: ReminderDispatchCounts
    reminder_1h: ReminderDispatchCounts
  }
  queued: number
  sent: number
  failed: number
  skipped: number
}

const notificationsTable = (supabase: SupabaseClient<Database>) => supabase.from('notifications')

function createEmptyReminderCounts(): ReminderDispatchCounts {
  return {
    queued: 0,
    sent: 0,
    failed: 0,
    skipped: 0,
  }
}

function getReminderTemplate(ruleType: ReminderRule['type'], shift: Shift, volunteer: Volunteer) {
  return ruleType === 'reminder_24h'
    ? reminder24hTemplate(shift, volunteer)
    : reminder1hTemplate(shift, volunteer)
}

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

function zonedDateTimeToUtc(day: string, time: string, timeZone: string) {
  const normalizedTime = time.length === 5 ? `${time}:00` : time
  const guess = new Date(`${day}T${normalizedTime}Z`)
  const offset = getTimeZoneOffsetMilliseconds(guess, timeZone)
  return new Date(guess.getTime() - offset)
}

function getImmediateSchedule() {
  return new Date().toISOString()
}

function isReminderDue(
  shift: Shift,
  rule: ReminderRule,
  now: Date,
  timeZone: string,
  sendWindowMinutes: number
) {
  if (!rule.enabled) return false

  const shiftStart = zonedDateTimeToUtc(shift.day, shift.start_time, timeZone)
  const reminderAt = new Date(shiftStart.getTime() - rule.hoursBefore * 60 * 60 * 1000)
  const windowStart = new Date(now.getTime() - sendWindowMinutes * 60 * 1000)

  return reminderAt > windowStart && reminderAt <= now
}

async function getEligibleAssignments(supabase: SupabaseClient<Database>) {
  const { data, error } = await supabase
    .from('volunteer_assignments')
    .select(`
      volunteer_id,
      shift_id,
      status,
      volunteer:volunteers(id, user_id, fallback_name, fallback_email, status, user:users(name, email)),
      shift:volunteer_shifts(id, role, day, start_time, end_time, location, address)
    `)
    .eq('status', 'assigned')
    .not('volunteer', 'is', null)
    .not('shift', 'is', null)

  if (error) {
    throw new Error(error.message)
  }

  return (data || []) as EligibleAssignment[]
}

export async function queueConfirmation(volunteerId: string, shiftId: string): Promise<Notification | null> {
  const supabase = await createClient()

  const { data: volunteerData } = await supabase
    .from('volunteers')
    .select(`
      id,
      user_id,
      fallback_name,
      fallback_email,
      user:users(name, email)
    `)
    .eq('id', volunteerId)
    .single()

  const { data: shift } = await supabase
    .from('volunteer_shifts')
    .select('*')
    .eq('id', shiftId)
    .single()

  if (!volunteerData || !shift) {
    throw new Error('Volunteer or shift not found')
  }

  const volunteer = volunteerData as any
  const user = volunteer.user as any
  const email = user?.email || volunteer.fallback_email || ''
  if (!email) throw new Error('Volunteer is missing an email address')

  const template = volunteerConfirmationTemplate(shift as Shift, {
    name: user?.name || volunteer.fallback_name || 'Volunteer',
    email,
  })

  const { data: notification } = await notificationsTable(supabase)
    .insert({
      user_id: volunteer.user_id,
      recipient_email: email,
      delivery_scope: 'confirmation',
      type: 'volunteer_confirmation',
      subject: template.subject,
      body: template.html,
      shift_id: shiftId,
      scheduled_for: getImmediateSchedule(),
    } as any)
    .select()
    .single()

  return notification as Notification
}

export async function queueReminders24h(): Promise<Notification[]> {
  await runReminderDispatch({ sendImmediately: false })
  return []
}

export async function queueReminders1h(): Promise<Notification[]> {
  await runReminderDispatch({ sendImmediately: false })
  return []
}

export async function sendPendingNotifications(supabaseOverride?: SupabaseClient<Database>) {
  const supabase = supabaseOverride ?? (await createClient())
  const results = [] as { id: string; success: boolean; error?: string }[]
  const nowIso = new Date().toISOString()

  while (true) {
    const { data: pending, error } = await notificationsTable(supabase)
      .select(`
        id,
        user_id,
        recipient_email,
        subject,
        body,
        scheduled_for,
        user:user_id(email)
      `)
      .eq('status', 'pending')
      .lte('scheduled_for', nowIso)
      .order('scheduled_for', { ascending: true })
      .limit(100)

    if (error) {
      throw new Error(error.message)
    }

    if (!pending || pending.length === 0) {
      break
    }

    for (const notification of pending as any[]) {
      const email = notification.recipient_email || notification.user?.email
      if (!email) {
        const error = 'Notification is missing a recipient email address'
        await notificationsTable(supabase)
          .update({
            status: 'failed',
            sent_at: null,
            error_message: error,
          })
          .eq('id', notification.id)

        results.push({ id: notification.id, success: false, error })
        continue
      }

      const result = await sendEmail({
        to: email,
        subject: notification.subject,
        html: notification.body,
      })

      await notificationsTable(supabase)
        .update({
          status: result.success ? 'sent' : 'failed',
          sent_at: result.success ? new Date().toISOString() : null,
          error_message: result.error || null,
        })
        .eq('id', notification.id)

      results.push({ id: notification.id, success: result.success, error: result.error })
    }
  }

  return results
}

export async function previewReminderDispatch(supabaseOverride?: SupabaseClient<Database>) {
  const supabase = supabaseOverride ?? createAdminClient()
  const settings = await getReminderSettings(supabase)
  const rules = getReminderRules(settings)
  const now = new Date()
  const assignments = await getEligibleAssignments(supabase)
  const counts = {
    reminder_24h: createEmptyReminderCounts(),
    reminder_1h: createEmptyReminderCounts(),
  }

  for (const assignment of assignments) {
    if (!assignment.shift || !assignment.volunteer || assignment.volunteer.status !== 'confirmed') {
      continue
    }

    for (const rule of rules) {
      if (
        isReminderDue(
          assignment.shift,
          rule,
          now,
          settings.time_zone,
          settings.send_window_minutes
        )
      ) {
        counts[rule.type].queued += 1
      }
    }
  }

  return {
    settings,
    now: now.toISOString(),
    counts,
  }
}

export async function runReminderDispatch(options?: {
  supabase?: SupabaseClient<Database>
  sendImmediately?: boolean
  now?: Date
}) {
  const supabase = options?.supabase ?? createAdminClient()
  const sendImmediately = options?.sendImmediately ?? true
  const now = options?.now ?? new Date()
  const settings = await getReminderSettings(supabase)
  const rules = getReminderRules(settings)
  const assignments = await getEligibleAssignments(supabase)
  const counts = {
    reminder_24h: createEmptyReminderCounts(),
    reminder_1h: createEmptyReminderCounts(),
  }

  for (const assignment of assignments) {
    if (!assignment.shift || !assignment.volunteer) {
      continue
    }

    if (assignment.volunteer.status !== 'confirmed') {
      continue
    }

    const volunteer = resolveVolunteerContact(assignment.volunteer)

    if (!volunteer?.email) {
      continue
    }

    for (const rule of rules) {
      if (
        !isReminderDue(
          assignment.shift,
          rule,
          now,
          settings.time_zone,
          settings.send_window_minutes
        )
      ) {
        continue
      }

      let existingQuery = notificationsTable(supabase)
        .select('id')
        .eq('shift_id', assignment.shift.id)
        .eq('type', rule.type)

      existingQuery = volunteer.user_id
        ? existingQuery.eq('user_id', volunteer.user_id)
        : existingQuery.is('user_id', null)

      const { data: existing, error: existingError } = await existingQuery
        .maybeSingle()

      if (existingError) {
        throw new Error(existingError.message)
      }

      if (existing) {
        counts[rule.type].skipped += 1
        continue
      }

      const template = getReminderTemplate(rule.type, assignment.shift, volunteer)
      const { data: notification, error: insertError } = await notificationsTable(supabase)
        .insert({
          user_id: volunteer.user_id,
          recipient_email: volunteer.email,
          delivery_scope: 'reminder',
          type: rule.type,
          subject: template.subject,
          body: template.html,
          shift_id: assignment.shift.id,
          scheduled_for: getImmediateSchedule(),
        } as any)
        .select()
        .single()

      if (insertError) {
        throw new Error(insertError.message)
      }

      if (notification) {
        counts[rule.type].queued += 1
      }
    }
  }

  let sent = [] as { id: string; success: boolean; error?: string }[]
  if (sendImmediately) {
    sent = await sendPendingNotifications(supabase)
  }

  const successCount = sent.filter((entry) => entry.success).length
  const failedCount = sent.filter((entry) => !entry.success).length

  return {
    settings,
    now: now.toISOString(),
    counts: {
      reminder_24h: {
        ...counts.reminder_24h,
        sent:
          counts.reminder_24h.queued === 0
            ? 0
            : Math.min(counts.reminder_24h.queued, successCount),
        failed:
          counts.reminder_24h.queued === 0
            ? 0
            : Math.min(counts.reminder_24h.queued, failedCount),
      },
      reminder_1h: {
        ...counts.reminder_1h,
        sent:
          counts.reminder_1h.queued === 0
            ? 0
            : Math.max(0, successCount - counts.reminder_24h.queued),
        failed:
          counts.reminder_1h.queued === 0
            ? 0
            : Math.max(0, failedCount - counts.reminder_24h.failed),
      },
    },
    queued: counts.reminder_24h.queued + counts.reminder_1h.queued,
    sent: successCount,
    failed: failedCount,
    skipped: counts.reminder_24h.skipped + counts.reminder_1h.skipped,
  } satisfies ReminderDispatchResult
}

export async function sendBulkMessage(
  volunteerIds: string[],
  subject: string,
  message: string,
  options?: {
    scheduledFor?: string
    deliveryScope?: 'direct' | 'bulk' | 'scheduled_day'
  }
) {
  const supabase = await createClient()

  const { data: volunteers } = await supabase
    .from('volunteers')
    .select(`
      id,
      user_id,
      fallback_email,
      user:users(email)
    `)
    .in('id', [...new Set(volunteerIds)])

  if (!volunteers) {
    return {
      sent: 0,
      failed: 0,
      queued: 0,
      scheduledFor: options?.scheduledFor ?? getImmediateSchedule(),
    }
  }

  const template = adminBulkMessageTemplate(subject, message, 'Boulder Startup Week 2026')
  let sent = 0
  let failed = 0
  let queued = 0
  const scheduledFor = options?.scheduledFor ?? getImmediateSchedule()
  const sendImmediately = !options?.scheduledFor
  const deliveryScope = options?.deliveryScope ?? (volunteers.length === 1 ? 'direct' : 'bulk')

  for (const volunteerData of volunteers) {
    const volunteer = volunteerData as any
    const email = volunteer.user?.email || volunteer.fallback_email
    if (!email) {
      failed++
      continue
    }

    const { data: notification } = await notificationsTable(supabase)
      .insert({
        user_id: volunteer.user_id,
        recipient_email: email,
        delivery_scope: deliveryScope,
        type: 'admin_message',
        subject: template.subject,
        body: template.html,
        scheduled_for: scheduledFor,
      } as any)
      .select()
      .single()

    if (notification && sendImmediately) {
      const result = await sendEmail({
        to: email,
        subject: template.subject,
        html: template.html,
        text: template.text,
      })

      await notificationsTable(supabase)
        .update({
          status: result.success ? 'sent' : 'failed',
          sent_at: result.success ? new Date().toISOString() : null,
          error_message: result.error || null,
        })
        .eq('id', notification.id)

      if (result.success) sent++
      else failed++
    } else if (notification) {
      queued++
    }
  }

  return { sent, failed, queued, scheduledFor }
}

export async function queueTestReminderEmail(options: {
  userId: string | null
  email: string
  name?: string | null
  scheduledFor?: Date
}) {
  const supabase = await createClient()
  const scheduledFor = options.scheduledFor ?? new Date()
  const testShift: Shift = {
    id: 'test-reminder',
    role: 'Test Volunteer Reminder',
    day: '2026-05-04',
    start_time: '09:00',
    end_time: '10:00',
    location: 'Reminder Test',
    address: 'This is a test email from the volunteer admin reminder system.',
  }
  const template = reminder1hTemplate(testShift, {
    name: options.name || 'Admin',
    email: options.email,
  })

  const { data: notification, error } = await notificationsTable(supabase)
    .insert({
      user_id: options.userId,
      recipient_email: options.email,
      delivery_scope: 'test',
      type: 'admin_message',
      subject: `[Test] ${template.subject}`,
      body: template.html,
      scheduled_for: scheduledFor.toISOString(),
    } as any)
    .select()
    .single()

  if (error) {
    throw new Error(error.message)
  }

  return {
    id: notification?.id as string,
    recipientEmail: options.email,
    scheduledFor: scheduledFor.toISOString(),
  }
}

export async function sendReminder24hForShiftIds(shiftIds?: string[]) {
  const supabase = await createClient()

  let query = supabase
    .from('volunteer_assignments')
    .select(`
      volunteer_id,
      shift_id,
      status,
      volunteer:volunteers(id, user_id, fallback_name, fallback_email, status, user:users(name, email)),
      shift:volunteer_shifts(id, role, day, start_time, end_time, location, address)
    `)
    .eq('status', 'assigned')
    .not('volunteer', 'is', null)
    .not('shift', 'is', null)

  if (shiftIds && shiftIds.length > 0) {
    query = query.in('shift_id', shiftIds)
  }

  const { data: assignments } = await query

  if (!assignments) return { sent: 0, failed: 0, skipped: 0 }

  let sent = 0
  let failed = 0
  let skipped = 0

  for (const assignment of assignments) {
    const assignmentAny = assignment as any
    if (!assignmentAny.shift || !assignmentAny.volunteer) {
      skipped++
      continue
    }

    if (assignmentAny.volunteer.status !== 'confirmed') {
      skipped++
      continue
    }

    const shift = assignmentAny.shift as Shift
    const volunteer = resolveVolunteerContact(assignmentAny.volunteer)

    if (!volunteer?.email) {
      failed++
      continue
    }

    let existingQuery = notificationsTable(supabase)
      .select('id')
      .eq('shift_id', shift.id)
      .eq('type', 'reminder_24h')

    existingQuery = volunteer.user_id
      ? existingQuery.eq('user_id', volunteer.user_id)
      : existingQuery.is('user_id', null)

    const { data: existing } = await existingQuery
      .maybeSingle()

    if (existing) {
      skipped++
      continue
    }

    const template = reminder24hTemplate(shift, volunteer)

    const { data: notification } = await notificationsTable(supabase)
      .insert({
        user_id: volunteer.user_id,
        recipient_email: volunteer.email,
        delivery_scope: 'reminder',
        type: 'reminder_24h',
        subject: template.subject,
        body: template.html,
        shift_id: shift.id,
        scheduled_for: getImmediateSchedule(),
      } as any)
      .select()
      .single()

    if (!notification) {
      failed++
      continue
    }

    const result = await sendEmail({
      to: volunteer.email,
      subject: template.subject,
      html: template.html,
      text: template.text,
    })

    await notificationsTable(supabase)
      .update({
        status: result.success ? 'sent' : 'failed',
        sent_at: result.success ? new Date().toISOString() : null,
        error_message: result.error || null,
      })
      .eq('id', notification.id)

    if (result.success) sent++
    else failed++
  }

  return { sent, failed, skipped }
}
