import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import type { User, Session } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'

export interface Profile {
  id: string
  username: string
  display_name: string
  avatar_url: string | null
  created_at: string
}

interface AuthContextType {
  user: User | null
  profile: Profile | null
  session: Session | null
  loading: boolean
  signUp: (email: string, password: string, username: string, displayName: string) => Promise<{ error: string | null }>
  signIn: (email: string, password: string) => Promise<{ error: string | null }>
  signOut: () => Promise<void>
  updateProfile: (updates: Partial<Pick<Profile, 'display_name' | 'username' | 'avatar_url'>>) => Promise<{ error: string | null }>
  uploadAvatar: (file: File) => Promise<{ url: string | null; error: string | null }>
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      if (session?.user) fetchProfile(session.user.id)
      else setLoading(false)
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      setUser(session?.user ?? null)
      if (session?.user) fetchProfile(session.user.id)
      else {
        setProfile(null)
        setLoading(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  async function fetchProfile(userId: string) {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()
      if (!error && data) setProfile(data as Profile)
    } catch (err) {
      console.error('Error fetching profile:', err)
    } finally {
      setLoading(false)
    }
  }

  const signUp = async (
    email: string,
    password: string,
    username: string,
    displayName: string
  ): Promise<{ error: string | null }> => {
    try {
      // Check username not taken
      const { data: existing } = await supabase
        .from('profiles')
        .select('id')
        .eq('username', username.toLowerCase().trim())
        .maybeSingle()

      if (existing) return { error: 'Ese nombre de usuario ya está en uso.' }

      // Check email not taken (Supabase returns error on duplicate)
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          // Skip email confirmation — handled in Supabase dashboard
          data: {
            username: username.toLowerCase().trim(),
            display_name: displayName.trim(),
          }
        }
      })

      if (error) {
        if (error.message.includes('already registered') || error.message.includes('User already registered')) {
          return { error: 'Ese correo ya está registrado.' }
        }
        return { error: error.message }
      }

      // Create profile record
      if (data.user) {
        const { error: profileError } = await supabase.from('profiles').insert({
          id: data.user.id,
          username: username.toLowerCase().trim(),
          display_name: displayName.trim(),
          avatar_url: null,
        })
        if (profileError) console.error('Profile insert error:', profileError)
        else await fetchProfile(data.user.id)
      }

      return { error: null }
    } catch (err) {
      return { error: 'Ocurrió un error inesperado.' }
    }
  }

  const signIn = async (email: string, password: string): Promise<{ error: string | null }> => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      })
      if (error) {
        if (error.message.includes('Invalid login')) return { error: 'Correo o contraseña incorrectos.' }
        return { error: error.message }
      }
      return { error: null }
    } catch {
      return { error: 'Ocurrió un error inesperado.' }
    }
  }

  const signOut = async () => {
    await supabase.auth.signOut()
    setProfile(null)
  }

  const updateProfile = async (
    updates: Partial<Pick<Profile, 'display_name' | 'username' | 'avatar_url'>>
  ): Promise<{ error: string | null }> => {
    if (!user) return { error: 'No hay sesión activa.' }
    try {
      // If changing username, check it's not taken
      if (updates.username) {
        const clean = updates.username.toLowerCase().trim()
        const { data: existing } = await supabase
          .from('profiles')
          .select('id')
          .eq('username', clean)
          .neq('id', user.id)
          .maybeSingle()
        if (existing) return { error: 'Ese nombre de usuario ya está en uso.' }
        updates.username = clean
      }

      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.id)

      if (error) return { error: error.message }
      await fetchProfile(user.id)
      return { error: null }
    } catch {
      return { error: 'Ocurrió un error inesperado.' }
    }
  }

  const uploadAvatar = async (file: File): Promise<{ url: string | null; error: string | null }> => {
    if (!user) return { url: null, error: 'No hay sesión activa.' }
    try {
      const ext = file.name.split('.').pop()
      const path = `${user.id}/avatar.${ext}`

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(path, file, { upsert: true })

      if (uploadError) return { url: null, error: uploadError.message }

      const { data } = supabase.storage.from('avatars').getPublicUrl(path)
      const url = data.publicUrl + `?t=${Date.now()}` // bust cache
      await updateProfile({ avatar_url: url })
      return { url, error: null }
    } catch {
      return { url: null, error: 'Error subiendo la foto.' }
    }
  }

  return (
    <AuthContext.Provider value={{ user, profile, session, loading, signUp, signIn, signOut, updateProfile, uploadAvatar }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
