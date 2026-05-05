import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/supabase/database.types'

export type ShiftWithFilledSlots<T extends { id: string; filled_slots?: number | null }> = T & {
  filled_slots: number
}

export async function getAssignedCountsByShiftId(
  supabase: SupabaseClient<Database>,
  shiftIds: string[]
) {
  const uniqueShiftIds = Array.from(new Set(shiftIds.filter(Boolean)))
  const counts = new Map<string, number>()

  uniqueShiftIds.forEach((shiftId) => counts.set(shiftId, 0))

  if (uniqueShiftIds.length === 0) {
    return { counts }
  }

  const { data, error } = await supabase
    .from('volunteer_assignments')
    .select('shift_id')
    .in('shift_id', uniqueShiftIds)
    .eq('status', 'assigned')

  if (error) {
    return { counts, error }
  }

  for (const assignment of data || []) {
    if (!assignment.shift_id) continue
    counts.set(assignment.shift_id, (counts.get(assignment.shift_id) ?? 0) + 1)
  }

  return { counts }
}

export async function getAssignedCountForShift(
  supabase: SupabaseClient<Database>,
  shiftId: string
) {
  const { count, error } = await supabase
    .from('volunteer_assignments')
    .select('*', { count: 'exact', head: true })
    .eq('shift_id', shiftId)
    .eq('status', 'assigned')

  return { count, error }
}

export async function applyComputedFilledSlots<T extends { id: string; filled_slots?: number | null }>(
  supabase: SupabaseClient<Database>,
  shifts: T[]
): Promise<{ shifts: Array<ShiftWithFilledSlots<T>>; error?: Error | { message: string } }> {
  const { counts, error } = await getAssignedCountsByShiftId(
    supabase,
    shifts.map((shift) => shift.id)
  )

  if (error) {
    return { shifts: shifts.map((shift) => ({ ...shift, filled_slots: shift.filled_slots ?? 0 })), error }
  }

  return {
    shifts: shifts.map((shift) => ({
      ...shift,
      filled_slots: counts.get(shift.id) ?? 0,
    })),
  }
}
