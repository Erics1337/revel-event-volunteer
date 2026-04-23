import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin/require-admin'
import { runReminderDispatch } from '@/lib/notifications/dispatcher'

export async function POST(request: Request) {
  const { error } = await requireAdmin()
  if (error) return error

  try {
    await request.text().catch(() => '')
    const result = await runReminderDispatch({ sendImmediately: true })
    return NextResponse.json({ success: true, ...result })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
