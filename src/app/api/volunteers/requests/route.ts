import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

async function getVolunteerForUser() {
  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return {
      supabase,
      volunteer: null,
      error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
    }
  }

  const { data: volunteer, error: volunteerError } = await supabase
    .from('volunteers')
    .select('id, user_id, phone, availability, status')
    .eq('user_id', user.id)
    .maybeSingle()

  if (volunteerError) {
    return {
      supabase,
      volunteer: null,
      error: NextResponse.json({ error: volunteerError.message }, { status: 500 }),
    }
  }

  if (!volunteer) {
    return {
      supabase,
      volunteer: null,
      error: NextResponse.json(
        { error: 'Complete your volunteer setup first' },
        { status: 400 }
      ),
    }
  }

  return { supabase, volunteer, error: null }
}

async function recalculateAssignedShiftCount(supabase: Awaited<ReturnType<typeof createClient>>, volunteerId: string) {
  const { count, error } = await supabase
    .from('volunteer_assignments')
    .select('*', { count: 'exact', head: true })
    .eq('volunteer_id', volunteerId)
    .eq('status', 'assigned')

  if (!error) {
    await supabase
      .from('volunteers')
      .update({ shift_count: count ?? 0 })
      .eq('id', volunteerId)
  }
}

export async function POST(request: Request) {
  const { supabase, volunteer, error } = await getVolunteerForUser()
  if (error || !volunteer) return error

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const shiftId =
    typeof (body as { shiftId?: unknown }).shiftId === 'string'
      ? (body as { shiftId: string }).shiftId
      : null

  if (!shiftId) {
    return NextResponse.json({ error: 'shiftId is required' }, { status: 400 })
  }

  if (!volunteer.phone || (volunteer.availability ?? []).length === 0) {
    return NextResponse.json(
      { error: 'Complete your volunteer setup first' },
      { status: 400 }
    )
  }

  const { data: shift, error: shiftError } = await supabase
    .from('volunteer_shifts')
    .select('id, day, total_slots, filled_slots')
    .eq('id', shiftId)
    .single()

  if (shiftError || !shift) {
    return NextResponse.json({ error: shiftError?.message || 'Shift not found' }, { status: 404 })
  }

  if (volunteer.status !== 'confirmed') {
    return NextResponse.json({ error: 'Volunteer profile is not active yet' }, { status: 409 })
  }

  if (!(volunteer.availability ?? []).includes(shift.day)) {
    return NextResponse.json(
      { error: 'This shift is outside your saved availability' },
      { status: 409 }
    )
  }

  const { data: existing, error: existingError } = await supabase
    .from('volunteer_assignments')
    .select('id, status')
    .eq('volunteer_id', volunteer.id)
    .eq('shift_id', shiftId)
    .maybeSingle()

  if (existingError) {
    return NextResponse.json({ error: existingError.message }, { status: 500 })
  }

  if (existing?.status === 'requested') {
    return NextResponse.json({ error: 'Request already submitted' }, { status: 409 })
  }

  if (existing?.status === 'assigned') {
    return NextResponse.json({ error: 'You are already assigned to this shift' }, { status: 409 })
  }

  if ((shift.filled_slots ?? 0) >= shift.total_slots) {
    return NextResponse.json({ error: 'This shift is already full' }, { status: 409 })
  }

  const mutation = existing
    ? supabase
        .from('volunteer_assignments')
        .update({
          status: 'requested',
          assigned_at: new Date().toISOString(),
        })
        .eq('id', existing.id)
        .select('id, shift_id, volunteer_id, assigned_at, status')
        .single()
    : supabase
        .from('volunteer_assignments')
        .insert({
          volunteer_id: volunteer.id,
          shift_id: shiftId,
          status: 'requested',
        })
        .select('id, shift_id, volunteer_id, assigned_at, status')
        .single()

  const { data: assignment, error: mutationError } = await mutation

  if (mutationError) {
    return NextResponse.json({ error: mutationError.message }, { status: 500 })
  }

  return NextResponse.json({ assignment }, { status: existing ? 200 : 201 })
}

export async function DELETE(request: Request) {
  const { supabase, volunteer, error } = await getVolunteerForUser()
  if (error || !volunteer) return error

  const { searchParams } = new URL(request.url)
  const shiftId = searchParams.get('shiftId')

  if (!shiftId) {
    return NextResponse.json({ error: 'shiftId is required' }, { status: 400 })
  }

  const { data: existing, error: existingError } = await supabase
    .from('volunteer_assignments')
    .select('id, status')
    .eq('volunteer_id', volunteer.id)
    .eq('shift_id', shiftId)
    .maybeSingle()

  if (existingError) {
    return NextResponse.json({ error: existingError.message }, { status: 500 })
  }

  if (!existing || existing.status === 'cancelled') {
    return NextResponse.json({ error: 'No active request found' }, { status: 404 })
  }

  const { error: updateError } = await supabase
    .from('volunteer_assignments')
    .update({ status: 'cancelled' })
    .eq('id', existing.id)

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 })
  }

  await recalculateAssignedShiftCount(supabase, volunteer.id)

  return NextResponse.json({ success: true })
}
