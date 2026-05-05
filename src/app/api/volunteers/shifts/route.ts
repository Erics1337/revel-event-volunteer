import { createAdminClient, createClient } from '@/lib/supabase/server'
import { applyComputedFilledSlots } from '@/lib/shifts/availability'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET() {
  const supabase = await createClient()
  const adminSupabase = createAdminClient()

  try {
    const { data: shifts, error } = await supabase
      .from('volunteer_shifts')
      .select(`
        id,
        role,
        day,
        start_time,
        end_time,
        location,
        address,
        event_session_id,
        total_slots,
        filled_slots,
        urgent,
        event_session:event_sessions (
          id,
          title,
          day,
          start_time,
          end_time,
          location,
          address
        )
      `)
      .order('day', { ascending: true })

    if (error) {
      console.error('Error fetching volunteer shifts:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const computed = await applyComputedFilledSlots(adminSupabase, shifts || [])

    if (computed.error) {
      console.error('Error computing volunteer shift availability:', computed.error)
      return NextResponse.json({ error: computed.error.message }, { status: 500 })
    }

    return NextResponse.json({ shifts: computed.shifts })
  } catch (error) {
    console.error('Error in volunteer shifts API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
