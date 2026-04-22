Connecting to db 5432
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
      registrations: {
        Row: {
          id: string
          registered_at: string | null
          session_id: string | null
          user_id: string | null
        }
        Insert: {
          id?: string
          registered_at?: string | null
          session_id?: string | null
          user_id?: string | null
        }
        Update: {
          id?: string
          registered_at?: string | null
          session_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "registrations_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "registrations_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      sessions: {
        Row: {
          attachments: Json | null
          category: string
          created_at: string | null
          day: string
          description: string | null
          end_time: string
          id: string
          registration_count: number | null
          start_time: string
          status: string
          title: string
          type: string
          updated_at: string | null
          venue_id: string | null
        }
        Insert: {
          attachments?: Json | null
          category: string
          created_at?: string | null
          day: string
          description?: string | null
          end_time: string
          id?: string
          registration_count?: number | null
          start_time: string
          status?: string
          title: string
          type: string
          updated_at?: string | null
          venue_id?: string | null
        }
        Update: {
          attachments?: Json | null
          category?: string
          created_at?: string | null
          day?: string
          description?: string | null
          end_time?: string
          id?: string
          registration_count?: number | null
          start_time?: string
          status?: string
          title?: string
          type?: string
          updated_at?: string | null
          venue_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sessions_venue_id_fkey"
            columns: ["venue_id"]
            isOneToOne: false
            referencedRelation: "venues"
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
          volunteer_id: string | null
        }
        Insert: {
          assigned_at?: string | null
          id?: string
          shift_id?: string | null
          volunteer_id?: string | null
        }
        Update: {
          assigned_at?: string | null
          id?: string
          shift_id?: string | null
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
          created_at: string | null
          day: string
          end_time: string
          filled_slots: number | null
          id: string
          location: string
          role: string
          start_time: string
          total_slots: number
        }
        Insert: {
          created_at?: string | null
          day: string
          end_time: string
          filled_slots?: number | null
          id?: string
          location: string
          role: string
          start_time: string
          total_slots: number
        }
        Update: {
          created_at?: string | null
          day?: string
          end_time?: string
          filled_slots?: number | null
          id?: string
          location?: string
          role?: string
          start_time?: string
          total_slots?: number
        }
        Relationships: []
      }
      volunteers: {
        Row: {
          availability: string[] | null
          created_at: string | null
          id: string
          phone: string
          shift_count: number | null
          status: string
          user_id: string | null
        }
        Insert: {
          availability?: string[] | null
          created_at?: string | null
          id?: string
          phone: string
          shift_count?: number | null
          status?: string
          user_id?: string | null
        }
        Update: {
          availability?: string[] | null
          created_at?: string | null
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
      is_event_admin: { Args: never; Returns: boolean }
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const

