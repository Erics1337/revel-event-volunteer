'use client'

import Link from 'next/link'
import { useAuth } from '@/contexts/auth-context'
import { isAdmin } from '@/lib/auth/roles'

export default function Home() {
  const { user, profile, loading, signOut } = useAuth()

  const handleSignOut = async () => {
    await signOut()
    window.location.href = '/auth/login'
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-light flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-text">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-light">
      {/* Header */}
      <header className="bg-white border-b border-gray-border">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-teal-500 rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-sm">R</span>
            </div>
            <h1 className="text-xl font-bold text-charcoal">BSW Volunteers</h1>
          </div>
          
          <nav className="flex items-center gap-6">
            <Link href="/events" className="text-gray-text hover:text-teal transition-colors">
              Shifts
            </Link>
            {user && (
              <Link href="/schedule" className="text-gray-text hover:text-teal transition-colors">
                My Schedule
              </Link>
            )}
            {user ? (
              <div className="flex items-center gap-4">
                {isAdmin(profile?.role) && (
                  <Link href="/admin" className="text-gray-text hover:text-teal transition-colors">
                    Admin
                  </Link>
                )}
                <Link href="/profile" className="text-gray-text hover:text-teal transition-colors">
                  Profile
                </Link>
                <button
                  onClick={handleSignOut}
                  className="text-sm text-gray-text hover:text-teal transition-colors"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <Link
                href="/auth/login"
                className="bg-teal-500 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-teal-600 transition-colors"
              >
                Sign In
              </Link>
            )}
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-6xl mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-charcoal mb-4">
            Boulder Startup Week 2026 · Volunteer
          </h1>
          <p className="text-xl text-gray-text mb-8">
            May 4–8, 2026 · Pick up a shift, run the event, meet the community.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/events"
              className="bg-teal-500 text-white px-8 py-3 rounded-md font-medium hover:bg-teal-600 transition-colors"
            >
              Browse Shifts
            </Link>
            {user ? (
              <Link
                href="/schedule"
                className="border border-teal-500 text-teal px-8 py-3 rounded-md font-medium hover:bg-teal-500 hover:text-white transition-colors"
              >
                My Schedule
              </Link>
            ) : (
              <Link
                href="/auth/login"
                className="border border-teal-500 text-teal px-8 py-3 rounded-md font-medium hover:bg-teal-500 hover:text-white transition-colors"
              >
                Sign In
              </Link>
            )}
          </div>
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          <div className="bg-white p-6 rounded-lg border border-gray-border">
            <div className="w-12 h-12 bg-teal-light rounded-full flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-teal" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-charcoal mb-2">450+ Shifts</h3>
            <p className="text-gray-text">
              Room runners, door monitors, building runners, and location captains across six venues.
            </p>
          </div>

          <div className="bg-white p-6 rounded-lg border border-gray-border">
            <div className="w-12 h-12 bg-teal-light rounded-full flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-teal" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-charcoal mb-2">Run the Show</h3>
            <p className="text-gray-text">
              Volunteers are the reason 4,000+ attendees have a great week. Claim your slot.
            </p>
          </div>

          <div className="bg-white p-6 rounded-lg border border-gray-border">
            <div className="w-12 h-12 bg-teal-light rounded-full flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-teal" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-charcoal mb-2">Free & Open Source</h3>
            <p className="text-gray-text">
              No ads, no paywalls. Community-built for the community.
            </p>
          </div>
        </div>

        {/* Call to Action */}
        <div className="bg-white p-8 rounded-lg border border-gray-border text-center">
          <h2 className="text-2xl font-bold text-charcoal mb-4">
            Ready to volunteer for BSW 2026?
          </h2>
          <p className="text-gray-text mb-6">
            Create an account, pick the shifts that fit your schedule, and we’ll handle the rest.
          </p>
          <Link
            href="/auth/login"
            className="bg-teal-500 text-white px-8 py-3 rounded-md font-medium hover:bg-teal-600 transition-colors"
          >
            Get Started
          </Link>
        </div>
      </main>
    </div>
  )
}
