import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const supabase = await createClient()
  const { searchParams } = new URL(request.url)
  
  const day = searchParams.get('day')
  const type = searchParams.get('type')
  const category = searchParams.get('category')
  const status = searchParams.get('status') || 'published'

  try {
    let query = supabase
      .from('sessions')
      .select(`
        *,
        venues (
          id,
          name,
          address,
          maps_url
        )
      `)
      .eq('status', status)

    if (day) {
      query = query.eq('day', day)
    }
    if (type) {
      query = query.eq('type', type)
    }
    if (category) {
      query = query.eq('category', category)
    }

    const { data: sessions, error } = await query.order('start_time', { ascending: true })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ sessions })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const body = await request.json()

  // Validate required fields
  const requiredFields = ['title', 'type', 'category', 'day', 'start_time', 'end_time', 'venue_id']
  for (const field of requiredFields) {
    if (!body[field]) {
      return NextResponse.json({ error: `${field} is required` }, { status: 400 })
    }
  }

  // Validate type and category
  const validTypes = ['Keynote', 'Panel', 'Workshop', 'Talk', 'Networking', 'Office Hours', 'Demo', 'Social']
  const validCategories = ['Fundraising', 'Product', 'Engineering', 'Design', 'Marketing', 'Operations', 'Leadership', 'Community', 'Hiring', 'Legal & Finance', 'Health & Wellness', 'Other']

  if (!validTypes.includes(body.type)) {
    return NextResponse.json({ error: `type must be one of: ${validTypes.join(', ')}` }, { status: 400 })
  }

  if (!validCategories.includes(body.category)) {
    return NextResponse.json({ error: `category must be one of: ${validCategories.join(', ')}` }, { status: 400 })
  }

  try {
    const { data: session, error } = await (supabase as any)
      .from('sessions')
      .insert({
        title: body.title,
        description: body.description || '',
        type: body.type,
        category: body.category,
        status: body.status || 'draft',
        day: body.day,
        start_time: body.start_time,
        end_time: body.end_time,
        venue_id: body.venue_id,
        attachments: body.attachments || [],
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ session }, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
