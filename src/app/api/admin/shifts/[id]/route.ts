import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

async function requireAdmin() {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return { supabase, error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }
  }

  const { data: profile } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'admin') {
    return { supabase, error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) }
  }

  return { supabase, error: null }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { supabase, error } = await requireAdmin()
  if (error) return error

  const { id } = await params

  try {
    const body = await request.json()
    const updates: {
      role?: string
      day?: string
      start_time?: string
      end_time?: string
      location?: string
      total_slots?: number
    } = {}
    if (body.role !== undefined) updates.role = String(body.role)
    if (body.day !== undefined) updates.day = String(body.day)
    if (body.start_time !== undefined) updates.start_time = String(body.start_time)
    if (body.end_time !== undefined) updates.end_time = String(body.end_time)
    if (body.location !== undefined) updates.location = String(body.location)
    if (body.total_slots !== undefined) updates.total_slots = Number(body.total_slots)

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 })
    }

    const { data: shift, error: dbError } = await supabase
      .from('volunteer_shifts')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (dbError) {
      return NextResponse.json({ error: dbError.message }, { status: 500 })
    }

    return NextResponse.json({ shift })
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { supabase, error } = await requireAdmin()
  if (error) return error

  const { id } = await params

  const { error: dbError } = await supabase
    .from('volunteer_shifts')
    .delete()
    .eq('id', id)

  if (dbError) {
    return NextResponse.json({ error: dbError.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
