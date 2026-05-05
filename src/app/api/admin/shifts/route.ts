import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin/require-admin'
import { applyComputedFilledSlots } from '@/lib/shifts/availability'
import { sanitizeShiftInput, sortShifts, syncVenuesForShifts, toShiftInsert } from '@/lib/shifts/admin'

export async function GET() {
  const { supabase, error } = await requireAdmin()
  if (error) return error

  const { data: shifts, error: dbError } = await supabase
    .from('volunteer_shifts')
    .select('*')
    .order('day', { ascending: true })
    .order('start_time', { ascending: true })

  if (dbError) {
    return NextResponse.json({ error: dbError.message }, { status: 500 })
  }

  const computed = await applyComputedFilledSlots(supabase, shifts || [])

  if (computed.error) {
    return NextResponse.json({ error: computed.error.message }, { status: 500 })
  }

  return NextResponse.json({ shifts: sortShifts(computed.shifts) })
}

export async function POST(request: Request) {
  const { supabase, error } = await requireAdmin()
  if (error) return error

  try {
    const body = await request.json()
    const sanitized = sanitizeShiftInput(body)

    if (sanitized.error || !sanitized.value) {
      return NextResponse.json({ error: sanitized.error || 'Invalid shift' }, { status: 400 })
    }

    const venueSync = await syncVenuesForShifts(supabase, [sanitized.value])
    if (venueSync.error) {
      return NextResponse.json({ error: venueSync.error }, { status: 400 })
    }

    const { data: shift, error: dbError } = await supabase
      .from('volunteer_shifts')
      .insert(toShiftInsert(sanitized.value))
      .select()
      .single()

    if (dbError) {
      return NextResponse.json({ error: dbError.message }, { status: 500 })
    }

    return NextResponse.json({ shift }, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }
}
