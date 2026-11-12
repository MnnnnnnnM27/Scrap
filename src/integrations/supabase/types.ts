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
    PostgrestVersion: "14.17"
  }
  public: {
    Tables: {
      document_collaborators: {
        Row: {
          document_id: string
          joined_at: string
          user_id: string
        }
        Insert: {
          document_id: string
          joined_at?: string
          user_id: string
        }
        Update: {
          document_id?: string
          joined_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "document_collaborators_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
        ]
      }
      documents: {
        Row: {
          book: Json | null
          collab_token: string | null
          content: Json
          created_at: string
          deleted_at: string | null
          editing_seconds: number
          folder_id: string | null
          id: string
          kind: string
          plain_text: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          book?: Json | null
          collab_token?: string | null
          content?: Json
          created_at?: string
          deleted_at?: string | null
          editing_seconds?: number
          folder_id?: string | null
          id?: string
          kind: string
          plain_text?: string
          title?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          book?: Json | null
          collab_token?: string | null
          content?: Json
          created_at?: string
          deleted_at?: string | null
          editing_seconds?: number
          folder_id?: string | null
          id?: string
          kind?: string
          plain_text?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "documents_folder_id_fkey"
            columns: ["folder_id"]
            isOneToOne: false
            referencedRelation: "folders"
            referencedColumns: ["id"]
          },
        ]
      }
      folders: {
        Row: {
          color: string
          created_at: string
          id: string
          name: string
          position: number
          updated_at: string
          user_id: string
        }
        Insert: {
          color?: string
          created_at?: string
          id?: string
          name: string
          position?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          color?: string
          created_at?: string
          id?: string
          name?: string
          position?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          display_name: string | null
          id: string
        }
        Insert: {
          created_at?: string
          display_name?: string | null
          id: string
        }
        Update: {
          created_at?: string
          display_name?: string | null
          id?: string
        }
        Relationships: []
      }
      share_links: {
        Row: {
          created_at: string
          document_id: string
          id: string
          revoked_at: string | null
          token: string
          user_id: string
        }
        Insert: {
          created_at?: string
          document_id: string
          id?: string
          revoked_at?: string | null
          token?: string
          user_id: string
        }
        Update: {
          created_at?: string
          document_id?: string
          id?: string
          revoked_at?: string | null
          token?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "share_links_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
        ]
      }
      user_settings: {
        Row: {
          accent_theme: string
          canvas_width: string
          card_previews: boolean
          collab_color: string
          color_mode: string
          confirm_trash: boolean
          font: string
          ghost_autocomplete: boolean
          pages_only: boolean
          show_ask_gemini: boolean
          show_cursors: boolean
          show_names: boolean
          show_whats_new: boolean
          show_word_count: boolean
          slash_commands: boolean
          spellcheck: boolean
          toolbar_side: string
          typeliner: boolean
          updated_at: string
          user_id: string
          username: string
        }
        Insert: {
          accent_theme?: string
          canvas_width?: string
          card_previews?: boolean
          collab_color?: string
          color_mode?: string
          confirm_trash?: boolean
          font?: string
          ghost_autocomplete?: boolean
          pages_only?: boolean
          show_ask_gemini?: boolean
          show_cursors?: boolean
          show_names?: boolean
          show_whats_new?: boolean
          show_word_count?: boolean
          slash_commands?: boolean
          spellcheck?: boolean
          toolbar_side?: string
          typeliner?: boolean
          updated_at?: string
          user_id: string
          username?: string
        }
        Update: {
          accent_theme?: string
          canvas_width?: string
          card_previews?: boolean
          collab_color?: string
          color_mode?: string
          confirm_trash?: boolean
          font?: string
          ghost_autocomplete?: boolean
          pages_only?: boolean
          show_ask_gemini?: boolean
          show_cursors?: boolean
          show_names?: boolean
          show_whats_new?: boolean
          show_word_count?: boolean
          slash_commands?: boolean
          spellcheck?: boolean
          toolbar_side?: string
          typeliner?: boolean
          updated_at?: string
          user_id?: string
          username?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      doc_people: {
        Args: { _docs: string[] }
        Returns: {
          color: string
          document_id: string
          is_owner: boolean
          user_id: string
          username: string
        }[]
      }
      get_shared_document: {
        Args: { _token: string }
        Returns: {
          content: Json
          kind: string
          title: string
          updated_at: string
        }[]
      }
      is_doc_collaborator: {
        Args: { _doc: string; _uid: string }
        Returns: boolean
      }
      is_doc_owner: { Args: { _doc: string; _uid: string }; Returns: boolean }
      join_collab: { Args: { _token: string }; Returns: string }
      purge_expired_trash: { Args: never; Returns: undefined }
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
