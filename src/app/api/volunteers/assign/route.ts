import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const supabase = await createClient()

  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { volunteerId, shiftId } = await request.json()

    if (!volunteerId || !shiftId) {
      return NextResponse.json({ error: 'volunteerId and shiftId are required' }, { status: 400 })
    }

    const { data: assignment, error } = await supabase
      .from('volunteer_assignments')
      .insert({
        volunteer_id: volunteerId,
        shift_id: shiftId,
      })
      .select()
      .single()

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json({ error: 'Already assigned to this shift' }, { status: 409 })
      }
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ assignment }, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  const supabase = await createClient()

  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const volunteerId = searchParams.get('volunteerId')
    const shiftId = searchParams.get('shiftId')

    if (!volunteerId || !shiftId) {
      return NextResponse.json({ error: 'volunteerId and shiftId are required' }, { status: 400 })
    }

    const { error } = await supabase
      .from('volunteer_assignments')
      .delete()
      .eq('volunteer_id', volunteerId)
      .eq('shift_id', shiftId)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
