export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      daily_records: {
        Row: {
          created_at: string
          entered_by: string | null
          far_review_from_ayah: number | null
          far_review_from_surah: number | null
          far_review_pages: number | null
          far_review_to_ayah: number | null
          far_review_to_surah: number | null
          halaqah_id: string
          hifz_from_ayah: number | null
          hifz_from_surah: number | null
          hifz_pages: number | null
          hifz_to_ayah: number | null
          hifz_to_surah: number | null
          id: string
          is_absent: boolean
          near_review_from_ayah: number | null
          near_review_from_surah: number | null
          near_review_pages: number | null
          near_review_to_ayah: number | null
          near_review_to_surah: number | null
          record_date: string
          student_id: string
          tilawa_from_ayah: number | null
          tilawa_from_surah: number | null
          tilawa_pages: number | null
          tilawa_to_ayah: number | null
          tilawa_to_surah: number | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          entered_by?: string | null
          far_review_from_ayah?: number | null
          far_review_from_surah?: number | null
          far_review_pages?: number | null
          far_review_to_ayah?: number | null
          far_review_to_surah?: number | null
          halaqah_id: string
          hifz_from_ayah?: number | null
          hifz_from_surah?: number | null
          hifz_pages?: number | null
          hifz_to_ayah?: number | null
          hifz_to_surah?: number | null
          id?: string
          is_absent?: boolean
          near_review_from_ayah?: number | null
          near_review_from_surah?: number | null
          near_review_pages?: number | null
          near_review_to_ayah?: number | null
          near_review_to_surah?: number | null
          record_date?: string
          student_id: string
          tilawa_from_ayah?: number | null
          tilawa_from_surah?: number | null
          tilawa_pages?: number | null
          tilawa_to_ayah?: number | null
          tilawa_to_surah?: number | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          entered_by?: string | null
          far_review_from_ayah?: number | null
          far_review_from_surah?: number | null
          far_review_pages?: number | null
          far_review_to_ayah?: number | null
          far_review_to_surah?: number | null
          halaqah_id?: string
          hifz_from_ayah?: number | null
          hifz_from_surah?: number | null
          hifz_pages?: number | null
          hifz_to_ayah?: number | null
          hifz_to_surah?: number | null
          id?: string
          is_absent?: boolean
          near_review_from_ayah?: number | null
          near_review_from_surah?: number | null
          near_review_pages?: number | null
          near_review_to_ayah?: number | null
          near_review_to_surah?: number | null
          record_date?: string
          student_id?: string
          tilawa_from_ayah?: number | null
          tilawa_from_surah?: number | null
          tilawa_pages?: number | null
          tilawa_to_ayah?: number | null
          tilawa_to_surah?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "daily_records_halaqah_id_fkey"
            columns: ["halaqah_id"]
            isOneToOne: false
            referencedRelation: "halaqat"
            referencedColumns: ["id"]
          },
        ]
      }
      data_entry_assignments: {
        Row: {
          id: string
          track_id: string
          user_id: string
        }
        Insert: {
          id?: string
          track_id: string
          user_id: string
        }
        Update: {
          id?: string
          track_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "data_entry_assignments_track_id_fkey"
            columns: ["track_id"]
            isOneToOne: false
            referencedRelation: "tracks"
            referencedColumns: ["id"]
          },
        ]
      }
      halaqah_members: {
        Row: {
          created_at: string
          halaqah_id: string
          id: string
          is_archived: boolean
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          halaqah_id: string
          id?: string
          is_archived?: boolean
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          halaqah_id?: string
          id?: string
          is_archived?: boolean
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "halaqah_members_halaqah_id_fkey"
            columns: ["halaqah_id"]
            isOneToOne: false
            referencedRelation: "halaqat"
            referencedColumns: ["id"]
          },
        ]
      }
      halaqat: {
        Row: {
          created_at: string
          id: string
          name: string
          track_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          track_id: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          track_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "halaqat_track_id_fkey"
            columns: ["track_id"]
            isOneToOne: false
            referencedRelation: "tracks"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          age: string | null
          country: string | null
          created_at: string
          education_level: string | null
          full_name: string
          hifz_direction: Database["public"]["Enums"]["hifz_direction"] | null
          id: string
          is_archived: boolean
          phone: string | null
          updated_at: string
          user_id: string
          whatsapp: string | null
        }
        Insert: {
          age?: string | null
          country?: string | null
          created_at?: string
          education_level?: string | null
          full_name: string
          hifz_direction?: Database["public"]["Enums"]["hifz_direction"] | null
          id?: string
          is_archived?: boolean
          phone?: string | null
          updated_at?: string
          user_id: string
          whatsapp?: string | null
        }
        Update: {
          age?: string | null
          country?: string | null
          created_at?: string
          education_level?: string | null
          full_name?: string
          hifz_direction?: Database["public"]["Enums"]["hifz_direction"] | null
          id?: string
          is_archived?: boolean
          phone?: string | null
          updated_at?: string
          user_id?: string
          whatsapp?: string | null
        }
        Relationships: []
      }
      quran_pages: {
        Row: {
          ayah_number: number
          id: number
          page_number: number
          surah_name: string
          surah_number: number
        }
        Insert: {
          ayah_number: number
          id?: number
          page_number: number
          surah_name: string
          surah_number: number
        }
        Update: {
          ayah_number?: number
          id?: number
          page_number?: number
          surah_name?: string
          surah_number?: number
        }
        Relationships: []
      }
      registration_settings: {
        Row: {
          custom_fields: Json | null
          id: string
          is_open: boolean
          updated_at: string
        }
        Insert: {
          custom_fields?: Json | null
          id?: string
          is_open?: boolean
          updated_at?: string
        }
        Update: {
          custom_fields?: Json | null
          id?: string
          is_open?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      track_managers: {
        Row: {
          id: string
          track_id: string
          user_id: string
        }
        Insert: {
          id?: string
          track_id: string
          user_id: string
        }
        Update: {
          id?: string
          track_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "track_managers_track_id_fkey"
            columns: ["track_id"]
            isOneToOne: false
            referencedRelation: "tracks"
            referencedColumns: ["id"]
          },
        ]
      }
      tracks: {
        Row: {
          created_at: string
          id: string
          name: string
          type: Database["public"]["Enums"]["track_type"]
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          type: Database["public"]["Enums"]["track_type"]
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          type?: Database["public"]["Enums"]["track_type"]
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role:
        | "leader"
        | "data_entry"
        | "teacher"
        | "supervisor"
        | "track_manager"
        | "student"
      hifz_direction: "from_baqarah" | "from_nas" | "both"
      track_type: "girls" | "children" | "mothers" | "tilawa"
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
  public: {
    Enums: {
      app_role: [
        "leader",
        "data_entry",
        "teacher",
        "supervisor",
        "track_manager",
        "student",
      ],
      hifz_direction: ["from_baqarah", "from_nas", "both"],
      track_type: ["girls", "children", "mothers", "tilawa"],
    },
  },
} as const
