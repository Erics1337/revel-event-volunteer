'use client'

import { useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { useAuth } from '@/contexts/auth-context'

function LoginContent() {
  const searchParams = useSearchParams()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const { signInWithMagicLink } = useAuth()
  const nextPath = searchParams.get('redirectTo') || '/'

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { error } = await signInWithMagicLink(email, nextPath)

    if (error) {
      setError(error.message)
    } else {
      setSuccess(true)
    }
    
    setLoading(false)
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gray-light flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-card p-8 text-center">
          <div className="w-16 h-16 bg-teal-light rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-teal" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-charcoal mb-2">Check your email</h1>
          <p className="text-gray-text mb-6">
            We sent a magic link to <strong>{email}</strong>. Click the link to sign in.
          </p>
          <button
            onClick={() => setSuccess(false)}
            className="text-teal hover:underline text-sm"
          >
            Use a different email address
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-light flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-card p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-charcoal mb-2">Sign In</h1>
          <p className="text-gray-text">
            Boulder Startup Week 2026 · May 4–8
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
              {error}
            </div>
          )}

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
              Email address
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 border border-gray-border rounded-md focus:ring-2 focus:ring-teal focus:border-transparent"
              placeholder="Enter your email"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-teal-500 text-white py-3 px-4 rounded-md font-medium hover:bg-teal-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Sending link...' : 'Send magic link'}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-gray-text">
          <p>
            Don&apos;t have an account? The magic link will create one for you.
          </p>
        </div>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-light flex items-center justify-center"><div className="text-gray-text">Loading...</div></div>}>
      <LoginContent />
    </Suspense>
  )
}
