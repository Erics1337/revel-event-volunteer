export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      admin_allowlist: {
        Row: {
          email: string
        }
        Insert: {
          email: string
        }
        Update: {
          email?: string
        }
        Relationships: []
      }
      event_sessions: {
        Row: {
          address: string | null
          created_at: string | null
          day: string
          end_time: string
          id: string
          location: string
          start_time: string
          title: string
          updated_at: string | null
        }
        Insert: {
          address?: string | null
          created_at?: string | null
          day: string
          end_time: string
          id?: string
          location: string
          start_time: string
          title: string
          updated_at?: string | null
        }
        Update: {
          address?: string | null
          created_at?: string | null
          day?: string
          end_time?: string
          id?: string
          location?: string
          start_time?: string
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      notification_settings: {
        Row: {
          id: string
          reminder_1h_enabled: boolean
          reminder_1h_hours_before: number
          reminder_24h_enabled: boolean
          reminder_24h_hours_before: number
          reminders_enabled: boolean
          send_window_minutes: number
          time_zone: string
          updated_at: string
        }
        Insert: {
          id?: string
          reminder_1h_enabled?: boolean
          reminder_1h_hours_before?: number
          reminder_24h_enabled?: boolean
          reminder_24h_hours_before?: number
          reminders_enabled?: boolean
          send_window_minutes?: number
          time_zone?: string
          updated_at?: string
        }
        Update: {
          id?: string
          reminder_1h_enabled?: boolean
          reminder_1h_hours_before?: number
          reminder_24h_enabled?: boolean
          reminder_24h_hours_before?: number
          reminders_enabled?: boolean
          send_window_minutes?: number
          time_zone?: string
          updated_at?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          body: string
          created_at: string | null
          error_message: string | null
          id: string
          recipient_email: string | null
          scheduled_for: string
          sent_at: string | null
          shift_id: string | null
          status: string
          subject: string
          type: string
          user_id: string | null
        }
        Insert: {
          body: string
          created_at?: string | null
          error_message?: string | null
          id?: string
          recipient_email?: string | null
          scheduled_for: string
          sent_at?: string | null
          shift_id?: string | null
          status?: string
          subject: string
          type: string
          user_id?: string | null
        }
        Update: {
          body?: string
          created_at?: string | null
          error_message?: string | null
          id?: string
          recipient_email?: string | null
          scheduled_for?: string
          sent_at?: string | null
          shift_id?: string | null
          status?: string
          subject?: string
          type?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notifications_shift_id_fkey"
            columns: ["shift_id"]
            isOneToOne: false
            referencedRelation: "volunteer_shifts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          avatar_url: string | null
          badges: string[] | null
          bio: string | null
          blocked: boolean | null
          created_at: string | null
          email: string
          email_public: boolean | null
          headline: string | null
          id: string
          linkedin_url: string | null
          name: string
          phone: string | null
          role: string
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          badges?: string[] | null
          bio?: string | null
          blocked?: boolean | null
          created_at?: string | null
          email: string
          email_public?: boolean | null
          headline?: string | null
          id?: string
          linkedin_url?: string | null
          name: string
          phone?: string | null
          role?: string
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          badges?: string[] | null
          bio?: string | null
          blocked?: boolean | null
          created_at?: string | null
          email?: string
          email_public?: boolean | null
          headline?: string | null
          id?: string
          linkedin_url?: string | null
          name?: string
          phone?: string | null
          role?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      venues: {
        Row: {
          address: string
          capacity: number | null
          created_at: string | null
          id: string
          maps_url: string | null
          name: string
          updated_at: string | null
        }
        Insert: {
          address: string
          capacity?: number | null
          created_at?: string | null
          id?: string
          maps_url?: string | null
          name: string
          updated_at?: string | null
        }
        Update: {
          address?: string
          capacity?: number | null
          created_at?: string | null
          id?: string
          maps_url?: string | null
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      volunteer_assignments: {
        Row: {
          assigned_at: string | null
          id: string
          shift_id: string | null
          status: string
          volunteer_id: string | null
        }
        Insert: {
          assigned_at?: string | null
          id?: string
          shift_id?: string | null
          status?: string
          volunteer_id?: string | null
        }
        Update: {
          assigned_at?: string | null
          id?: string
          shift_id?: string | null
          status?: string
          volunteer_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "volunteer_assignments_shift_id_fkey"
            columns: ["shift_id"]
            isOneToOne: false
            referencedRelation: "volunteer_shifts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "volunteer_assignments_volunteer_id_fkey"
            columns: ["volunteer_id"]
            isOneToOne: false
            referencedRelation: "volunteers"
            referencedColumns: ["id"]
          },
        ]
      }
      volunteer_shifts: {
        Row: {
          address: string | null
          created_at: string | null
          day: string
          end_time: string
          event_session_id: string | null
          filled_slots: number
          id: string
          location: string
          notes: string | null
          role: string
          start_time: string
          total_slots: number
          urgent: boolean
        }
        Insert: {
          address?: string | null
          created_at?: string | null
          day: string
          end_time: string
          event_session_id?: string | null
          filled_slots?: number
          id?: string
          location: string
          notes?: string | null
          role: string
          start_time: string
          total_slots: number
          urgent?: boolean
        }
        Update: {
          address?: string | null
          created_at?: string | null
          day?: string
          end_time?: string
          event_session_id?: string | null
          filled_slots?: number
          id?: string
          location?: string
          notes?: string | null
          role?: string
          start_time?: string
          total_slots?: number
          urgent?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "volunteer_shifts_event_session_id_fkey"
            columns: ["event_session_id"]
            isOneToOne: false
            referencedRelation: "event_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      volunteers: {
        Row: {
          availability: string[] | null
          created_at: string | null
          fallback_email: string | null
          fallback_name: string | null
          id: string
          phone: string
          shift_count: number | null
          status: string
          user_id: string | null
        }
        Insert: {
          availability?: string[] | null
          created_at?: string | null
          fallback_email?: string | null
          fallback_name?: string | null
          id?: string
          phone: string
          shift_count?: number | null
          status?: string
          user_id?: string | null
        }
        Update: {
          availability?: string[] | null
          created_at?: string | null
          fallback_email?: string | null
          fallback_name?: string | null
          id?: string
          phone?: string
          shift_count?: number | null
          status?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "volunteers_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      configure_reminder_cron: {
        Args: {
          app_base_url_secret_name?: string
          cron_schedule?: string
          cron_secret_name?: string
        }
        Returns: undefined
      }
      is_admin: { Args: never; Returns: boolean }
    }
    Enums: {
      venue_name:
        | "Boulder Associates"
        | "Boulder Public Library"
        | "Brand Studios"
        | "Canyon Center"
        | "Rosetta Hall"
        | "SOVRN"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      venue_name: [
        "Boulder Associates",
        "Boulder Public Library",
        "Brand Studios",
        "Canyon Center",
        "Rosetta Hall",
        "SOVRN",
      ],
    },
  },
} as const

