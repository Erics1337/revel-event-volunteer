import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin/require-admin'

const RESULT_LIMIT = 25

export async function GET() {
  const { supabase, error } = await requireAdmin()
  if (error) return error

  try {
    const { data: notifications, error: notificationsError } = await supabase
      .from('notifications')
      .select('id, type, status, subject, recipient_email, scheduled_for, sent_at, error_message, created_at')
      .in('type', ['admin_message', 'reminder_24h', 'reminder_1h'])
      .order('created_at', { ascending: false })
      .limit(RESULT_LIMIT)

    if (notificationsError) {
      throw new Error(notificationsError.message)
    }

    const { data: summaryRows, error: summaryError } = await supabase
      .from('notifications')
      .select('type, status')
      .in('type', ['admin_message', 'reminder_24h', 'reminder_1h'])

    if (summaryError) {
      throw new Error(summaryError.message)
    }

    const summary = (summaryRows || []).reduce(
      (counts, row) => {
        if (row.status === 'sent') counts.sent += 1
        else if (row.status === 'failed') counts.failed += 1
        else if (row.status === 'pending') counts.pending += 1
        else counts.other += 1

        return counts
      },
      { sent: 0, failed: 0, pending: 0, other: 0 }
    )

    return NextResponse.json({
      success: true,
      summary,
      notifications: notifications || [],
    })
  } catch (routeError) {
    const message = routeError instanceof Error ? routeError.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
