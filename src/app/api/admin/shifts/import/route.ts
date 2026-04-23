import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin/require-admin'
import { parseShiftCsv, sortShifts, toShiftInsert } from '@/lib/shifts/admin'

export async function POST(request: Request) {
  const { supabase, error } = await requireAdmin()
  if (error) return error

  try {
    const formData = await request.formData()
    const file = formData.get('file')

    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 })
    }

    if (!file.name.toLowerCase().endsWith('.csv')) {
      return NextResponse.json({ error: 'File must be a CSV' }, { status: 400 })
    }

    const csv = await file.text()
    const parsed = parseShiftCsv(csv)

    if (parsed.error || !parsed.shifts) {
      return NextResponse.json({ error: parsed.error || 'Import failed' }, { status: 400 })
    }

    const { error: deleteError } = await supabase.from('volunteer_shifts').delete().neq('id', '')
    if (deleteError) {
      return NextResponse.json({ error: deleteError.message }, { status: 500 })
    }

    if (parsed.shifts.length > 0) {
      const { error: insertError } = await supabase
        .from('volunteer_shifts')
        .insert(parsed.shifts.map(toShiftInsert))

      if (insertError) {
        return NextResponse.json({ error: insertError.message }, { status: 500 })
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

    return NextResponse.json({ shifts: sortShifts(shifts || []), imported: parsed.shifts.length })
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }
}
