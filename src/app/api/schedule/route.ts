import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { generateIcs } from '@/lib/ical'

export async function GET(request: Request) {
  const supabase = createClient()
  const { searchParams } = new URL(request.url)
  const format = searchParams.get('format')

  try {
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user's registered sessions
    const { data: registrations, error: regError } = await supabase
      .from('registrations')
      .select(`
        session_id,
        registered_at,
        sessions (
          id,
          title,
          description,
          start_time,
          end_time,
          venues (
            name,
            address
          )
        )
      `)
      .eq('user_id', user.id)

    if (regError) {
      return NextResponse.json({ error: regError.message }, { status: 500 })
    }

    const sessions = registrations?.map((reg: any) => reg.sessions).filter(Boolean) || []

    // Handle iCal export
    if (format === 'ics') {
      const icalEvents = sessions.map(session => ({
        id: session.id,
        title: session.title,
        description: session.description,
        location: session.venues?.name || '',
        start_time: session.start_time,
        end_time: session.end_time,
      }))

      const ics = generateIcs(icalEvents, {
        prodId: '-//BSW 2026//Revel Event Platform//EN',
        domain: 'bsw2026.com'
      })

      return new Response(ics, {
        headers: {
          'Content-Type': 'text/calendar; charset=utf-8',
          'Content-Disposition': 'attachment; filename="bsw-2026-schedule.ics"',
        },
      })
    }

    return NextResponse.json({ sessions })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
