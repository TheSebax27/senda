import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import { supabase } from '../lib/supabase'
import type { Note, NoteInsert } from '../types'
import { useAuth } from './AuthContext'

interface NotasContextType {
  notes: Note[]
  loading: boolean
  addNote: (note: NoteInsert) => Promise<{ error: string | null }>
  updateNote: (id: string, updates: Partial<NoteInsert>) => Promise<{ error: string | null }>
  deleteNote: (id: string) => Promise<void>
}

const NotasContext = createContext<NotasContextType | null>(null)

export function NotasProvider({ children }: { children: ReactNode }) {
  const [notes, setNotes] = useState<Note[]>([])
  const [loading, setLoading] = useState(true)
  const { user } = useAuth()

  useEffect(() => {
    fetchNotes()
  }, [])

  async function fetchNotes() {
    setLoading(true)
    const { data } = await supabase
      .from('notes')
      .select('*, profile:profiles(display_name, avatar_url)')
      .order('note_date', { ascending: false, nullsFirst: false })
    setNotes((data as Note[]) || [])
    setLoading(false)
  }

  const addNote = async (noteData: NoteInsert): Promise<{ error: string | null }> => {
    const { data, error } = await supabase
      .from('notes')
      .insert({ ...noteData, created_by: user?.id ?? null })
      .select('*, profile:profiles(display_name, avatar_url)')
      .single()
    if (error) return { error: error.message }
    if (data) setNotes(prev => [data as Note, ...prev])
    return { error: null }
  }

  const updateNote = async (id: string, updates: Partial<NoteInsert>): Promise<{ error: string | null }> => {
    const { error } = await supabase
      .from('notes')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
    if (error) return { error: error.message }
    setNotes(prev => prev.map(n => n.id === id ? { ...n, ...updates } : n))
    return { error: null }
  }

  const deleteNote = async (id: string) => {
    await supabase.from('notes').delete().eq('id', id)
    setNotes(prev => prev.filter(n => n.id !== id))
  }

  return (
    <NotasContext.Provider value={{ notes, loading, addNote, updateNote, deleteNote }}>
      {children}
    </NotasContext.Provider>
  )
}

export function useNotas() {
  const ctx = useContext(NotasContext)
  if (!ctx) throw new Error('useNotas must be used within NotasProvider')
  return ctx
}
