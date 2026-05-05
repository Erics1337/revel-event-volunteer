import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getAssignedCountForShift } from '@/lib/shifts/availability'

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
        { error: 'Complete your volunteer setup first', code: 'VOLUNTEER_SETUP_REQUIRED' },
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

export async function POST(request: Request): Promise<Response> {
  const { supabase, volunteer, error } = await getVolunteerForUser()
  if (error) return error ?? NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!volunteer) return NextResponse.json({ error: 'Volunteer not found' }, { status: 404 })

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
    return NextResponse.json({ error: 'shiftId is required', code: 'SHIFT_ID_REQUIRED' }, { status: 400 })
  }

  if (!volunteer.phone) {
    return NextResponse.json(
      { error: 'Complete your volunteer setup first', code: 'VOLUNTEER_SETUP_REQUIRED' },
      { status: 400 }
    )
  }

  const { data: shift, error: shiftError } = await supabase
    .from('volunteer_shifts')
    .select('id, day, start_time, end_time, total_slots, filled_slots')
    .eq('id', shiftId)
    .single()

  if (shiftError || !shift) {
    return NextResponse.json(
      { error: shiftError?.message || 'Shift not found', code: 'SHIFT_NOT_FOUND' },
      { status: 404 }
    )
  }

  if (volunteer.status !== 'confirmed') {
    return NextResponse.json(
      { error: 'Volunteer profile is not active yet', code: 'VOLUNTEER_NOT_CONFIRMED' },
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
    return NextResponse.json({ error: 'Request already submitted', code: 'ALREADY_REQUESTED' }, { status: 409 })
  }

  if (existing?.status === 'assigned') {
    return NextResponse.json(
      { error: 'You are already assigned to this shift', code: 'ALREADY_ASSIGNED' },
      { status: 409 }
    )
  }

  const { count: assignedCount, error: assignedCountError } = await getAssignedCountForShift(supabase, shift.id)

  if (assignedCountError) {
    return NextResponse.json({ error: assignedCountError.message }, { status: 500 })
  }

  if (assignedCount === null) {
    return NextResponse.json(
      {
        error: `Assigned count is unavailable for shift ${shift.id}; cannot compare against total_slots ${shift.total_slots}`,
        code: 'ASSIGNED_COUNT_UNAVAILABLE',
      },
      { status: 500 }
    )
  }

  if (assignedCount >= shift.total_slots) {
    return NextResponse.json({ error: 'This shift is already full', code: 'SHIFT_FULL' }, { status: 409 })
  }

  const { data: activeAssignments, error: activeAssignmentsError } = await supabase
    .from('volunteer_assignments')
    .select(`
      id, 
      status, 
      shift_id,
      shift:volunteer_shifts!inner (
        id,
        day,
        start_time,
        end_time,
        role,
        location
      )
    `)
    .eq('volunteer_id', volunteer.id)
    .in('status', ['requested', 'assigned'])
    .eq('shift.day', shift.day)

  if (activeAssignmentsError) {
    return NextResponse.json({ error: activeAssignmentsError.message }, { status: 500 })
  }

  const overlappingAssignment = activeAssignments?.find((assignment) => {
    if (!assignment.shift) return false
    if (assignment.shift_id === shiftId) return false

    // Handle TS return type (Supabase !inner join returns array or single depending on type config, typically single for many-to-one)
    const shift1 = Array.isArray(assignment.shift) ? assignment.shift[0] : assignment.shift
    
    // String comparison for times works (e.g., '09:00:00' < '12:00:00')
    return shift.start_time < shift1.end_time && shift1.start_time < shift.end_time
  })

  if (overlappingAssignment) {
    const conflictingShift = Array.isArray(overlappingAssignment.shift)
      ? overlappingAssignment.shift[0]
      : overlappingAssignment.shift

    return NextResponse.json(
      {
        error: 'This shift overlaps with another shift on your schedule',
        code: 'SHIFT_CONFLICT',
        conflictingShift: conflictingShift
          ? {
              role: conflictingShift.role,
              day: conflictingShift.day,
              start_time: conflictingShift.start_time,
              end_time: conflictingShift.end_time,
              location: conflictingShift.location,
              status: overlappingAssignment.status,
            }
          : null,
      },
      { status: 409 }
    )
  }

  const mutation = existing
    ? supabase
        .from('volunteer_assignments')
        .update({
          status: 'assigned',
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
          status: 'assigned',
        })
        .select('id, shift_id, volunteer_id, assigned_at, status')
        .single()

  const { data: assignment, error: mutationError } = await mutation

  if (mutationError) {
    if (mutationError.message.includes('Shift is already full')) {
      return NextResponse.json({ error: 'This shift is already full', code: 'SHIFT_FULL' }, { status: 409 })
    }

    return NextResponse.json({ error: mutationError.message }, { status: 500 })
  }

  await recalculateAssignedShiftCount(supabase, volunteer.id)

  return NextResponse.json({ assignment }, { status: existing ? 200 : 201 })
}

export async function DELETE(request: Request) {
  const { supabase, volunteer, error } = await getVolunteerForUser()
  if (error) return error
  if (!volunteer) return NextResponse.json({ error: 'Volunteer not found' }, { status: 404 })

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
