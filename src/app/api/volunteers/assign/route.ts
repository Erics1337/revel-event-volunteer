import { createClient } from '@/lib/supabase/server'
import { isAdmin } from '@/lib/auth/roles'
import { NextResponse } from 'next/server'

interface VolunteerContactPayload {
  name?: string
  email?: string
  phone?: string
}

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

function normalizeContact(contact: VolunteerContactPayload | null | undefined) {
  const name = contact?.name?.trim() ?? ''
  const email = contact?.email?.trim().toLowerCase() ?? ''
  const phone = contact?.phone?.trim() ?? ''

  if (!name || !phone) {
    return { error: 'Volunteer name and phone are required' }
  }

  return {
    value: {
      name,
      email: email || null,
      phone,
    },
  }
}

async function findOrCreateContactVolunteer(
  supabase: Awaited<ReturnType<typeof createClient>>,
  contactPayload: VolunteerContactPayload,
  shiftDay: string
) {
  const normalized = normalizeContact(contactPayload)
  if (normalized.error || !normalized.value) {
    return { error: normalized.error || 'Invalid volunteer contact' }
  }

  const contact = normalized.value

  const { data: phoneMatches, error: phoneLookupError } = await supabase
    .from('volunteers')
    .select('id, availability, fallback_name, fallback_email, phone, status, user_id')
    .eq('phone', contact.phone)

  if (phoneLookupError) return { error: phoneLookupError.message }

  let volunteer = phoneMatches?.find((match) => !match.user_id) ?? null

  if (!volunteer && contact.email) {
    const { data: emailMatches, error: emailLookupError } = await supabase
      .from('volunteers')
      .select('id, availability, fallback_name, fallback_email, phone, status, user_id')
      .ilike('fallback_email', contact.email)

    if (emailLookupError) return { error: emailLookupError.message }
    volunteer = emailMatches?.find((match) => !match.user_id) ?? null
  }

  if (!volunteer) {
    const { data: created, error: createError } = await supabase
      .from('volunteers')
      .insert({
        fallback_name: contact.name,
        fallback_email: contact.email,
        phone: contact.phone,
        availability: [shiftDay],
        status: 'confirmed',
      })
      .select('id, availability, fallback_name, fallback_email, phone, status, user_id')
      .single()

    if (createError) return { error: createError.message }
    return { volunteer: created }
  }

  const nextAvailability = Array.from(new Set([...(volunteer.availability ?? []), shiftDay]))

  const { data: updated, error: updateError } = await supabase
    .from('volunteers')
    .update({
      fallback_name: volunteer.fallback_name || contact.name,
      fallback_email: volunteer.fallback_email || contact.email,
      availability: nextAvailability,
      status: 'confirmed',
    })
    .eq('id', volunteer.id)
    .select('id, availability, fallback_name, fallback_email, phone, status, user_id')
    .single()

  if (updateError) return { error: updateError.message }
  return { volunteer: updated }
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

    const { volunteerId, shiftId, volunteerContact } = await request.json()

    if ((!volunteerId && !volunteerContact) || !shiftId) {
      return NextResponse.json(
        { error: 'shiftId and either volunteerId or volunteerContact are required' },
        { status: 400 }
      )
    }

    const { data: shift, error: shiftError } = await supabase
      .from('volunteer_shifts')
      .select('id, day, start_time, end_time, total_slots, filled_slots')
      .eq('id', shiftId)
      .single()

    if (shiftError || !shift) {
      return NextResponse.json({ error: shiftError?.message || 'Shift not found' }, { status: 404 })
    }

    let resolvedVolunteerId = volunteerId as string | undefined

    if (!resolvedVolunteerId && volunteerContact) {
      const result = await findOrCreateContactVolunteer(supabase, volunteerContact, shift.day)
      if (result.error || !result.volunteer) {
        return NextResponse.json(
          { error: result.error || 'Failed to create volunteer contact' },
          { status: 400 }
        )
      }
      resolvedVolunteerId = result.volunteer.id
    }

    if (!resolvedVolunteerId) {
      return NextResponse.json({ error: 'Volunteer is required' }, { status: 400 })
    }

    const { data: volunteer, error: volunteerError } = await supabase
      .from('volunteers')
      .select(`
        id,
        user_id,
        availability,
        status,
        users (
          blocked
        )
      `)
      .eq('id', resolvedVolunteerId)
      .single()

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

    if ((shift.filled_slots ?? 0) >= shift.total_slots) {
      return NextResponse.json({ error: 'This shift is already full' }, { status: 409 })
    }

    const { data: existingAssignment, error: existingAssignmentError } = await supabase
      .from('volunteer_assignments')
      .select('id, status')
      .eq('volunteer_id', resolvedVolunteerId)
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
      .eq('volunteer_id', resolvedVolunteerId)
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
            volunteer_id: resolvedVolunteerId,
            shift_id: shiftId,
            status: 'assigned',
          })
          .select()
          .single()

    const { data: assignment, error: mutationError } = await mutation

    if (mutationError) {
      return NextResponse.json({ error: mutationError.message }, { status: 500 })
    }

    await recalculateAssignedShiftCount(supabase, resolvedVolunteerId)

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
