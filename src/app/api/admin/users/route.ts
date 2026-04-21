import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { Database } from '@/lib/supabase/database.types'
import { isEventAdmin } from '@/lib/auth/roles'

type UserRoleLookup = Pick<Database['public']['Tables']['users']['Row'], 'role'>

export async function GET(request: Request) {
  const supabase = await createClient()
  const { searchParams } = new URL(request.url)
  
  const role = searchParams.get('role')
  const blocked = searchParams.get('blocked')
  const search = searchParams.get('search')

  try {
    // Get current user and verify admin role
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profileError || !profile || !isEventAdmin((profile as UserRoleLookup).role)) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    let query = supabase
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
        blocked,
        created_at
      `)
      .order('created_at', { ascending: false })

    if (role) {
      query = query.eq('role', role)
    }

    if (blocked !== null) {
      query = query.eq('blocked', blocked === 'true')
    }

    if (search) {
      query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%`)
    }

    const { data: users, error } = await query

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ users })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  const supabase = await createClient()
  const body = await request.json()

  try {
    // Get current user and verify admin role
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profileError || !profile || !isEventAdmin((profile as UserRoleLookup).role)) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    if (!body.id) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }

    // Whitelist admin-assignable fields
    const allowed = ['role', 'badges', 'blocked'] as const
    const update: Partial<Pick<Database['public']['Tables']['users']['Update'], 'role' | 'badges' | 'blocked'>> = {}

    for (const key of allowed) {
      if (key in body) {
        update[key] = body[key]
      }
    }

    if (Object.keys(update).length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 })
    }

    // Validate role
    const validRoles = ['event_admin', 'volunteer']
    if (update.role && !validRoles.includes(update.role)) {
      return NextResponse.json({ error: `role must be one of: ${validRoles.join(', ')}` }, { status: 400 })
    }

    // Validate badges
    const validBadges = ['facilitator', 'volunteer', 'sponsor']
    if (update.badges) {
      const invalid = update.badges.filter((b: string) => !validBadges.includes(b))
      if (invalid.length > 0) {
        return NextResponse.json({ error: `invalid badges: ${invalid.join(', ')}` }, { status: 400 })
      }
    }

    // Build update object conditionally to avoid undefined values
    const updateFields: Database['public']['Tables']['users']['Update'] = {}
    if (update.role !== undefined) updateFields.role = update.role
    if (update.badges !== undefined) updateFields.badges = update.badges
    if (update.blocked !== undefined) updateFields.blocked = update.blocked
    updateFields.updated_at = new Date().toISOString()

    const { data: updatedUser, error } = await supabase
      .from('users')
      .update(updateFields)
      .eq('id', body.id)
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
        blocked,
        created_at
      `)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'User not found' }, { status: 404 })
      }
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ user: updatedUser })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
