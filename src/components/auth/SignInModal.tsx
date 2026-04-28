'use client'

import { useEffect, useId, useState } from 'react'
import { useAuth } from '@/contexts/auth-context'

interface SignInModalProps {
  open: boolean
  nextPath: string
  onClose: () => void
}

export function SignInModal({ open, nextPath, onClose }: SignInModalProps) {
  const titleId = useId()
  const { signInWithMagicLink } = useAuth()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    if (!open) return

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    const originalOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = originalOverflow
    }
  }, [open, onClose])

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setLoading(true)
    setError('')

    const { error } = await signInWithMagicLink(email, { nextPath })

    if (error) {
      setError(error.message)
    } else {
      setSuccess(true)
    }

    setLoading(false)
  }

  if (!open) return null

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 px-4 py-6 backdrop-blur-sm"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose()
        }
      }}
    >
      <div className="w-full max-w-md rounded-lg bg-white p-8 shadow-[0_24px_70px_rgba(0,0,0,0.28)]">
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <h2 id={titleId} className="text-3xl font-bold text-charcoal">
              {success ? 'Check your email' : 'Sign In / Sign Up'}
            </h2>
            <p className="mt-2 text-sm leading-6 text-gray-text">
              {success
                ? `We sent a magic link to ${email}.`
                : 'Enter your email and we will send you a magic link.'}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-sm border border-gray-border text-2xl leading-none text-gray-text transition hover:border-teal hover:text-teal"
            aria-label="Close sign in"
          >
            ×
          </button>
        </div>

        {success ? (
          <div className="space-y-5 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-teal-light">
              <svg className="h-8 w-8 text-teal" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <p className="text-gray-text">
              Open the link in that email to finish signing in.
            </p>
            <button
              type="button"
              onClick={() => setSuccess(false)}
              className="cursor-pointer text-sm font-medium text-teal hover:underline"
            >
              Use a different email address
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="sign-in-modal-email" className="mb-2 block text-sm font-medium text-gray-700">
                Email address
              </label>
              <input
                id="sign-in-modal-email"
                type="email"
                required
                autoFocus
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="w-full rounded-md border border-gray-border px-4 py-3 focus:border-transparent focus:ring-2 focus:ring-teal"
                placeholder="Enter your email"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full cursor-pointer rounded-md bg-teal-500 px-4 py-3 font-medium text-white transition-colors hover:bg-teal-600 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? 'Sending link...' : 'Send magic link'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
