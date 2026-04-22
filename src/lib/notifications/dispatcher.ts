/* eslint-disable @typescript-eslint/no-explicit-any */
import { createClient } from '@/lib/supabase/server'
import { sendEmail } from './resend'
import {
  volunteerConfirmationTemplate,
  reminder24hTemplate,
  reminder1hTemplate,
  adminBulkMessageTemplate,
} from './templates'

interface Shift {
  id: string
  role: string
  day: string
  start_time: string
  end_time: string
  location: string
}

interface Volunteer {
  id: string
  user_id: string | null
  name: string
  email: string
}

interface Notification {
  id: string
  user_id: string
  type: string
  subject: string
  body: string
  sent_at: string | null
  status: string
  error_message: string | null
  shift_id: string | null
  created_at: string
}

// Helper to access notifications table before types are generated
const notificationsTable = (supabase: any) => supabase.from('notifications')

export async function queueConfirmation(volunteerId: string, shiftId: string): Promise<Notification | null> {
  const supabase = await createClient()

  const { data: volunteerData } = await supabase
    .from('volunteers')
    .select(`
      id,
      user_id,
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

  if (!volunteer.user_id) {
    throw new Error('Volunteer is missing a linked user record')
  }

  const template = volunteerConfirmationTemplate(shift as Shift, {
    name: user?.name || 'Volunteer',
    email: user?.email || '',
  })

  const { data: notification } = await notificationsTable(supabase)
    .insert({
      user_id: volunteer.user_id,
      type: 'volunteer_confirmation',
      subject: template.subject,
      body: template.html,
      shift_id: shiftId,
    })
    .select()
    .single()

  return notification as Notification
}

export async function queueReminders24h(): Promise<Notification[]> {
  const supabase = await createClient()

  const { data: assignments } = await supabase
    .from('volunteer_assignments')
    .select(`
      volunteer_id,
      shift_id,
      status,
      volunteer:volunteers(id, user_id, user:users(name, email)),
      shift:volunteer_shifts(id, role, day, start_time, end_time, location)
    `)
    .eq('status', 'assigned')
    .not('volunteer', 'is', null)
    .not('shift', 'is', null)

  if (!assignments) return []

  const notifications = []

  for (const assignment of assignments) {
    const assignmentAny = assignment as any
    if (!assignmentAny.shift || !assignmentAny.volunteer) continue

    const shift = assignmentAny.shift as Shift
    const volunteerUser = assignmentAny.volunteer.user as any
    const volunteer: Volunteer = {
      id: assignmentAny.volunteer.id,
      user_id: assignmentAny.volunteer.user_id ?? null,
      name: volunteerUser?.name || 'Volunteer',
      email: volunteerUser?.email || ''
    }

    if (!volunteer.user_id) continue

    const { data: existing } = await notificationsTable(supabase)
      .select('id')
      .eq('shift_id', shift.id)
      .eq('user_id', volunteer.user_id)
      .eq('type', 'reminder_24h')
      .maybeSingle()

    if (existing) continue

    const template = reminder24hTemplate(shift, volunteer)

    const { data: notification } = await notificationsTable(supabase)
      .insert({
        user_id: volunteer.user_id,
        type: 'reminder_24h',
        subject: template.subject,
        body: template.html,
        shift_id: shift.id,
      })
      .select()
      .single()

    if (notification) notifications.push(notification as Notification)
  }

  return notifications
}

export async function queueReminders1h(): Promise<Notification[]> {
  const supabase = await createClient()

  const { data: assignments } = await supabase
    .from('volunteer_assignments')
    .select(`
      volunteer_id,
      shift_id,
      status,
      volunteer:volunteers(id, user_id, user:users(name, email)),
      shift:volunteer_shifts(id, role, day, start_time, end_time, location)
    `)
    .eq('status', 'assigned')
    .not('volunteer', 'is', null)
    .not('shift', 'is', null)

  if (!assignments) return []

  const notifications = []

  for (const assignment of assignments) {
    const assignmentAny = assignment as any
    if (!assignmentAny.shift || !assignmentAny.volunteer) continue

    const shift = assignmentAny.shift as Shift
    const volunteerUser = assignmentAny.volunteer.user as any
    const volunteer: Volunteer = {
      id: assignmentAny.volunteer.id,
      user_id: assignmentAny.volunteer.user_id ?? null,
      name: volunteerUser?.name || 'Volunteer',
      email: volunteerUser?.email || ''
    }

    if (!volunteer.user_id) continue

    const { data: existing } = await notificationsTable(supabase)
      .select('id')
      .eq('shift_id', shift.id)
      .eq('user_id', volunteer.user_id)
      .eq('type', 'reminder_1h')
      .maybeSingle()

    if (existing) continue

    const template = reminder1hTemplate(shift, volunteer)

    const { data: notification } = await notificationsTable(supabase)
      .insert({
        user_id: volunteer.user_id,
        type: 'reminder_1h',
        subject: template.subject,
        body: template.html,
        shift_id: shift.id,
      })
      .select()
      .single()

    if (notification) notifications.push(notification as Notification)
  }

  return notifications
}

export async function sendPendingNotifications() {
  const supabase = await createClient()

  const { data: pending } = await notificationsTable(supabase)
    .select(`
      id,
      user_id,
      subject,
      body,
      user:user_id(email)
    `)
    .eq('status', 'pending')
    .limit(10)

  if (!pending) return []

  const results = []

  for (const notification of pending as any[]) {
    const email = notification.user?.email
    if (!email) continue

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

  return results
}

export async function sendBulkMessage(
  volunteerIds: string[],
  subject: string,
  message: string
) {
  const supabase = await createClient()

  const { data: volunteers } = await supabase
    .from('volunteers')
    .select(`
      id,
      user_id,
      user:users(email)
    `)
    .in('id', [...new Set(volunteerIds)])

  if (!volunteers) return { sent: 0, failed: 0 }

  const template = adminBulkMessageTemplate(subject, message, 'Boulder Startup Week 2026')
  let sent = 0
  let failed = 0

  for (const volunteerData of volunteers) {
    const volunteer = volunteerData as any
    const email = volunteer.user?.email
    if (!email || !volunteer.user_id) {
      failed++
      continue
    }

    const { data: notification } = await notificationsTable(supabase)
      .insert({
        user_id: volunteer.user_id,
        type: 'admin_message',
        subject: template.subject,
        body: template.html,
      })
      .select()
      .single()

    if (notification) {
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
    }
  }

  return { sent, failed }
}

export async function sendReminder24hForShiftIds(shiftIds?: string[]) {
  const supabase = await createClient()

  let query = supabase
    .from('volunteer_assignments')
    .select(`
      volunteer_id,
      shift_id,
      status,
      volunteer:volunteers(id, user_id, status, user:users(name, email)),
      shift:volunteer_shifts(id, role, day, start_time, end_time, location)
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
    const volunteerUser = assignmentAny.volunteer.user as any
    const volunteer: Volunteer = {
      id: assignmentAny.volunteer.id,
      user_id: assignmentAny.volunteer.user_id ?? null,
      name: volunteerUser?.name || 'Volunteer',
      email: volunteerUser?.email || '',
    }

    if (!volunteer.user_id || !volunteer.email) {
      failed++
      continue
    }

    const { data: existing } = await notificationsTable(supabase)
      .select('id')
      .eq('shift_id', shift.id)
      .eq('user_id', volunteer.user_id)
      .eq('type', 'reminder_24h')
      .maybeSingle()

    if (existing) {
      skipped++
      continue
    }

    const template = reminder24hTemplate(shift, volunteer)

    const { data: notification } = await notificationsTable(supabase)
      .insert({
        user_id: volunteer.user_id,
        type: 'reminder_24h',
        subject: template.subject,
        body: template.html,
        shift_id: shift.id,
      })
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
