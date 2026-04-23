import { NextResponse } from 'next/server'
import * as XLSX from 'xlsx'
import { requireAdmin } from '@/lib/admin/require-admin'
import {
  parseShiftCsv,
  parseShiftRows,
  sortShifts,
  syncVenuesForShifts,
  toShiftInsert,
} from '@/lib/shifts/admin'

export async function POST(request: Request) {
  const { supabase, error } = await requireAdmin()
  if (error) return error

  try {
    const formData = await request.formData()
    const file = formData.get('file')

    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 })
    }

    const lowerName = file.name.toLowerCase()
    let parsed

    if (lowerName.endsWith('.csv')) {
      parsed = parseShiftCsv(await file.text())
    } else if (lowerName.endsWith('.xlsx')) {
      const workbook = XLSX.read(await file.arrayBuffer(), {
        type: 'array',
        cellDates: false,
      })
      const firstSheet = workbook.SheetNames[0]
      if (!firstSheet) {
        return NextResponse.json({ error: 'The workbook does not contain any sheets' }, { status: 400 })
      }

      parsed = parseShiftRows(
        XLSX.utils.sheet_to_json<Record<string, unknown>>(workbook.Sheets[firstSheet], {
          defval: '',
          raw: false,
        })
      )
    } else {
      return NextResponse.json({ error: 'File must be a CSV or XLSX workbook in the BSW shift sheet shape' }, { status: 400 })
    }

    if (parsed.error || !parsed.shifts) {
      return NextResponse.json({ error: parsed.error || 'Import failed' }, { status: 400 })
    }

    const venueSync = await syncVenuesForShifts(supabase, parsed.shifts)
    if (venueSync.error) {
      return NextResponse.json({ error: venueSync.error }, { status: 400 })
    }

    const { error: deleteError } = await supabase
      .from('volunteer_shifts')
      .delete()
      .not('id', 'is', null)
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
