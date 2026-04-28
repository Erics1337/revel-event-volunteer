'use client'

import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { User } from '@supabase/supabase-js'
import { Database } from '@/lib/supabase/database.types'
import { createClient } from '@/lib/supabase/client'

type AuthUser = Database['public']['Tables']['users']['Row']

interface CurrentUserResponse {
  user?: AuthUser | null
  error?: string
}

interface AuthContextType {
  user: User | null
  profile: AuthUser | null
  loading: boolean
  signOut: () => Promise<void>
  signInWithMagicLink: (
    email: string,
    options?: { nextPath?: string }
  ) => Promise<{ error: { message: string } | null }>
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

async function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T | null> {
  let timeoutId: ReturnType<typeof setTimeout> | undefined

  try {
    return await Promise.race([
      promise,
      new Promise<null>((resolve) => {
        timeoutId = setTimeout(() => resolve(null), timeoutMs)
      }),
    ])
  } finally {
    if (timeoutId) {
      clearTimeout(timeoutId)
    }
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchProfile = useCallback(async (authUser: User) => {
    if (!authUser?.id) return

    try {
      const supabase = createClient()

      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', authUser.id)
        .single()

      if (data) {
        setProfile(data)
        return
      }

      // PGRST116 = no rows returned. This happens when /auth/callback didn't
      // get a chance to create the public.users row (e.g. Supabase redirected
      // the magic link straight to "/" instead of /auth/callback). Create the
      // row here so downstream UI (profile page, phone-required modal) can
      // render correctly.
      if (error && error.code === 'PGRST116') {
        const fallbackName =
          (typeof authUser.user_metadata?.full_name === 'string' &&
            authUser.user_metadata.full_name) ||
          authUser.email?.split('@')[0] ||
          'Volunteer'

        const { data: created, error: insertError } = await supabase
          .from('users')
          .insert({
            id: authUser.id,
            email: authUser.email ?? '',
            name: fallbackName,
            role: 'volunteer',
          })
          .select('*')
          .single()

        if (insertError) {
          // 23503 = foreign_key_violation. The user's session JWT references
          // an auth.users row that no longer exists (typically after a local
          // db:reset). Sign them out so the next sign-in creates a valid
          // session instead of looping on 406/409.
          if (insertError.code === '23503') {
            console.warn('Stale session detected (auth user missing); signing out.')
            await supabase.auth.signOut()
            return
          }

          // 23505 = unique_violation. Happens when a stale public.users row
          // exists for this email but with a different auth uuid (pre-FK
          // drift). Fall back to fetching by email so the UI still works;
          // the 007_users_auth_fk migration prevents new drift.
          if (insertError.code === '23505' && authUser.email) {
            const { data: existing } = await supabase
              .from('users')
              .select('*')
              .eq('email', authUser.email)
              .maybeSingle()
            if (existing) {
              setProfile(existing)
              return
            }
          }
          console.error('Error creating profile:', insertError)
          return
        }

        setProfile(created)
        return
      }

      if (error) {
        console.error('Error fetching profile:', error)
      }
    } catch (err) {
      console.error('Error fetching profile:', err)
    }
  }, [])

  useEffect(() => {
    let subscription: { unsubscribe: () => void } | null = null
    
    const initializeAuth = async () => {
      try {
        const supabase = createClient()
        
        // Get initial session
        const sessionResult = await withTimeout(supabase.auth.getSession(), 4000)
        const session = sessionResult?.data.session
        const userResult = session?.user
          ? null
          : await withTimeout(supabase.auth.getUser(), 4000)
        const authUser = session?.user ?? userResult?.data.user
        
        if (authUser) {
          setUser(authUser)
          await fetchProfile(authUser)
        } else {
          const response = await fetch('/api/users/me')
          if (response.ok) {
            const payload = (await response.json().catch(() => ({}))) as CurrentUserResponse
            if (payload.user) {
              setProfile(payload.user)
              setUser({
                id: payload.user.id,
                email: payload.user.email,
                aud: 'authenticated',
                app_metadata: {},
                user_metadata: {},
                created_at: payload.user.created_at,
              } as User)
            }
          }
        }
        
        setLoading(false)

        // Listen for auth changes
        const { data: { subscription: authSubscription } } = supabase.auth.onAuthStateChange(
          async (event: string, session: { user: User } | null) => {
            if (session?.user) {
              setUser(session.user)
              await fetchProfile(session.user)
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
    setUser(null)
    setProfile(null)
    setLoading(false)

    const { error } = await supabase.auth.signOut()
    if (error) {
      console.error('Error signing out:', error)
    }
  }

  const signInWithMagicLink = async (
    email: string,
    { nextPath = '/' }: { nextPath?: string } = {}
  ) => {
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(nextPath)}`,
      },
    })
    return { error }
  }

  const refreshProfile = async () => {
    if (user) {
      await fetchProfile(user)
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
