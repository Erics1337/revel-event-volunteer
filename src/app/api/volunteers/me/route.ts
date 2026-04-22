import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const VALID_DAYS = new Set([
  '2026-05-04',
  '2026-05-05',
  '2026-05-06',
  '2026-05-07',
  '2026-05-08',
])

export async function GET() {
  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: volunteer, error: volunteerError } = await supabase
    .from('volunteers')
    .select('id, user_id, phone, availability, status, shift_count')
    .eq('user_id', user.id)
    .maybeSingle()

  if (volunteerError) {
    return NextResponse.json({ error: volunteerError.message }, { status: 500 })
  }

  if (!volunteer) {
    return NextResponse.json({ volunteer: null, assignments: [] })
  }

  const { data: assignments, error: assignmentsError } = await supabase
    .from('volunteer_assignments')
    .select(
      `
        id,
        shift_id,
        volunteer_id,
        assigned_at,
        status,
        shift:volunteer_shifts (
          id,
          role,
          day,
          start_time,
          end_time,
          location,
          total_slots,
          filled_slots
        )
      `
    )
    .eq('volunteer_id', volunteer.id)
    .in('status', ['requested', 'assigned'])
    .order('assigned_at', { ascending: true })

  if (assignmentsError) {
    return NextResponse.json({ error: assignmentsError.message }, { status: 500 })
  }

  return NextResponse.json({
    volunteer: {
      ...volunteer,
      availability: volunteer.availability ?? [],
      shift_count: volunteer.shift_count ?? 0,
    },
    assignments: assignments ?? [],
  })
}

export async function PUT(request: Request) {
  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const phone = typeof (body as { phone?: unknown }).phone === 'string'
    ? (body as { phone: string }).phone.trim()
    : ''
  const availability = Array.isArray((body as { availability?: unknown }).availability)
    ? (body as { availability: unknown[] }).availability.filter(
        (value): value is string => typeof value === 'string' && VALID_DAYS.has(value)
      )
    : []

  if (!phone) {
    return NextResponse.json({ error: 'Phone number is required' }, { status: 400 })
  }

  if (availability.length === 0) {
    return NextResponse.json(
      { error: 'Select at least one day you are available' },
      { status: 400 }
    )
  }

  const { error: userUpdateError } = await supabase
    .from('users')
    .update({
      phone,
      updated_at: new Date().toISOString(),
    })
    .eq('id', user.id)

  if (userUpdateError) {
    return NextResponse.json({ error: userUpdateError.message }, { status: 500 })
  }

  const { data: existingVolunteer, error: existingVolunteerError } = await supabase
    .from('volunteers')
    .select('id')
    .eq('user_id', user.id)
    .maybeSingle()

  if (existingVolunteerError) {
    return NextResponse.json({ error: existingVolunteerError.message }, { status: 500 })
  }

  const payload = {
    user_id: user.id,
    phone,
    availability,
    status: 'confirmed',
  }

  const volunteerQuery = existingVolunteer
    ? supabase
        .from('volunteers')
        .update(payload)
        .eq('id', existingVolunteer.id)
        .select('id, user_id, phone, availability, status, shift_count')
        .single()
    : supabase
        .from('volunteers')
        .insert(payload)
        .select('id, user_id, phone, availability, status, shift_count')
        .single()

  const { data: volunteer, error: volunteerError } = await volunteerQuery

  if (volunteerError) {
    return NextResponse.json({ error: volunteerError.message }, { status: 500 })
  }

  return NextResponse.json({
    volunteer: {
      ...volunteer,
      availability: volunteer.availability ?? [],
      shift_count: volunteer.shift_count ?? 0,
    },
  })
}
