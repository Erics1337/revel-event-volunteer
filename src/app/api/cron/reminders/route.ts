import { NextResponse } from 'next/server'
import { queueReminders24h, queueReminders1h, sendPendingNotifications } from '@/lib/notifications/dispatcher'

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization')
  
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const results = {
      reminders24h: [] as unknown[],
      reminders1h: [] as unknown[],
      sent: [] as { id: string; success: boolean; error?: string }[],
    }

    const reminders24h = await queueReminders24h()
    results.reminders24h = reminders24h

    const reminders1h = await queueReminders1h()
    results.reminders1h = reminders1h

    const sent = await sendPendingNotifications()
    results.sent = sent

    return NextResponse.json({
      success: true,
      queued: reminders24h.length + reminders1h.length,
      sent: sent.filter(s => s.success).length,
      failed: sent.filter(s => !s.success).length,
    })
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}
