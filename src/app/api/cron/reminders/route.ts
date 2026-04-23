import { NextResponse } from 'next/server'
import { runReminderDispatch } from '@/lib/notifications/dispatcher'

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization')

  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const result = await runReminderDispatch({ sendImmediately: true })

    return NextResponse.json({
      success: true,
      now: result.now,
      settings: result.settings,
      queued: result.queued,
      sent: result.sent,
      failed: result.failed,
      skipped: result.skipped,
      counts: result.counts,
    })
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}
