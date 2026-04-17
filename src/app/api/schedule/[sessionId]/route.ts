import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  const supabase = await createClient()
  const { sessionId } = await params

  try {
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if session exists and is published
    const { data: session, error: sessionError } = await supabase
      .from('sessions')
      .select('id, status')
      .eq('id', sessionId)
      .single()

    if (sessionError || !session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 })
    }

    if ((session as any).status !== 'published') {
      return NextResponse.json({ error: 'Session is not available for registration' }, { status: 400 })
    }

    // Create registration (ON CONFLICT DO NOTHING is handled by RLS policy)
    const { data: registration, error: regError } = await (supabase as any)
      .from('registrations')
      .insert({
        user_id: user.id,
        session_id: sessionId,
      })
      .select()
      .single()

    if (regError) {
      // Check if it's a duplicate registration
      if (regError.code === '23505') {
        return NextResponse.json({ error: 'Already registered for this session' }, { status: 409 })
      }
      return NextResponse.json({ error: regError.message }, { status: 500 })
    }

    return NextResponse.json({ added: sessionId }, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  const supabase = await createClient()
  const { sessionId } = await params

  try {
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Delete registration
    const { error } = await supabase
      .from('registrations')
      .delete()
      .eq('user_id', user.id)
      .eq('session_id', sessionId)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ removed: sessionId })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
