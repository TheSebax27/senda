export type PlaceType = string
export const DEFAULT_PLACE_TYPES: PlaceType[] = [
  'restaurante', 'cafetería', 'bar', 'ciudad', 'pueblo', 'hotel', 'experiencia', 'playa',
]
export type Priority = 'alta' | 'media' | 'baja'

export interface Place {
  id: string
  created_at: string
  name: string
  type: PlaceType
  city: string
  country: string
  visit_date: string | null
  rating_avg: number   // calculado desde ratings table
  price_level: number
  would_return: boolean | null
  story: string | null
  lat: number | null
  lng: number | null
  photos: string[]
  is_favorite: boolean
  is_planned: boolean
  priority: Priority | null
  budget: string | null
  planned_year: number | null
  tags: string[]
  created_by: string | null  // user id de quien lo creó
}

export interface Rating {
  id: string
  created_at: string
  place_id: string
  user_id: string
  rating: number         // 1–5
  comment: string | null
  // joined
  profile?: {
    display_name: string
    username: string
    avatar_url: string | null
  }
}

export type PlaceInsert = Omit<Place, 'id' | 'created_at' | 'rating_avg'>
export type RatingInsert = Omit<Rating, 'id' | 'created_at' | 'profile'>

export interface Revisit {
  id: string
  created_at: string
  place_id: string
  visit_date: string
  note: string | null
  photo_url: string | null
  created_by: string | null
  profile?: {
    display_name: string
    avatar_url: string | null
  }
}
export type RevisitInsert = Omit<Revisit, 'id' | 'created_at' | 'profile'>

export interface Note {
  id: string
  created_at: string
  updated_at: string
  title: string
  content: string
  note_date: string | null
  created_by: string | null
  profile?: {
    display_name: string
    avatar_url: string | null
  }
}
export type NoteInsert = Omit<Note, 'id' | 'created_at' | 'updated_at' | 'profile'>
