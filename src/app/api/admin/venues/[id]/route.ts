import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin/require-admin'

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { supabase, error } = await requireAdmin()
  if (error) return error

  const { id } = await params

  try {
    const body = await request.json()
    const name = String(body.name || '').trim()
    const address = String(body.address || '').trim()

    if (!name || !address) {
      return NextResponse.json({ error: 'name and address are required' }, { status: 400 })
    }

    const { data: existingVenue, error: existingError } = await supabase
      .from('venues')
      .select('*')
      .eq('id', id)
      .single()

    if (existingError || !existingVenue) {
      return NextResponse.json({ error: existingError?.message || 'Venue not found' }, { status: 404 })
    }

    const { data: venue, error: updateError } = await supabase
      .from('venues')
      .update({
        name,
        address,
        maps_url: body.maps_url !== undefined ? String(body.maps_url || '') || null : existingVenue.maps_url,
        capacity: body.capacity !== undefined ? (body.capacity != null ? Number(body.capacity) : null) : existingVenue.capacity,
      })
      .eq('id', id)
      .select('*')
      .single()

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    const { error: shiftsError } = await supabase
      .from('volunteer_shifts')
      .update({
        location: name,
        address,
      })
      .eq('location', existingVenue.name)

    if (shiftsError) {
      return NextResponse.json({ error: shiftsError.message }, { status: 500 })
    }

    return NextResponse.json({ venue })
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

  const { data: venue, error: fetchError } = await supabase
    .from('venues')
    .select('name')
    .eq('id', id)
    .single()

  if (fetchError || !venue) {
    return NextResponse.json({ error: fetchError?.message || 'Venue not found' }, { status: 404 })
  }

  const body = await _request.json().catch(() => ({}))
  const replacementLocation = String(body.replacementLocation || '').trim()

  if (replacementLocation) {
    const { data: replacementVenue, error: replacementError } = await supabase
      .from('venues')
      .select('name, address')
      .eq('name', replacementLocation)
      .maybeSingle()

    if (replacementError) {
      return NextResponse.json({ error: replacementError.message }, { status: 500 })
    }

    if (!replacementVenue) {
      return NextResponse.json({ error: `Replacement location "${replacementLocation}" not found` }, { status: 400 })
    }

    const { error: shiftsError } = await supabase
      .from('volunteer_shifts')
      .update({
        location: replacementVenue.name,
        address: replacementVenue.address ?? '',
      })
      .eq('location', venue.name)

    if (shiftsError) {
      return NextResponse.json({ error: shiftsError.message }, { status: 500 })
    }
  }

  const { error: deleteError } = await supabase.from('venues').delete().eq('id', id)

  if (deleteError) {
    return NextResponse.json({ error: deleteError.message }, { status: 500 })
  }

  return NextResponse.json({ deleted: true })
}
