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
  priority: Priority | null
  budget: string | null
  planned_year: number | null
  tags: string[]
}

export type PlaceInsert = Omit<Place, 'id' | 'created_at'>
