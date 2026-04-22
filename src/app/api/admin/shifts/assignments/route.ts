import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: profile } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { data, error } = await supabase
    .from('volunteer_assignments')
    .select(`
      id,
      shift_id,
      volunteer_id,
      assigned_at,
      status,
      volunteers (
        id,
        phone,
        status,
        users (
          id,
          name,
          email
        )
      )
    `)
    .eq('status', 'assigned')

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const assignments = (data || []).map((a) => {
    const volunteer = Array.isArray(a.volunteers) ? a.volunteers[0] : a.volunteers
    const userRow = volunteer && (Array.isArray(volunteer.users) ? volunteer.users[0] : volunteer.users)
    return {
      id: a.id,
      shift_id: a.shift_id,
      volunteer_id: a.volunteer_id,
      assigned_at: a.assigned_at,
      status: a.status,
      volunteer: volunteer
        ? {
            id: volunteer.id,
            phone: volunteer.phone,
            status: volunteer.status,
            name: userRow?.name ?? 'Unknown',
            email: userRow?.email ?? '',
            user_id: userRow?.id ?? null,
          }
        : null,
    }
  })

  return NextResponse.json({ assignments })
}
