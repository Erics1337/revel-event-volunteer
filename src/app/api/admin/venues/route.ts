import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin/require-admin'

export async function GET() {
  const { supabase, error } = await requireAdmin()
  if (error) return error

  const { data: venues, error: dbError } = await supabase
    .from('venues')
    .select('*')
    .order('name', { ascending: true })

  if (dbError) {
    return NextResponse.json({ error: dbError.message }, { status: 500 })
  }

  return NextResponse.json({ venues })
}

export async function POST(request: Request) {
  const { supabase, error } = await requireAdmin()
  if (error) return error

  try {
    const body = await request.json()
    const name = String(body.name || '').trim()
    const address = String(body.address || '').trim()

    if (!name || !address) {
      return NextResponse.json({ error: 'name and address are required' }, { status: 400 })
    }

    const { data: venue, error: dbError } = await supabase
      .from('venues')
      .insert({
        name,
        address,
        maps_url: body.maps_url ? String(body.maps_url) : null,
        capacity: body.capacity != null ? Number(body.capacity) : null,
      })
      .select('*')
      .single()

    if (dbError) {
      return NextResponse.json({ error: dbError.message }, { status: 500 })
    }

    return NextResponse.json({ venue }, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }
}
