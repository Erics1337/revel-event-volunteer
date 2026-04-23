import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin/require-admin'
import { sanitizeShiftInput, toShiftInsert } from '@/lib/shifts/admin'

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { supabase, error } = await requireAdmin()
  if (error) return error

  const { id } = await params

  try {
    const body = await request.json()
    const { data: existingShift, error: lookupError } = await supabase
      .from('volunteer_shifts')
      .select('*')
      .eq('id', id)
      .single()

    if (lookupError || !existingShift) {
      return NextResponse.json({ error: lookupError?.message || 'Shift not found' }, { status: 404 })
    }

    const sanitized = sanitizeShiftInput({
      ...existingShift,
      ...body,
      total_slots:
        body.total_slots !== undefined ? Number(body.total_slots) : existingShift.total_slots,
    })

    if (sanitized.error || !sanitized.value) {
      return NextResponse.json({ error: sanitized.error || 'Invalid shift' }, { status: 400 })
    }

    const { data: shift, error: dbError } = await supabase
      .from('volunteer_shifts')
      .update(toShiftInsert(sanitized.value))
      .eq('id', id)
      .select()
      .single()

    if (dbError) {
      return NextResponse.json({ error: dbError.message }, { status: 500 })
    }

    return NextResponse.json({ shift })
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { supabase, error } = await requireAdmin()
  if (error) return error

  const { id } = await params

  const { error: dbError } = await supabase
    .from('volunteer_shifts')
    .delete()
    .eq('id', id)

  if (dbError) {
    return NextResponse.json({ error: dbError.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
