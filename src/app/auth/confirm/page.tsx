'use client'

import { Suspense, useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

function AuthConfirmInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [error, setError] = useState('')

  useEffect(() => {
    const supabase = createClient()
    const nextPath = searchParams.get('next') || '/'
    let settled = false

    const finishSignIn = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (session?.user && !settled) {
        settled = true
        router.replace(nextPath)
      }
    }

    void finishSignIn()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if ((event === 'SIGNED_IN' || event === 'INITIAL_SESSION') && session?.user && !settled) {
        settled = true
        router.replace(nextPath)
      }
    })

    const timeoutId = window.setTimeout(() => {
      if (!settled) {
        setError('There was a problem signing you in. The magic link may have expired or been used already.')
      }
    }, 4000)

    return () => {
      subscription.unsubscribe()
      window.clearTimeout(timeoutId)
    }
  }, [router, searchParams])

  if (error) {
    return (
      <div className="min-h-screen bg-gray-light flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-card p-8 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-charcoal mb-2">Authentication Error</h1>
          <p className="text-gray-text mb-6">{error}</p>
          <div className="space-y-3">
            <Link
              href="/auth/login"
              className="block w-full bg-teal-500 text-white py-3 px-4 rounded-md font-medium hover:bg-teal-600 transition-colors"
            >
              Try again
            </Link>
            <Link
              href="/"
              className="block w-full text-teal hover:underline"
            >
              Go to homepage
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-light flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-card p-8 text-center">
        <div className="mx-auto mb-4 w-10 h-10 rounded-full border-4 border-teal-500 border-t-transparent animate-spin" />
        <h1 className="text-2xl font-bold text-charcoal mb-2">Signing you in</h1>
        <p className="text-gray-text">Hold tight while we finish your login.</p>
      </div>
    </div>
  )
}

export default function AuthConfirmPage() {
  return (
    <Suspense>
      <AuthConfirmInner />
    </Suspense>
  )
}
