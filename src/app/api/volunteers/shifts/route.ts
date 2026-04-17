import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = await createClient()

  try {
    const { data: shifts, error } = await supabase
      .from('volunteer_shifts')
      .select('*')
      .order('day', { ascending: true })

    if (error) {
      console.error('Error fetching volunteer shifts:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ shifts })
  } catch (error) {
    console.error('Error in volunteer shifts API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
