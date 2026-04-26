'use client'

import { useEffect, useState } from 'react'
import { User } from '@supabase/supabase-js'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/auth-context'
import { Database } from '@/lib/supabase/database.types'
import { EVENT_DAYS } from '@/lib/shifts/types'

const DEFAULT_AVAILABILITY = EVENT_DAYS.map((day) => day.date)

interface VolunteerContextResponse {
  volunteer?: {
    availability?: string[] | null
  } | null
  error?: string
}

type AuthProfile = Database['public']['Tables']['users']['Row']

/**
 * Blocks the app with a modal whenever the signed-in user's profile is
 * missing required volunteer setup details. Mounted once at the root layout.
 *
 * Intentionally non-dismissable: the only way out is to complete setup or
 * sign out.
 */
export function PhoneRequiredModal() {
  const { user, profile, loading, refreshProfile, signOut } = useAuth()
  if (loading) return null
  if (!user) return null
  // Profile may still be fetching on the first tick after sign-in.
  if (!profile) return null

  return (
    <RequiredProfileModalBody
      key={`${user.id}:${profile.updated_at ?? 'initial'}`}
      user={user}
      profile={profile}
      refreshProfile={refreshProfile}
      signOut={signOut}
    />
  )
}

function RequiredProfileModalBody({
  user,
  profile,
  refreshProfile,
  signOut,
}: {
  user: User
  profile: AuthProfile
  refreshProfile: () => Promise<void>
  signOut: () => Promise<void>
}) {
  const router = useRouter()
  const completionStorageKey = `volunteer-profile-complete:${user.id}`
  const [name, setName] = useState(profile.name ?? '')
  const [phone, setPhone] = useState(profile.phone ?? '')
  const [savedAvailability, setSavedAvailability] = useState<string[]>([])
  const [availability, setAvailability] = useState<string[]>([])
  const [availabilityLoaded, setAvailabilityLoaded] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [signingOut, setSigningOut] = useState(false)
  const [completed, setCompleted] = useState(() => {
    if (typeof window === 'undefined') return false
    return window.sessionStorage.getItem(completionStorageKey) === '1'
  })
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false

    const loadVolunteer = async () => {
      try {
        const response = await fetch('/api/volunteers/me')
        const payload = (await response.json().catch(() => ({}))) as VolunteerContextResponse

        if (!response.ok) {
          throw new Error(payload.error || 'Could not load volunteer setup')
        }

        if (!cancelled) {
          const nextAvailability = payload.volunteer?.availability ?? []
          setSavedAvailability(nextAvailability)
          setAvailability(nextAvailability.length > 0 ? nextAvailability : DEFAULT_AVAILABILITY)
        }
      } catch (error) {
        if (!cancelled) {
          setError(
            error instanceof Error
              ? error.message
              : 'Could not load volunteer setup. Please try again.'
          )
          setSavedAvailability([])
          setAvailability(DEFAULT_AVAILABILITY)
        }
      } finally {
        if (!cancelled) {
          setAvailabilityLoaded(true)
        }
      }
    }

    void loadVolunteer()

    return () => {
      cancelled = true
    }
  }, [])

  const toggleAvailabilityDay = (day: string) => {
    setAvailability((current) =>
      current.includes(day) ? current.filter((value) => value !== day) : [...current, day]
    )
  }

  const isComplete =
    profile.name.trim().length > 0 &&
    (profile.phone?.trim().length ?? 0) > 0 &&
    savedAvailability.length > 0

  useEffect(() => {
    if (!completed) return

    const timeoutId = window.setTimeout(() => {
      window.sessionStorage.removeItem(completionStorageKey)
      router.push('/open-shifts')
    }, 1200)

    return () => {
      window.clearTimeout(timeoutId)
    }
  }, [completed, completionStorageKey, router])

  const handleBrowseOpenShifts = () => {
    window.sessionStorage.removeItem(completionStorageKey)
    setCompleted(false)
    router.push('/open-shifts')
  }

  const handleSignOut = async () => {
    if (signingOut) return

    setSigningOut(true)
    try {
      await signOut()
    } finally {
      router.replace('/auth/login')
    }
  }

  if (!availabilityLoaded) return null

  if (isComplete && !completed) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    const trimmedName = name.trim()
    const trimmed = phone.trim()
    if (!trimmedName) {
      setError('Name is required.')
      return
    }
    if (!trimmed) {
      setError('Phone number is required.')
      return
    }
    if (availability.length === 0) {
      setError('Select at least one day you are available.')
      return
    }

    setSubmitting(true)
    try {
      const response = await fetch('/api/volunteers/me', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: trimmedName,
          phone: trimmed,
          availability,
        }),
      })

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}))
        setError(payload.error || 'Could not save your profile. Please try again.')
        setSubmitting(false)
        return
      }

      await refreshProfile()
      window.sessionStorage.setItem(completionStorageKey, '1')
      setSavedAvailability(availability)
      setCompleted(true)
      setSubmitting(false)
    } catch {
      setError('Network error. Please try again.')
      setSubmitting(false)
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="phone-required-title"
      className="fixed inset-0 z-1000 flex items-center justify-center bg-black/60 px-4"
    >
      <div className="max-w-md w-full bg-white rounded-lg shadow-card p-8">
        <div className="text-center mb-6">
          <h2 id="phone-required-title" className="text-2xl font-bold text-charcoal mb-2">
            {completed ? '🎉 Thanks, you’re all set' : 'Complete your profile'}
          </h2>
          {completed ? null : (
            <p className="text-gray-text text-sm">
              We need your name, phone number, and volunteer availability before you can request shifts.
            </p>
          )}
          {!completed && user.email && (
            <p className="mt-2 text-xs text-gray-text">
              Signed in as <strong>{user.email}</strong>
            </p>
          )}
        </div>

        {completed ? (
          <div className="space-y-4 text-center">
            <button
              type="button"
              onClick={handleBrowseOpenShifts}
              className="cursor-pointer block w-full rounded-md bg-teal-500 py-3 px-4 text-center font-medium text-white transition-colors hover:bg-teal-600"
            >
              Browse open shifts
            </button>
          </div>
        ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
              {error}
            </div>
          )}

          <div>
            <label htmlFor="name-required-input" className="block text-sm font-medium text-gray-700 mb-2">
              Full name
            </label>
            <input
              id="name-required-input"
              type="text"
              required
              autoComplete="name"
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-3 border border-gray-border rounded-md focus:ring-2 focus:ring-teal focus:border-transparent"
              placeholder="Your full name"
            />
          </div>

          <div>
            <label htmlFor="phone-required-input" className="block text-sm font-medium text-gray-700 mb-2">
              Phone number
            </label>
            <input
              id="phone-required-input"
              type="tel"
              required
              autoComplete="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full px-4 py-3 border border-gray-border rounded-md focus:ring-2 focus:ring-teal focus:border-transparent"
              placeholder="(555) 123-4567"
            />
            <p className="mt-1 text-xs text-gray-text">
              Used for shift reminders and day-of coordination only.
            </p>
          </div>

          <div>
            <p className="block text-sm font-medium text-gray-700 mb-2">Days you can volunteer</p>
            <div className="flex flex-wrap gap-2">
              {EVENT_DAYS.map((day) => {
                const active = availability.includes(day.date)

                return (
                  <button
                    key={day.date}
                    type="button"
                    onClick={() => toggleAvailabilityDay(day.date)}
                    className={`rounded-full border px-3 py-2 text-sm font-medium transition ${
                      active
                        ? 'border-teal bg-teal text-white'
                        : 'border-gray-border bg-white text-gray-700 hover:border-teal hover:text-teal'
                    }`}
                    aria-pressed={active}
                  >
                    {day.label}
                  </button>
                )
              })}
            </div>
            <p className="mt-1 text-xs text-gray-text">
              Pick every day you would be open to helping during Boulder Startup Week.
            </p>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="cursor-pointer w-full bg-teal-500 text-white py-3 px-4 rounded-md font-medium hover:bg-teal-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? 'Saving...' : 'Save and continue'}
          </button>
        </form>
        )}

        <div className="mt-5 text-center">
          <button
            type="button"
            onClick={handleSignOut}
            disabled={signingOut}
            className="cursor-pointer text-sm text-gray-text hover:text-teal hover:underline disabled:cursor-wait disabled:opacity-70"
          >
            {signingOut ? 'Signing out...' : 'Sign out instead'}
          </button>
        </div>
      </div>
    </div>
  )
}
