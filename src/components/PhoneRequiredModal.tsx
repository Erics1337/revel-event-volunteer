'use client'

import { useState } from 'react'
import { useAuth } from '@/contexts/auth-context'

/**
 * Blocks the app with a modal whenever the signed-in user's profile is
 * missing a phone number. Mounted once at the root layout.
 *
 * Intentionally non-dismissable: the only way out is to submit a phone or
 * sign out.
 */
export function PhoneRequiredModal() {
  const { user, profile, loading, refreshProfile, signOut } = useAuth()
  const [phone, setPhone] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  // Wait for the initial auth/profile load before deciding whether to show.
  if (loading) return null
  if (!user) return null
  // Profile may still be fetching on the first tick after sign-in.
  if (!profile) return null
  if (profile.phone && profile.phone.trim().length > 0) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    const trimmed = phone.trim()
    if (!trimmed) {
      setError('Phone number is required.')
      return
    }

    setSubmitting(true)
    try {
      const response = await fetch('/api/users/me', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: trimmed }),
      })

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}))
        setError(payload.error || 'Could not save phone number. Please try again.')
        setSubmitting(false)
        return
      }

      await refreshProfile()
      // On success the effect re-renders and the modal unmounts itself.
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
            Complete your profile
          </h2>
          <p className="text-gray-text text-sm">
            We need a phone number on file so we can reach you about volunteer shifts.
          </p>
          {user.email && (
            <p className="mt-2 text-xs text-gray-text">
              Signed in as <strong>{user.email}</strong>
            </p>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
              {error}
            </div>
          )}

          <div>
            <label htmlFor="phone-required-input" className="block text-sm font-medium text-gray-700 mb-2">
              Phone number
            </label>
            <input
              id="phone-required-input"
              type="tel"
              required
              autoComplete="tel"
              autoFocus
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full px-4 py-3 border border-gray-border rounded-md focus:ring-2 focus:ring-teal focus:border-transparent"
              placeholder="(555) 123-4567"
            />
            <p className="mt-1 text-xs text-gray-text">
              Used for shift reminders and day-of coordination only.
            </p>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-teal-500 text-white py-3 px-4 rounded-md font-medium hover:bg-teal-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? 'Saving...' : 'Save and continue'}
          </button>
        </form>

        <div className="mt-5 text-center">
          <button
            type="button"
            onClick={() => signOut()}
            className="text-sm text-gray-text hover:text-teal hover:underline"
          >
            Sign out instead
          </button>
        </div>
      </div>
    </div>
  )
}
