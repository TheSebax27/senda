export type PlaceType = 'restaurante' | 'ciudad' | 'pueblo' | 'hotel' | 'experiencia'
export type Priority = 'alta' | 'media' | 'baja'

export interface Place {
  id: string
  created_at: string
  name: string
  type: PlaceType
  city: string
  country: string
  visit_date: string
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
