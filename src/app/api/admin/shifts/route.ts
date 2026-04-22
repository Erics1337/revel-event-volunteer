import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

async function requireAdmin() {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return { supabase, user: null, error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }
  }

  const { data: profile } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'admin') {
    return { supabase, user, error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) }
  }

  return { supabase, user, error: null }
}

export async function GET() {
  const { supabase, error } = await requireAdmin()
  if (error) return error

  const { data: shifts, error: dbError } = await supabase
    .from('volunteer_shifts')
    .select('*')
    .order('day', { ascending: true })
    .order('start_time', { ascending: true })

  if (dbError) {
    return NextResponse.json({ error: dbError.message }, { status: 500 })
  }

  return NextResponse.json({ shifts })
}

export async function POST(request: Request) {
  const { supabase, error } = await requireAdmin()
  if (error) return error

  try {
    const body = await request.json()
    const { role, day, start_time, end_time, location, total_slots } = body

    if (!role || !day || !start_time || !end_time || !location || total_slots == null) {
      return NextResponse.json(
        { error: 'role, day, start_time, end_time, location, and total_slots are required' },
        { status: 400 }
      )
    }

    const { data: shift, error: dbError } = await supabase
      .from('volunteer_shifts')
      .insert({
        role,
        day,
        start_time,
        end_time,
        location,
        total_slots: Number(total_slots),
      })
      .select()
      .single()

    if (dbError) {
      return NextResponse.json({ error: dbError.message }, { status: 500 })
    }

    return NextResponse.json({ shift }, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }
}
