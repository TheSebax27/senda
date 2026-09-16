import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || ''
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type Database = {
  public: {
    Tables: {
      places: {
        Row: {
          id: string
          created_at: string
          name: string
          type: 'restaurante' | 'ciudad' | 'pueblo' | 'hotel' | 'experiencia'
          city: string
          country: string
          visit_date: string
          rating_him: number
          rating_her: number
          rating_avg: number
          price_level: number
          would_return: boolean | null
          story: string | null
          comment_him: string | null
          comment_her: string | null
          lat: number | null
          lng: number | null
          photos: string[]
          is_favorite: boolean
          is_planned: boolean
          priority: 'alta' | 'media' | 'baja' | null
          budget: string | null
          planned_year: number | null
          tags: string[]
        }
        Insert: Omit<Database['public']['Tables']['places']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['places']['Insert']>
      }
    }
  }
}
