import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { isEventAdmin } from '@/lib/auth/roles'
import { Database } from '@/lib/supabase/database.types'

type UserRoleLookup = Pick<Database['public']['Tables']['users']['Row'], 'role'>

interface RegistrationDayRow {
  sessions: {
    day: string
  } | null
}

interface VenueUtilizationRow {
  venues: {
    name: string
  } | null
  registration_count: number
}

export async function GET() {
  const supabase = await createClient()

  try {
    // Get current user and verify admin role
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profileError || !profile || !isEventAdmin((profile as UserRoleLookup).role)) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    // Get dashboard stats
    const [
      { count: totalUsers },
      { count: totalSessions },
      { count: totalRegistrations },
      { data: popularSessions },
      { data: venueUtilization },
    ] = await Promise.all([
      supabase.from('users').select('*', { count: 'exact', head: true }),
      supabase.from('sessions').select('*', { count: 'exact', head: true }),
      supabase.from('registrations').select('*', { count: 'exact', head: true }),
      supabase
        .from('sessions')
        .select('id, title, registration_count')
        .eq('status', 'published')
        .order('registration_count', { ascending: false })
        .limit(10),
      supabase
        .from('sessions')
        .select(`
          venues!inner (
            name
          ),
          registration_count
        `)
        .eq('status', 'published'),
    ])

    // Calculate registrations by day (May 4-8, 2026)
    const { data: registrationsByDay } = await supabase
      .from('registrations')
      .select(`
        registered_at,
        sessions!inner (
          day
        )
      `)

    const dayStats = (registrationsByDay as RegistrationDayRow[] | null)?.reduce<Record<string, number>>((acc, reg) => {
      const day = reg.sessions?.day
      if (!day) {
        return acc
      }
      acc[day] = (acc[day] || 0) + 1
      return acc
    }, {}) || {}

    // Calculate venue utilization
    const venueStats = (venueUtilization as VenueUtilizationRow[] | null)?.reduce<Record<string, { name: string; sessions: number; totalRegistrations: number }>>((acc, session) => {
      const venueName = session.venues?.name
      if (!venueName) {
        return acc
      }
      if (!acc[venueName]) {
        acc[venueName] = { name: venueName, sessions: 0, totalRegistrations: 0 }
      }
      acc[venueName].sessions += 1
      acc[venueName].totalRegistrations += session.registration_count
      return acc
    }, {}) || {}

    return NextResponse.json({
      stats: {
        total_users: totalUsers || 0,
        total_sessions: totalSessions || 0,
        total_registrations: totalRegistrations || 0,
        popular_sessions: popularSessions || [],
        registrations_by_day: dayStats,
        venue_utilization: Object.values(venueStats),
      },
    })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
