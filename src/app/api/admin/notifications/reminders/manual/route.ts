import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin/require-admin'
import { sendReminder24hForShiftIds } from '@/lib/notifications/dispatcher'

export async function POST(request: Request) {
  const { error } = await requireAdmin()
  if (error) return error

  try {
    const body = await request.json().catch(() => ({}))
    const shiftIds = Array.isArray(body.shiftIds)
      ? body.shiftIds.filter((value): value is string => typeof value === 'string' && value.length > 0)
      : []

    if (shiftIds.length === 0) {
      return NextResponse.json({ error: 'At least one shift is required' }, { status: 400 })
    }

    const result = await sendReminder24hForShiftIds(shiftIds)

    return NextResponse.json({
      success: true,
      sent: result.sent,
      failed: result.failed,
      skipped: result.skipped,
    })
  } catch (routeError) {
    const message = routeError instanceof Error ? routeError.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
