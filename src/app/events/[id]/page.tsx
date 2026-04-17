'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
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
    id: string
    name: string
    address: string
    maps_url?: string
  }
  registration_count: number
  attachments: { label: string; url: string }[]
}

export default function EventDetailPage() {
  const { user } = useAuth()
  const params = useParams()
  const router = useRouter()
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [isRegistered, setIsRegistered] = useState(false)
  const [registering, setRegistering] = useState(false)

  useEffect(() => {
    if (params.id) {
      fetchSession()
    }
  }, [params.id])

  const fetchSession = async () => {
    try {
      const response = await fetch(`/api/sessions/${params.id}`)
      const data = await response.json()

      if (response.ok) {
        setSession(data.session)
        
        // Check if user is registered
        if (user) {
          checkRegistration()
        }
      } else {
        if (response.status === 404) {
          router.push('/events')
        }
      }
    } catch (error) {
      console.error('Error fetching session:', error)
    } finally {
      setLoading(false)
    }
  }

  const checkRegistration = async () => {
    try {
      const response = await fetch('/api/schedule')
      const data = await response.json()
      
      if (response.ok) {
        const registered = data.sessions.some((s: Session) => s.id === params.id)
        setIsRegistered(registered)
      }
    } catch (error) {
      console.error('Error checking registration:', error)
    }
  }

  const handleRegister = async () => {
    if (!user) {
      router.push('/auth/login')
      return
    }

    setRegistering(true)
    try {
      const response = await fetch(`/api/schedule/${params.id}`, {
        method: 'POST',
      })

      if (response.ok) {
        setIsRegistered(true)
        setSession(prev => prev ? {
          ...prev,
          registration_count: prev.registration_count + 1
        } : null)
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to register')
      }
    } catch (error) {
      console.error('Error registering:', error)
      alert('Failed to register')
    } finally {
      setRegistering(false)
    }
  }

  const handleUnregister = async () => {
    if (!user) return

    setRegistering(true)
    try {
      const response = await fetch(`/api/schedule/${params.id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        setIsRegistered(false)
        setSession(prev => prev ? {
          ...prev,
          registration_count: prev.registration_count - 1
        } : null)
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to unregister')
      }
    } catch (error) {
      console.error('Error unregistering:', error)
      alert('Failed to unregister')
    } finally {
      setRegistering(false)
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
      year: 'numeric',
    })
  }

  const openMaps = () => {
    if (session?.venues.maps_url) {
      window.open(session.venues.maps_url, '_blank')
    } else {
      const address = encodeURIComponent(session?.venues.address || '')
      window.open(`https://maps.google.com/?q=${address}`, '_blank')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-light flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-text">Loading event...</p>
        </div>
      </div>
    )
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-gray-light flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-text text-lg">Event not found</p>
          <Link href="/events" className="text-teal hover:underline mt-4 inline-block">
            Back to Events
          </Link>
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
            <Link href="/" className="text-gray-text hover:text-teal transition-colors">Home</Link>
            <Link href="/events" className="text-teal font-medium">Events</Link>
            {user && (
              <Link href="/schedule" className="text-gray-text hover:text-teal transition-colors">Schedule</Link>
            )}
            {user && (
              <Link href="/profile" className="text-gray-text hover:text-teal transition-colors">Profile</Link>
            )}
            {!user && (
              <Link href="/auth/login" className="bg-teal-500 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-teal-600 transition-colors">
                Sign In
              </Link>
            )}
          </nav>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-6">
          <Link href="/events" className="text-teal hover:underline text-sm">
            ← Back to Events
          </Link>
        </div>

        <div className="bg-white rounded-lg border border-gray-border p-8">
          {/* Event Header */}
          <div className="mb-6">
            <div className="flex flex-wrap gap-2 mb-4">
              <span className="badge-featured">{session.type}</span>
              <span className="badge-default">{session.category}</span>
            </div>
            
            <h1 className="text-3xl font-bold text-charcoal mb-4">{session.title}</h1>
            
            <div className="grid md:grid-cols-2 gap-4 text-sm text-gray-text">
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
              
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                {session.registration_count} registered
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-charcoal mb-3">Description</h2>
            <p className="text-gray-text whitespace-pre-wrap">
              {session.description || 'No description available.'}
            </p>
          </div>

          {/* Venue */}
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-charcoal mb-3">Venue</h2>
            <div className="bg-gray-light p-4 rounded-md">
              <p className="font-medium text-charcoal mb-1">{session.venues.name}</p>
              <p className="text-gray-text text-sm mb-3">{session.venues.address}</p>
              <button
                onClick={openMaps}
                className="text-teal hover:underline text-sm flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
                Open in Maps
              </button>
            </div>
          </div>

          {/* Attachments */}
          {session.attachments && session.attachments.length > 0 && (
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-charcoal mb-3">Attachments</h2>
              <div className="space-y-2">
                {session.attachments.map((attachment, index) => (
                  <a
                    key={index}
                    href={attachment.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-teal hover:underline text-sm"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    {attachment.label}
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Registration Button */}
          <div className="border-t border-gray-border pt-6">
            {user ? (
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-text">
                    {isRegistered ? 'You are registered for this event' : 'Register for this event'}
                  </p>
                  {isRegistered && (
                    <p className="text-sm text-teal">Check your schedule for details</p>
                  )}
                </div>
                
                <button
                  onClick={isRegistered ? handleUnregister : handleRegister}
                  disabled={registering}
                  className={`px-6 py-3 rounded-md font-medium transition-colors ${
                    isRegistered
                      ? 'border border-gray-border text-gray-text hover:border-red-500 hover:text-red-500'
                      : 'bg-teal-500 text-white hover:bg-teal-600'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {registering ? 'Loading...' : isRegistered ? 'Unregister' : 'Register'}
                </button>
              </div>
            ) : (
              <div className="text-center">
                <p className="text-gray-text mb-4">Sign in to register for this event</p>
                <Link
                  href="/auth/login"
                  className="bg-teal-500 text-white px-6 py-3 rounded-md font-medium hover:bg-teal-600 transition-colors"
                >
                  Sign In to Register
                </Link>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
