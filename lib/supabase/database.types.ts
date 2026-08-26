// Supabase database types for GI-ENIT platform
// Reflects remote schema + features_v2 migration

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          first_name: string | null
          last_name: string | null
          role: 'admin' | 'membre_bureau' | 'membre_actif' | 'bureau' | 'membre'
          pole_id: string | null
          pole_ids?: string[] | null
          points_total: number
          year: string | null
          avatar_url: string | null
          phone: string | null
          classe: '1AGI1' | '1AGI2' | '1AGI3' | '2AGI1' | '2AGI2' | '2AGI3' | '3AGI' | null
          linkedin_url: string | null
          prepa_section: 'MP' | 'PC' | 'PT' | null
          prepa_etablissement: string | null
          rang_concours: number | null
          cv_url: string | null
          statut_membre: 'senior' | 'actif' | 'alumni' | null
          statut_membre_verified: boolean
          profile_completed_at: string | null
          is_active: boolean
          created_at?: string
          joined_at?: string
        }
        Insert: { id: string } & Partial<Database['public']['Tables']['profiles']['Row']>
        Update: Partial<Database['public']['Tables']['profiles']['Row']>
        Relationships: [
          {
            foreignKeyName: 'profiles_pole_id_fkey'
            columns: ['pole_id']
            isOneToOne: false
            referencedRelation: 'poles'
            referencedColumns: ['id']
          }
        ]
      }
      poles: {
        Row: { id: string; name: string; slug?: string; description?: string | null }
        Insert: Partial<Database['public']['Tables']['poles']['Row']>
        Update: Partial<Database['public']['Tables']['poles']['Row']>
        Relationships: []
      }
      activities: {
        Row: {
          id: string
          title: string
          type: 'event' | 'visit' | 'formation'
          description: string | null
          content?: string | null
          date_start: string
          date?: string | null
          date_end: string | null
          location: string | null
          capacity: number | null
          pole_id: string | null
          prerequisites: string | null
          recap_url: string | null
          training_material_url: string | null
          trainer_name: string | null
          cover_image_url?: string | null
          image_url?: string | null
          photo_urls?: string[] | null
          status: 'draft' | 'published' | 'cancelled' | 'done' | 'archived'
          entreprise?: string | null
          google_form_url?: string | null
          created_by?: string | null
          created_at?: string
        }
        Insert: Partial<Database['public']['Tables']['activities']['Row']>
        Update: Partial<Database['public']['Tables']['activities']['Row']>
        Relationships: []
      }
      event_registrations: {
        Row: {
          id: string
          activity_id: string
          user_id: string
          status: 'confirmed' | 'waitlisted' | 'cancelled'
          queue_position: number | null
          attended: boolean | null
          points_awarded?: boolean
          registered_at?: string
          created_at?: string
        }
        Insert: Partial<Database['public']['Tables']['event_registrations']['Row']>
        Update: Partial<Database['public']['Tables']['event_registrations']['Row']>
        Relationships: []
      }
      projects: {
        Row: {
          id: string
          title: string
          description: string | null
          lead_id: string | null
          deadline: string | null
          pole_id: string | null
          progress: number
          status: 'planned' | 'in_progress' | 'paused' | 'done'
          created_at: string
        }
        Insert: Partial<Database['public']['Tables']['projects']['Row']>
        Update: Partial<Database['public']['Tables']['projects']['Row']>
        Relationships: []
      }
      project_members: {
        Row: {
          id: string
          project_id: string
          user_id: string
          joined_at: string
          points_awarded: boolean
        }
        Insert: Partial<Database['public']['Tables']['project_members']['Row']>
        Update: Partial<Database['public']['Tables']['project_members']['Row']>
        Relationships: []
      }
      project_tasks: {
        Row: {
          id: string
          project_id: string
          title: string
          status: 'todo' | 'in_progress' | 'done'
          assignee_id: string | null
          created_at: string
        }
        Insert: Partial<Database['public']['Tables']['project_tasks']['Row']>
        Update: Partial<Database['public']['Tables']['project_tasks']['Row']>
        Relationships: []
      }
      announcements: {
        Row: {
          id: string
          title: string
          content: string | null
          excerpt: string | null
          pinned: boolean
          created_at: string
          pole_id: string | null
          created_by: string | null
        }
        Insert: Partial<Database['public']['Tables']['announcements']['Row']>
        Update: Partial<Database['public']['Tables']['announcements']['Row']>
        Relationships: []
      }
      resources: {
        Row: {
          id: string
          title: string
          file_url: string
          category: string | null
          description: string | null
          drive_url: string | null
          pole_id: string | null
          uploaded_by: string
          created_at: string
        }
        Insert: Partial<Database['public']['Tables']['resources']['Row']>
        Update: Partial<Database['public']['Tables']['resources']['Row']>
        Relationships: []
      }
      points_log: {
        Row: {
          id: string
          user_id: string
          reason: string
          amount: number
          created_at: string
          related_activity_id?: string | null
          related_project_id?: string | null
        }
        Insert: Partial<Database['public']['Tables']['points_log']['Row']>
        Update: Partial<Database['public']['Tables']['points_log']['Row']>
        Relationships: []
      }
      notifications: {
        Row: {
          id: string
          user_id: string
          type: 'points' | 'message' | 'système'
          title: string
          message: string
          link: string | null
          read: boolean
          created_at: string
        }
        Insert: Partial<Database['public']['Tables']['notifications']['Row']>
        Update: Partial<Database['public']['Tables']['notifications']['Row']>
        Relationships: [
          {
            foreignKeyName: 'notifications_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          }
        ]
      }
      invitations: {
        Row: {
          id: string
          email: string
          role: 'membre_actif' | 'membre_bureau'
          token: string
          status: 'pending' | 'accepted' | 'expired' | 'cancelled'
          expires_at: string
          created_by: string | null
          created_at: string
          accepted_at: string | null
        }
        Insert: Partial<Database['public']['Tables']['invitations']['Row']>
        Update: Partial<Database['public']['Tables']['invitations']['Row']>
        Relationships: []
      }
    }
    Views: {
      leaderboard: {
        Row: {
          user_id: string
          first_name: string | null
          last_name: string | null
          avatar_url: string | null
          pole_id: string | null
          pole_name: string | null
          points_total: number
          rank: number
        }
        Relationships: []
      }
    }
    Functions: {
      register_to_activity: { Args: { p_activity_id: string }; Returns: undefined }
      cancel_registration: { Args: { p_registration_id: string }; Returns: undefined }
    }
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}
