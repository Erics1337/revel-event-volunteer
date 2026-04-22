import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { isAdmin } from '@/lib/auth/roles'
import { sendBulkMessage } from '@/lib/notifications/dispatcher'

export async function POST(request: Request) {
  const supabase = await createClient()

  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || !isAdmin(profile.role)) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const { volunteerIds, subject, message, filters } = await request.json()

    if ((!volunteerIds || volunteerIds.length === 0) && !filters) {
      return NextResponse.json({ error: 'No recipients specified' }, { status: 400 })
    }

    if (!subject || !message) {
      return NextResponse.json({ error: 'Subject and message are required' }, { status: 400 })
    }

    let targetVolunteerIds = volunteerIds || []

    if (filters && !volunteerIds) {
      if (filters.shiftIds && filters.shiftIds.length > 0) {
        const { data: assignments } = await supabase
          .from('volunteer_assignments')
          .select('volunteer_id')
          .in('shift_id', filters.shiftIds)
          .eq('status', 'assigned')
        
        if (assignments) {
          targetVolunteerIds = assignments.map(a => a.volunteer_id)
        }
      }
    }

    if (targetVolunteerIds.length === 0) {
      return NextResponse.json({ error: 'No volunteers found matching criteria' }, { status: 400 })
    }

    const result = await sendBulkMessage(targetVolunteerIds, subject, message)

    return NextResponse.json({
      success: true,
      sent: result.sent,
      failed: result.failed,
      total: targetVolunteerIds.length,
    })
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}
