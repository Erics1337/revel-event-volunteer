import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin/require-admin'

export async function PATCH(request: Request) {
  const { supabase, error } = await requireAdmin()
  if (error) return error

  try {
    const body = await request.json()
    const oldRole = String(body.oldRole || '').trim()
    const newRole = String(body.newRole || '').trim()

    if (!oldRole || !newRole) {
      return NextResponse.json({ error: 'oldRole and newRole are required' }, { status: 400 })
    }

    const { error: updateError } = await supabase
      .from('volunteer_shifts')
      .update({ role: newRole })
      .eq('role', oldRole)

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    return NextResponse.json({ updated: true })
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }
}

export async function DELETE(request: Request) {
  const { supabase, error } = await requireAdmin()
  if (error) return error

  try {
    const body = await request.json()
    const role = String(body.role || '').trim()
    const replacementRole = String(body.replacementRole || 'Building Runner').trim()

    if (!role) {
      return NextResponse.json({ error: 'role is required' }, { status: 400 })
    }

    const { error: updateError } = await supabase
      .from('volunteer_shifts')
      .update({ role: replacementRole })
      .eq('role', role)

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    return NextResponse.json({ updated: true })
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }
}
