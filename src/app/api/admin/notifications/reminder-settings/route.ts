import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin/require-admin'
import { previewReminderDispatch } from '@/lib/notifications/dispatcher'
import {
  getReminderSettings,
  updateReminderSettings,
} from '@/lib/notifications/reminder-settings'

export async function GET() {
  const { supabase, error } = await requireAdmin()
  if (error) return error

  try {
    const [settings, preview] = await Promise.all([
      getReminderSettings(supabase),
      previewReminderDispatch(),
    ])

    return NextResponse.json({
      settings,
      preview: {
        now: preview.now,
        counts: preview.counts,
      },
    })
  } catch (routeError) {
    const message = routeError instanceof Error ? routeError.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  const { supabase, error } = await requireAdmin()
  if (error) return error

  try {
    const body = await request.json().catch(() => ({}))
    const settings = await updateReminderSettings(supabase, body)
    const preview = await previewReminderDispatch()

    return NextResponse.json({
      success: true,
      settings,
      preview: {
        now: preview.now,
        counts: preview.counts,
      },
    })
  } catch (routeError) {
    const message = routeError instanceof Error ? routeError.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
