import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin/require-admin'
import { queueTestReminderEmail } from '@/lib/notifications/dispatcher'

export async function POST(request: Request) {
  const { supabase, user, error } = await requireAdmin()
  if (error) return error

  try {
    await request.text().catch(() => '')

    const { data: profile } = await supabase
      .from('users')
      .select('name, email')
      .eq('id', user.id)
      .maybeSingle()

    const email = user.email || profile?.email

    if (!email) {
      return NextResponse.json(
        { error: 'Your admin account does not have an email address.' },
        { status: 400 }
      )
    }

    const result = await queueTestReminderEmail({
      userId: user.id,
      email,
      name: profile?.name,
      scheduledFor: new Date(),
    })

    return NextResponse.json({ success: true, ...result })
  } catch (routeError) {
    const message = routeError instanceof Error ? routeError.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
