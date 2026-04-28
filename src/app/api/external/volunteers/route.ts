import { createAdminClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null

  if (!token || token !== process.env.API_SECRET_KEY) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from('volunteers')
    .select(`
      id,
      phone,
      fallback_name,
      fallback_email,
      availability,
      shift_count,
      status,
      users (
        id,
        name,
        email,
        role,
        badges,
        blocked
      )
    `)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const { data: assignmentRows, error: assignmentError } = await supabase
    .from('volunteer_assignments')
    .select('volunteer_id')
    .eq('status', 'assigned')

  if (assignmentError) {
    return NextResponse.json({ error: assignmentError.message }, { status: 500 })
  }

  const assignmentCounts = new Map<string, number>()
  ;(assignmentRows || []).forEach((assignment) => {
    if (!assignment.volunteer_id) return
    assignmentCounts.set(
      assignment.volunteer_id,
      (assignmentCounts.get(assignment.volunteer_id) || 0) + 1
    )
  })

  const volunteers = (data || []).map((v) => {
    const userRow = Array.isArray(v.users) ? v.users[0] : v.users
    return {
      id: v.id,
      phone: v.phone,
      availability: v.availability ?? [],
      shift_count: assignmentCounts.get(v.id) ?? v.shift_count ?? 0,
      status: v.status,
      name: userRow?.name ?? v.fallback_name ?? 'Unknown',
      email: userRow?.email ?? v.fallback_email ?? '',
      user_id: userRow?.id ?? null,
      role: userRow?.role ?? 'volunteer',
      badges: userRow?.badges ?? [],
      blocked: userRow?.blocked ?? false,
    }
  })

  return NextResponse.json({ volunteers })
}
