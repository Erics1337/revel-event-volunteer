import { Database } from '@/lib/supabase/database.types'

export type AppRole = Database['public']['Tables']['users']['Row']['role']

export function isAdmin(role: AppRole | null | undefined): boolean {
  return role === 'admin'
}

export function isVolunteer(role: AppRole | null | undefined): boolean {
  return role === 'volunteer'
}
