export type Database = {
  public: {
    Tables: {
      annotations: {
        Row: {
          id: string
          user_id: string | null
          page_url: string
          elements: any
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          page_url: string
          elements?: any
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          page_url?: string
          elements?: any
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {}
    Functions: {}
    Enums: {}
    CompositeTypes: {}
  }
}