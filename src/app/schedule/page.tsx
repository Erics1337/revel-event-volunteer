'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { useAuth } from '@/contexts/auth-context'
import { downloadIcs } from '@/lib/ical'

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
}

export default function SchedulePage() {
  const { user, profile } = useAuth()
  const [sessions, setSessions] = useState<Session[]>([])
  const [loading, setLoading] = useState(true)
  const [exporting, setExporting] = useState(false)

  const fetchSchedule = useCallback(async () => {
    try {
      const response = await fetch('/api/schedule')
      const data = await response.json()

      if (response.ok) {
        setSessions(data.sessions || [])
      }
    } catch (error) {
      console.error('Error fetching schedule:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (user) {
      const fetchData = async () => {
        await fetchSchedule()
      }
      fetchData()
    }
  }, [user, fetchSchedule])

  const handleExportIcs = async () => {
    setExporting(true)
    try {
      const response = await fetch('/api/schedule?format=ics')
      
      if (response.ok) {
        const icsData = await response.text()
        const blob = new Blob([icsData], { type: 'text/calendar;charset=utf-8' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = 'bsw-2026-schedule.ics'
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
      } else {
        alert('Failed to export calendar')
      }
    } catch (error) {
      console.error('Error exporting calendar:', error)
      alert('Failed to export calendar')
    } finally {
      setExporting(false)
    }
  }

  const handleUnregister = async (sessionId: string) => {
    try {
      const response = await fetch(`/api/schedule/${sessionId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        setSessions(sessions.filter(s => s.id !== sessionId))
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to unregister')
      }
    } catch (error) {
      console.error('Error unregistering:', error)
      alert('Failed to unregister')
    }
  }

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

  const groupSessionsByDay = (sessions: Session[]) => {
    return sessions.reduce((groups: Record<string, Session[]>, session) => {
      const day = session.day
      if (!groups[day]) {
        groups[day] = []
      }
      groups[day].push(session)
      return groups
    }, {})
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-light flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-text text-lg mb-4">Please sign in to view your schedule</p>
          <Link
            href="/auth/login"
            className="bg-teal-500 text-white px-6 py-3 rounded-md font-medium hover:bg-teal-600 transition-colors"
          >
            Sign In
          </Link>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-light flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-text">Loading your schedule...</p>
        </div>
      </div>
    )
  }

  const sessionsByDay = groupSessionsByDay(sessions)
  const sortedDays = Object.keys(sessionsByDay).sort()

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
            <Link href="/" className="text-gray-text hover:text-teal transition-colors">Home</Link>
            <Link href="/events" className="text-gray-text hover:text-teal transition-colors">Events</Link>
            <Link href="/schedule" className="text-teal font-medium">Schedule</Link>
            <Link href="/profile" className="text-gray-text hover:text-teal transition-colors">Profile</Link>
          </nav>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-3xl font-bold text-charcoal">My Schedule</h1>
            <div className="flex gap-3">
              <Link
                href="/events"
                className="btn-secondary"
              >
                Browse Events
              </Link>
              {sessions.length > 0 && (
                <button
                  onClick={handleExportIcs}
                  disabled={exporting}
                  className="btn-secondary flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  {exporting ? 'Exporting...' : 'Export Calendar'}
                </button>
              )}
            </div>
          </div>
          <p className="text-gray-text">
            Welcome, {profile?.name || user?.email}! You have {sessions.length} event{sessions.length !== 1 ? 's' : ''} registered.
          </p>
        </div>

        {sessions.length === 0 ? (
          <div className="bg-white rounded-lg border border-gray-border p-12 text-center">
            <div className="w-16 h-16 bg-gray-light rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gray-text" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-charcoal mb-2">No events registered yet</h2>
            <p className="text-gray-text mb-6">
              Browse events and register for sessions to build your personal schedule.
            </p>
            <Link
              href="/events"
              className="bg-teal-500 text-white px-6 py-3 rounded-md font-medium hover:bg-teal-600 transition-colors"
            >
              Browse Events
            </Link>
          </div>
        ) : (
          <div className="space-y-8">
            {sortedDays.map((day) => (
              <div key={day}>
                <h2 className="text-xl font-semibold text-charcoal mb-4">
                  {formatDate(day)}
                </h2>
                <div className="space-y-4">
                  {sessionsByDay[day]
                    .sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime())
                    .map((session) => (
                      <div key={session.id} className="card">
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="badge-featured">{session.type}</span>
                              <span className="badge-default">{session.category}</span>
                            </div>
                            
                            <h3 className="text-lg font-semibold text-charcoal mb-2">
                              <Link
                                href={`/events/${session.id}`}
                                className="hover:text-teal transition-colors"
                              >
                                {session.title}
                              </Link>
                            </h3>
                            
                            <p className="text-gray-text text-sm mb-3 line-clamp-2">
                              {session.description || 'No description available.'}
                            </p>

                            <div className="flex flex-wrap gap-4 text-sm text-gray-text">
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
                          </div>

                          <div className="flex items-center gap-3">
                            <Link
                              href={`/events/${session.id}`}
                              className="text-teal hover:underline text-sm font-medium"
                            >
                              View Details
                            </Link>
                            <button
                              onClick={() => handleUnregister(session.id)}
                              className="text-red-500 hover:text-red-700 text-sm font-medium"
                            >
                              Unregister
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
