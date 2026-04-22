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
    .from('volunteers')
    .select(`
      id,
      phone,
      availability,
      shift_count,
      status,
      users (
        id,
        name,
        email
      )
    `)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const volunteers = (data || []).map((v) => {
    const userRow = Array.isArray(v.users) ? v.users[0] : v.users
    return {
      id: v.id,
      phone: v.phone,
      availability: v.availability ?? [],
      shift_count: v.shift_count ?? 0,
      status: v.status,
      name: userRow?.name ?? 'Unknown',
      email: userRow?.email ?? '',
      user_id: userRow?.id ?? null,
    }
  })

  return NextResponse.json({ volunteers })
}
