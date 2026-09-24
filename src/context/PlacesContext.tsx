import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import { supabase } from '../lib/supabase'
import type { Place, PlaceInsert, Rating, RatingInsert } from '../types'
import { useAuth } from './AuthContext'

interface PlacesContextType {
  places: Place[]
  loading: boolean
  addPlace: (place: PlaceInsert) => Promise<void>
  updatePlace: (id: string, updates: Partial<PlaceInsert>) => Promise<void>
  deletePlace: (id: string) => Promise<void>
  convertToMemory: (id: string) => Promise<void>
  refresh: () => Promise<void>
  // Ratings
  getRatings: (placeId: string) => Promise<Rating[]>
  upsertRating: (placeId: string, rating: number, comment: string | null) => Promise<{ error: string | null }>
  deleteRating: (placeId: string) => Promise<void>
}

const PlacesContext = createContext<PlacesContextType | null>(null)

export function PlacesProvider({ children }: { children: ReactNode }) {
  const [places, setPlaces] = useState<Place[]>([])
  const [loading, setLoading] = useState(true)
  const { user } = useAuth()

  useEffect(() => {
    fetchPlaces()
  }, [])

  async function fetchPlaces() {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('places')
        .select('*')
        .order('visit_date', { ascending: false, nullsFirst: false })
      if (error) throw error
      setPlaces((data as Place[]) || [])
    } catch (err) {
      console.error('Error cargando lugares:', err)
      setPlaces([])
    } finally {
      setLoading(false)
    }
  }

  const addPlace = async (placeData: PlaceInsert) => {
    const payload = { ...placeData, created_by: user?.id ?? null }
    const { data, error } = await supabase
      .from('places')
      .insert(payload)
      .select()
      .single()
    if (error) throw error
    if (data) setPlaces(prev => [data as Place, ...prev])
  }

  const updatePlace = async (id: string, updates: Partial<PlaceInsert>) => {
    const { error } = await supabase.from('places').update(updates).eq('id', id)
    if (error) throw error
    setPlaces(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p))
  }

  const deletePlace = async (id: string) => {
    const { error } = await supabase.from('places').delete().eq('id', id)
    if (error) throw error
    setPlaces(prev => prev.filter(p => p.id !== id))
  }

  const convertToMemory = async (id: string) => {
    const today = new Date().toISOString().split('T')[0]
    await updatePlace(id, { is_planned: false, visit_date: today })
  }

  // --- Ratings ---

  const getRatings = async (placeId: string): Promise<Rating[]> => {
    const { data, error } = await supabase
      .from('ratings')
      .select('*, profile:profiles(display_name, username, avatar_url)')
      .eq('place_id', placeId)
      .order('created_at', { ascending: false })
    if (error) {
      console.error('Error fetching ratings:', error)
      return []
    }
    return (data as Rating[]) || []
  }

  const upsertRating = async (
    placeId: string,
    rating: number,
    comment: string | null
  ): Promise<{ error: string | null }> => {
    if (!user) return { error: 'No hay sesión activa.' }

    const payload: RatingInsert = {
      place_id: placeId,
      user_id: user.id,
      rating,
      comment: comment || null,
    }

    // Try INSERT first; if unique violation, do UPDATE
    const { error: insertError } = await supabase
      .from('ratings')
      .insert(payload)

    if (insertError) {
      // 23505 = unique_violation (ya existe una calificación de este usuario)
      if (insertError.code === '23505') {
        const { error: updateError } = await supabase
          .from('ratings')
          .update({ rating, comment: comment || null })
          .eq('place_id', placeId)
          .eq('user_id', user.id)
        if (updateError) return { error: updateError.message }
      } else {
        return { error: insertError.message }
      }
    }

    await recalcPlaceAvg(placeId)
    return { error: null }
  }

  const deleteRating = async (placeId: string) => {
    if (!user) return
    await supabase
      .from('ratings')
      .delete()
      .eq('place_id', placeId)
      .eq('user_id', user.id)
    await recalcPlaceAvg(placeId)
  }

  async function recalcPlaceAvg(placeId: string) {
    // Fetch all ratings for this place and calculate avg
    const { data } = await supabase
      .from('ratings')
      .select('rating')
      .eq('place_id', placeId)

    if (!data) return
    const avg = data.length > 0
      ? data.reduce((sum, r) => sum + r.rating, 0) / data.length
      : 0

    const rounded = Math.round(avg * 10) / 10

    await supabase
      .from('places')
      .update({ rating_avg: rounded })
      .eq('id', placeId)

    setPlaces(prev => prev.map(p =>
      p.id === placeId ? { ...p, rating_avg: rounded } : p
    ))
  }

  return (
    <PlacesContext.Provider value={{
      places, loading,
      addPlace, updatePlace, deletePlace, convertToMemory, refresh: fetchPlaces,
      getRatings, upsertRating, deleteRating,
    }}>
      {children}
    </PlacesContext.Provider>
  )
}

export function usePlaces() {
  const ctx = useContext(PlacesContext)
  if (!ctx) throw new Error('usePlaces must be used within PlacesProvider')
  return ctx
}
