'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { useAuth } from '@/contexts/auth-context'

interface Session {
  id: string
  title: string
  description: string
  type: string
  category: string
  day: string
  start_time: string
  end_time: string
  venues: {
    name: string
    address: string
  }
  registration_count: number
}

const SESSION_TYPES = ['Keynote', 'Panel', 'Workshop', 'Talk', 'Networking', 'Office Hours', 'Demo', 'Social']
const SESSION_CATEGORIES = ['Fundraising', 'Product', 'Engineering', 'Design', 'Marketing', 'Operations', 'Leadership', 'Community', 'Hiring', 'Legal & Finance', 'Health & Wellness', 'Other']
const DAYS = [
  { date: '2026-05-04', label: 'Mon' },
  { date: '2026-05-05', label: 'Tue' },
  { date: '2026-05-06', label: 'Wed' },
  { date: '2026-05-07', label: 'Thu' },
  { date: '2026-05-08', label: 'Fri' },
]

export default function EventsPage() {
  const { user } = useAuth()
  const [sessions, setSessions] = useState<Session[]>([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({
    day: '',
    type: '',
    category: '',
    search: '',
  })

  const fetchSessions = useCallback(async () => {
    try {
      const params = new URLSearchParams()
      if (filters.day) params.append('day', filters.day)
      if (filters.type) params.append('type', filters.type)
      if (filters.category) params.append('category', filters.category)

      const response = await fetch(`/api/sessions?${params}`)
      const data = await response.json()

      if (response.ok) {
        let filteredSessions = data.sessions || []
        
        if (filters.search) {
          filteredSessions = filteredSessions.filter((session: Session) =>
            session.title.toLowerCase().includes(filters.search.toLowerCase()) ||
            session.description.toLowerCase().includes(filters.search.toLowerCase())
          )
        }
        
        setSessions(filteredSessions)
      }
    } catch (error) {
      console.error('Error fetching sessions:', error)
    } finally {
      setLoading(false)
    }
  }, [filters])

  useEffect(() => {
    const fetchData = async () => {
      await fetchSessions()
    }
    fetchData()
  }, [fetchSessions])

  const formatTime = (timeString: string) => {
    return new Date(timeString).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    })
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-light flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-text">Loading events...</p>
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
            <h1 className="text-xl font-bold text-charcoal">Revel Events</h1>
          </div>
          
          <nav className="flex items-center gap-6">
            <Link href="/" className="text-teal hover:underline">Home</Link>
            <Link href="/events" className="text-teal font-medium">Events</Link>
            {user && <Link href="/schedule" className="text-gray-text hover:text-teal transition-colors">Schedule</Link>}
            {user && <Link href="/profile" className="text-gray-text hover:text-teal transition-colors">Profile</Link>}
            {!user && (
              <Link href="/auth/login" className="bg-teal-500 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-teal-600 transition-colors">
                Sign In
              </Link>
            )}
          </nav>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-charcoal mb-2">Browse Events</h1>
          <p className="text-gray-text">Boulder Startup Week 2026 · May 4–8</p>
        </div>

        {/* Filters */}
        <div className="bg-white p-6 rounded-lg border border-gray-border mb-8">
          <div className="grid md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
              <input
                type="text"
                placeholder="Search events..."
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                className="input"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Day</label>
              <select
                value={filters.day}
                onChange={(e) => setFilters({ ...filters, day: e.target.value })}
                className="input"
              >
                <option value="">All Days</option>
                {DAYS.map((day) => (
                  <option key={day.date} value={day.date}>
                    {day.label}, {formatDate(day.date)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
              <select
                value={filters.type}
                onChange={(e) => setFilters({ ...filters, type: e.target.value })}
                className="input"
              >
                <option value="">All Types</option>
                {SESSION_TYPES.map((type) => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
              <select
                value={filters.category}
                onChange={(e) => setFilters({ ...filters, category: e.target.value })}
                className="input"
              >
                <option value="">All Categories</option>
                {SESSION_CATEGORIES.map((category) => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Events Grid */}
        {sessions.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-text text-lg">No events found matching your criteria.</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sessions.map((session) => (
              <div key={session.id} className="card hover:shadow-lg transition-shadow">
                <div className="mb-4">
                  <span className="badge-featured">{session.type}</span>
                  <span className="badge-default ml-2">{session.category}</span>
                </div>
                
                <h3 className="text-lg font-semibold text-charcoal mb-2">{session.title}</h3>
                
                <p className="text-gray-text text-sm mb-4 line-clamp-3">
                  {session.description || 'No description available.'}
                </p>

                <div className="space-y-2 text-sm text-gray-text mb-4">
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    {formatDate(session.day)}
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {formatTime(session.start_time)} - {formatTime(session.end_time)}
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    {session.venues.name}
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-text">
                    {session.registration_count} registered
                  </span>
                  
                  {user ? (
                    <Link
                      href={`/events/${session.id}`}
                      className="text-teal hover:underline text-sm font-medium"
                    >
                      View Details
                    </Link>
                  ) : (
                    <Link
                      href="/auth/login"
                      className="text-teal hover:underline text-sm font-medium"
                    >
                      Sign in to register
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
