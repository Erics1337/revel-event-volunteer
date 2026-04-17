import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const supabase = createClient()

  try {
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user profile
    const { data: profile, error } = await supabase
      .from('users')
      .select(`
        id,
        email,
        name,
        avatar_url,
        headline,
        bio,
        linkedin_url,
        email_public,
        role,
        badges,
        created_at
      `)
      .eq('id', user.id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
      }
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ user: profile })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  const supabase = createClient()
  const body = await request.json()

  try {
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Whitelist updatable fields - never allow role/badges/blocked via this endpoint
    const allowed = ['name', 'headline', 'bio', 'linkedin_url', 'avatar_url', 'email_public']
    const update: any = {}
    
    for (const key of allowed) {
      if (key in body) {
        update[key] = body[key]
      }
    }

    if (Object.keys(update).length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 })
    }

    const { data: profile, error } = await (supabase as any)
      .from('users')
      .update({
        ...update,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id)
      .select(`
        id,
        email,
        name,
        avatar_url,
        headline,
        bio,
        linkedin_url,
        email_public,
        role,
        badges,
        created_at
      `)
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ user: profile })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
