import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// Returns the current user's active volunteer requests / assignments.
export async function GET() {
  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Look up the volunteer row for this user (may not exist yet).
  const { data: volunteer, error: volunteerError } = await supabase
    .from('volunteers')
    .select('id')
    .eq('user_id', user.id)
    .maybeSingle()

  if (volunteerError) {
    return NextResponse.json({ error: volunteerError.message }, { status: 500 })
  }

  if (!volunteer) {
    return NextResponse.json({ assignments: [] })
  }

  const { data: assignments, error: assignmentsError } = await supabase
    .from('volunteer_assignments')
    .select(
      `
        id,
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

  return NextResponse.json({ assignments: assignments ?? [], volunteer_id: volunteer.id })
}
