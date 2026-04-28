import { config } from 'dotenv'
import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/supabase/database.types'

config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error('E2E tests require NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.')
}

export const adminSupabase = createClient<Database>(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

export async function waitForUserProfile(email: string) {
  const deadline = Date.now() + 15_000
  let lastError: unknown

  while (Date.now() < deadline) {
    const { data, error } = await adminSupabase
      .from('users')
      .select('*')
      .eq('email', email)
      .maybeSingle()

    if (data) return data
    lastError = error
    await new Promise((resolve) => setTimeout(resolve, 500))
  }

  throw new Error(`Timed out waiting for profile row for ${email}. Last error: ${JSON.stringify(lastError)}`)
}

export async function completeVolunteerSetup(userId: string) {
  const { data, error } = await adminSupabase
    .from('volunteers')
    .upsert(
      {
        user_id: userId,
        phone: '555-123-4567',
        availability: ['2026-05-01', '2026-05-04'],
        status: 'confirmed',
      },
      { onConflict: 'user_id' }
    )
    .select('*')
    .single()

  if (error) {
    throw new Error(`Could not complete volunteer setup: ${error.message}`)
  }

  return data
}

export async function requestFirstOpenShift(volunteerId: string) {
  const { data: shifts, error: shiftError } = await adminSupabase
    .from('volunteer_shifts')
    .select('id, filled_slots, total_slots')
    .order('day', { ascending: true })

  const shift = shifts?.find(
    (candidate) =>
      candidate.filled_slots !== null &&
      candidate.total_slots !== null &&
      candidate.filled_slots < candidate.total_slots
  )

  if (shiftError || !shift) {
    throw new Error(`Could not find an open shift: ${shiftError?.message ?? 'No shift found'}`)
  }

  const { data: assignment, error: assignmentError } = await adminSupabase
    .from('volunteer_assignments')
    .insert({
      volunteer_id: volunteerId,
      shift_id: shift.id,
      status: 'requested',
    })
    .select('*')
    .single()

  if (assignmentError) {
    throw new Error(`Could not request shift: ${assignmentError.message}`)
  }

  return assignment
}
