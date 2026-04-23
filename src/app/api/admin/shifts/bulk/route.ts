import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin/require-admin'
import { sanitizeShiftInput, sortShifts, syncVenuesForShifts, toShiftInsert } from '@/lib/shifts/admin'

export async function POST(request: Request) {
  const { supabase, error } = await requireAdmin()
  if (error) return error

  try {
    const body = await request.json()
    const rawShifts = Array.isArray(body.shifts) ? body.shifts : null
    const deletedShiftIds = Array.isArray(body.deletedShiftIds)
      ? body.deletedShiftIds.filter((value: unknown): value is string => typeof value === 'string')
      : []

    if (!rawShifts) {
      return NextResponse.json({ error: 'shifts must be an array' }, { status: 400 })
    }

    const sanitizedShifts = []

    for (let index = 0; index < rawShifts.length; index += 1) {
      const sanitized = sanitizeShiftInput(rawShifts[index], index + 1)
      if (sanitized.error || !sanitized.value) {
        return NextResponse.json({ error: sanitized.error || 'Invalid shift' }, { status: 400 })
      }

      sanitizedShifts.push(sanitized.value)
    }

    const venueSync = await syncVenuesForShifts(supabase, sanitizedShifts)
    if (venueSync.error) {
      return NextResponse.json({ error: venueSync.error }, { status: 400 })
    }

    if (deletedShiftIds.length > 0) {
      const { error: deleteError } = await supabase
        .from('volunteer_shifts')
        .delete()
        .in('id', deletedShiftIds)

      if (deleteError) {
        return NextResponse.json({ error: deleteError.message }, { status: 500 })
      }
    }

    for (const shift of sanitizedShifts) {
      if (shift.id) {
        const { error: updateError } = await supabase
          .from('volunteer_shifts')
          .update(toShiftInsert(shift))
          .eq('id', shift.id)

        if (updateError) {
          return NextResponse.json({ error: updateError.message }, { status: 500 })
        }
      } else {
        const { error: insertError } = await supabase.from('volunteer_shifts').insert(toShiftInsert(shift))

        if (insertError) {
          return NextResponse.json({ error: insertError.message }, { status: 500 })
        }
      }
    }

    const { data: shifts, error: fetchError } = await supabase
      .from('volunteer_shifts')
      .select('*')
      .order('day', { ascending: true })
      .order('start_time', { ascending: true })

    if (fetchError) {
      return NextResponse.json({ error: fetchError.message }, { status: 500 })
    }

    return NextResponse.json({ shifts: sortShifts(shifts || []) })
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }
}
