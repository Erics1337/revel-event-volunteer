import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { isAdmin } from '@/lib/auth/roles'
import { Database } from '@/lib/supabase/database.types'

type UserRoleLookup = Pick<Database['public']['Tables']['users']['Row'], 'role'>

interface ShiftRow {
  id: string
  role: string
  day: string
  start_time: string
  end_time: string
  location: string
  total_slots: number
  filled_slots: number
}

export async function GET() {
  const supabase = await createClient()

  try {
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profileError || !profile || !isAdmin((profile as UserRoleLookup).role)) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const [
      { count: totalUsers },
      { count: totalShifts },
      { count: totalVolunteers },
      { count: confirmedVolunteers },
      { count: totalAssignments },
      { data: shiftsData },
    ] = await Promise.all([
      supabase.from('users').select('*', { count: 'exact', head: true }),
      supabase.from('volunteer_shifts').select('*', { count: 'exact', head: true }),
      supabase.from('volunteers').select('*', { count: 'exact', head: true }),
      supabase
        .from('volunteers')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'confirmed'),
      supabase
        .from('volunteer_assignments')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'assigned'),
      supabase
        .from('volunteer_shifts')
        .select('id, role, day, start_time, end_time, location, total_slots, filled_slots'),
    ])

    const shifts = (shiftsData as ShiftRow[] | null) ?? []

    const totalSlots = shifts.reduce((sum, s) => sum + (s.total_slots ?? 0), 0)
    const filledSlots = shifts.reduce((sum, s) => sum + (s.filled_slots ?? 0), 0)
    const openSlots = Math.max(totalSlots - filledSlots, 0)
    const fillRate = totalSlots > 0 ? filledSlots / totalSlots : 0

    // Shifts by day
    const shiftsByDay = shifts.reduce<Record<string, { total: number; filled: number }>>((acc, s) => {
      if (!s.day) return acc
      if (!acc[s.day]) acc[s.day] = { total: 0, filled: 0 }
      acc[s.day].total += s.total_slots ?? 0
      acc[s.day].filled += s.filled_slots ?? 0
      return acc
    }, {})

    // Shifts most in need of volunteers (largest unfilled gap)
    const understaffedShifts = [...shifts]
      .map((s) => ({
        id: s.id,
        role: s.role,
        day: s.day,
        start_time: s.start_time,
        end_time: s.end_time,
        location: s.location,
        total_slots: s.total_slots,
        filled_slots: s.filled_slots,
        unfilled: Math.max((s.total_slots ?? 0) - (s.filled_slots ?? 0), 0),
      }))
      .filter((s) => s.unfilled > 0)
      .sort((a, b) => b.unfilled - a.unfilled)
      .slice(0, 10)

    // Location utilization (venue-equivalent for shifts)
    const locationStats = shifts.reduce<Record<string, { name: string; shifts: number; totalSlots: number; filledSlots: number }>>(
      (acc, s) => {
        const name = s.location
        if (!name) return acc
        if (!acc[name]) acc[name] = { name, shifts: 0, totalSlots: 0, filledSlots: 0 }
        acc[name].shifts += 1
        acc[name].totalSlots += s.total_slots ?? 0
        acc[name].filledSlots += s.filled_slots ?? 0
        return acc
      },
      {}
    )

    return NextResponse.json({
      stats: {
        total_users: totalUsers || 0,
        total_shifts: totalShifts || 0,
        total_volunteers: totalVolunteers || 0,
        confirmed_volunteers: confirmedVolunteers || 0,
        total_assignments: totalAssignments || 0,
        total_slots: totalSlots,
        filled_slots: filledSlots,
        open_slots: openSlots,
        fill_rate: fillRate,
        shifts_by_day: shiftsByDay,
        understaffed_shifts: understaffedShifts,
        location_utilization: Object.values(locationStats),
      },
    })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
