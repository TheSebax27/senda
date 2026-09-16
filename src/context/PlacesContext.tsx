import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import { supabase } from '../lib/supabase'
import type { Place, PlaceInsert } from '../types'

interface PlacesContextType {
  places: Place[]
  loading: boolean
  addPlace: (place: PlaceInsert) => Promise<void>
  updatePlace: (id: string, updates: Partial<PlaceInsert>) => Promise<void>
  deletePlace: (id: string) => Promise<void>
  convertToMemory: (id: string) => Promise<void>
  refresh: () => Promise<void>
}

const PlacesContext = createContext<PlacesContextType | null>(null)

export function PlacesProvider({ children }: { children: ReactNode }) {
  const [places, setPlaces] = useState<Place[]>([])
  const [loading, setLoading] = useState(true)

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
    const { data, error } = await supabase
      .from('places')
      .insert(placeData)
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

  return (
    <PlacesContext.Provider value={{ places, loading, addPlace, updatePlace, deletePlace, convertToMemory, refresh: fetchPlaces }}>
      {children}
    </PlacesContext.Provider>
  )
}

export function usePlaces() {
  const ctx = useContext(PlacesContext)
  if (!ctx) throw new Error('usePlaces must be used within PlacesProvider')
  return ctx
}
