export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          name: string
          avatar_url: string | null
          headline: string | null
          bio: string | null
          linkedin_url: string | null
          email_public: boolean
          role: 'event_admin' | 'volunteer'
          badges: ('facilitator' | 'volunteer' | 'sponsor')[]
          blocked: boolean
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['users']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<Database['public']['Tables']['users']['Row'], 'id' | 'created_at'>>
      }
      venues: {
        Row: {
          id: string
          name: string
          address: string
          maps_url: string | null
          capacity: number | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['venues']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<Database['public']['Tables']['venues']['Row'], 'id' | 'created_at'>>
      }
      sessions: {
        Row: {
          id: string
          title: string
          description: string
          type: 'Keynote' | 'Panel' | 'Workshop' | 'Talk' | 'Networking' | 'Office Hours' | 'Demo' | 'Social'
          category: 'Fundraising' | 'Product' | 'Engineering' | 'Design' | 'Marketing' | 'Operations' | 'Leadership' | 'Community' | 'Hiring' | 'Legal & Finance' | 'Health & Wellness' | 'Other'
          status: 'draft' | 'published'
          day: string // '2026-05-04' format
          start_time: string // ISO 8601
          end_time: string // ISO 8601
          venue_id: string
          registration_count: number
          attachments: { label: string; url: string }[]
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['sessions']['Row'], 'id' | 'created_at' | 'updated_at' | 'registration_count'>
        Update: Partial<Omit<Database['public']['Tables']['sessions']['Row'], 'id' | 'created_at'>>
      }
      registrations: {
        Row: {
          id: string
          user_id: string
          session_id: string
          registered_at: string
        }
        Insert: Omit<Database['public']['Tables']['registrations']['Row'], 'id' | 'registered_at'>
        Update: Partial<Database['public']['Tables']['registrations']['Row']>
      }
      volunteers: {
        Row: {
          id: string
          user_id: string
          phone: string
          availability: string[] // array of dates
          status: 'confirmed' | 'pending'
          shift_count: number
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['volunteers']['Row'], 'id' | 'created_at' | 'shift_count'>
        Update: Partial<Omit<Database['public']['Tables']['volunteers']['Row'], 'id' | 'created_at'>>
      }
      volunteer_shifts: {
        Row: {
          id: string
          role: string
          day: string
          start_time: string
          end_time: string
          location: string
          total_slots: number
          filled_slots: number
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['volunteer_shifts']['Row'], 'id' | 'created_at' | 'filled_slots'>
        Update: Partial<Omit<Database['public']['Tables']['volunteer_shifts']['Row'], 'id' | 'created_at'>>
      }
      volunteer_assignments: {
        Row: {
          id: string
          volunteer_id: string
          shift_id: string
          assigned_at: string
        }
        Insert: Omit<Database['public']['Tables']['volunteer_assignments']['Row'], 'id' | 'assigned_at'>
        Update: Partial<Database['public']['Tables']['volunteer_assignments']['Row']>
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
