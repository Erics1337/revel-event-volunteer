'use client'

import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { User } from '@supabase/supabase-js'
import { Database } from '@/lib/supabase/database.types'
import { createClient } from '@/lib/supabase/client'

type AuthUser = Database['public']['Tables']['users']['Row']

interface AuthContextType {
  user: User | null
  profile: AuthUser | null
  loading: boolean
  signOut: () => Promise<void>
  signInWithMagicLink: (email: string, nextPath?: string) => Promise<{ error: { message: string } | null }>
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchProfile = useCallback(async (userId: string) => {
    try {
      const supabase = createClient()
      
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single()

      if (error && error.code !== 'PGRST116') { // PGRST116 is "not found"
        console.error('Error fetching profile:', error)
      } else {
        setProfile(data)
      }
    } catch (error) {
      console.error('Error fetching profile:', error)
    }
  }, [])

  useEffect(() => {
    let subscription: { unsubscribe: () => void } | null = null
    
    const initializeAuth = async () => {
      try {
        const supabase = createClient()
        
        // Get initial session
        const { data: { session } } = await supabase.auth.getSession()
        
        if (session?.user) {
          setUser(session.user)
          await fetchProfile(session.user.id)
        }
        
        setLoading(false)

        // Listen for auth changes
        const { data: { subscription: authSubscription } } = supabase.auth.onAuthStateChange(
          async (event: string, session: { user: User } | null) => {
            if (session?.user) {
              setUser(session.user)
              await fetchProfile(session.user.id)
            } else {
              setUser(null)
              setProfile(null)
            }
            setLoading(false)
          }
        )
        
        subscription = authSubscription
        
      } catch (error) {
        console.error('Error initializing auth:', error)
        setLoading(false)
      }
    }
    
    initializeAuth()
    
    return () => {
      if (subscription) {
        subscription.unsubscribe()
      }
    }
  }, [fetchProfile])

  const signOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
  }

  const signInWithMagicLink = async (email: string, nextPath = '/') => {
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/confirm?next=${encodeURIComponent(nextPath)}`,
      },
    })
    return { error }
  }

  const refreshProfile = async () => {
    if (user) {
      await fetchProfile(user.id)
    }
  }

  const value = {
    user,
    profile,
    loading,
    signOut,
    signInWithMagicLink,
    refreshProfile,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
