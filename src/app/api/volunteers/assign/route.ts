import { createClient } from '@/lib/supabase/server'
import { isAdmin } from '@/lib/auth/roles'
import { NextResponse } from 'next/server'

async function recalculateAssignedShiftCount(
  supabase: Awaited<ReturnType<typeof createClient>>,
  volunteerId: string
) {
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
  const supabase = await createClient()

  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || !isAdmin(profile.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { volunteerId, shiftId } = await request.json()

    if (!volunteerId || !shiftId) {
      return NextResponse.json({ error: 'volunteerId and shiftId are required' }, { status: 400 })
    }

    const [{ data: shift, error: shiftError }, { data: volunteer, error: volunteerError }] =
      await Promise.all([
        supabase
          .from('volunteer_shifts')
          .select('id, day, start_time, end_time, total_slots, filled_slots')
          .eq('id', shiftId)
          .single(),
        supabase
          .from('volunteers')
          .select(`
            id,
            availability,
            status,
            users (
              blocked
            )
          `)
          .eq('id', volunteerId)
          .single(),
      ])

    if (shiftError || !shift) {
      return NextResponse.json({ error: shiftError?.message || 'Shift not found' }, { status: 404 })
    }

    if (volunteerError || !volunteer) {
      return NextResponse.json(
        { error: volunteerError?.message || 'Volunteer not found' },
        { status: 404 }
      )
    }

    if (volunteer.status !== 'confirmed') {
      return NextResponse.json(
        { error: 'Only confirmed volunteers can be assigned to shifts' },
        { status: 409 }
      )
    }

    const userRow = Array.isArray(volunteer.users) ? volunteer.users[0] : volunteer.users

    if (userRow?.blocked) {
      return NextResponse.json(
        { error: 'Blocked volunteers cannot be assigned to shifts' },
        { status: 409 }
      )
    }

    if (!(volunteer.availability ?? []).includes(shift.day)) {
      return NextResponse.json(
        { error: 'Volunteer is not available for this shift day' },
        { status: 409 }
      )
    }

    if ((shift.filled_slots ?? 0) >= shift.total_slots) {
      return NextResponse.json({ error: 'This shift is already full' }, { status: 409 })
    }

    const { data: existingAssignment, error: existingAssignmentError } = await supabase
      .from('volunteer_assignments')
      .select('id, status')
      .eq('volunteer_id', volunteerId)
      .eq('shift_id', shiftId)
      .maybeSingle()

    if (existingAssignmentError) {
      return NextResponse.json({ error: existingAssignmentError.message }, { status: 500 })
    }

    if (existingAssignment?.status === 'assigned') {
      return NextResponse.json({ error: 'Already assigned to this shift' }, { status: 409 })
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
      .eq('volunteer_id', volunteerId)
      .in('status', ['requested', 'assigned'])
      .eq('shift.day', shift.day)

    if (activeAssignmentsError) {
      return NextResponse.json({ error: activeAssignmentsError.message }, { status: 500 })
    }

    const overlappingAssignment = activeAssignments?.find((assignment) => {
      if (!assignment.shift) return false
      if (assignment.shift_id === shiftId) return false

      const assignedShift = Array.isArray(assignment.shift) ? assignment.shift[0] : assignment.shift
      if (!assignedShift) return false

      return (
        shift.start_time < assignedShift.end_time &&
        assignedShift.start_time < shift.end_time
      )
    })

    if (overlappingAssignment) {
      const conflictingShift = Array.isArray(overlappingAssignment.shift)
        ? overlappingAssignment.shift[0]
        : overlappingAssignment.shift

      return NextResponse.json(
        {
          error: 'Volunteer is already committed to an overlapping shift',
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

    const mutation = existingAssignment
      ? supabase
          .from('volunteer_assignments')
          .update({
            status: 'assigned',
            assigned_at: new Date().toISOString(),
          })
          .eq('id', existingAssignment.id)
          .select()
          .single()
      : supabase
          .from('volunteer_assignments')
          .insert({
            volunteer_id: volunteerId,
            shift_id: shiftId,
            status: 'assigned',
          })
          .select()
          .single()

    const { data: assignment, error: mutationError } = await mutation

    if (mutationError) {
      return NextResponse.json({ error: mutationError.message }, { status: 500 })
    }

    await recalculateAssignedShiftCount(supabase, volunteerId)

    return NextResponse.json({ assignment }, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  const supabase = await createClient()

  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || !isAdmin(profile.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const volunteerId = searchParams.get('volunteerId')
    const shiftId = searchParams.get('shiftId')

    if (!volunteerId || !shiftId) {
      return NextResponse.json({ error: 'volunteerId and shiftId are required' }, { status: 400 })
    }

    const { data: assignment, error: lookupError } = await supabase
      .from('volunteer_assignments')
      .select('id, status')
      .eq('volunteer_id', volunteerId)
      .eq('shift_id', shiftId)
      .maybeSingle()

    if (lookupError) {
      return NextResponse.json({ error: lookupError.message }, { status: 500 })
    }

    if (!assignment || assignment.status === 'cancelled') {
      return NextResponse.json({ error: 'Assignment not found' }, { status: 404 })
    }

    const { error } = await supabase
      .from('volunteer_assignments')
      .update({ status: 'cancelled' })
      .eq('id', assignment.id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    await recalculateAssignedShiftCount(supabase, volunteerId)

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
