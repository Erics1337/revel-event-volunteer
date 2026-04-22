'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { useAuth } from '@/contexts/auth-context'
import { isAdmin } from '@/lib/auth/roles'

interface AdminStats {
  total_users: number
  total_sessions: number
  total_registrations: number
  popular_sessions: Array<{
    id: string
    title: string
    registration_count: number
  }>
  registrations_by_day: Record<string, number>
  venue_utilization: Array<{
    name: string
    sessions: number
    totalRegistrations: number
  }>
}

export default function AdminDashboard() {
  const { user, profile } = useAuth()
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchStats = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/stats')
      const data = await response.json()

      if (response.ok) {
        setStats(data.stats)
      }
    } catch (error) {
      console.error('Error fetching stats:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!isAdmin(profile?.role)) {
      return
    }

    const timeoutId = window.setTimeout(() => {
      void fetchStats()
    }, 0)

    return () => {
      window.clearTimeout(timeoutId)
    }
  }, [profile, fetchStats])

  if (!user || !profile || !isAdmin(profile.role)) {
    return (
      <div className="min-h-screen bg-gray-light flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-text text-lg mb-4">Admin access required</p>
          <Link
            href="/"
            className="text-teal hover:underline"
          >
            Go to Homepage
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
          <p className="text-gray-text">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    })
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
            <h1 className="text-xl font-bold text-charcoal">Revel Events Admin</h1>
          </div>
          
          <nav className="flex items-center gap-6">
            <Link href="/" className="text-gray-text hover:text-teal transition-colors">Home</Link>
            <Link href="/admin" className="text-teal font-medium">Dashboard</Link>
            <Link href="/admin/users" className="text-gray-text hover:text-teal transition-colors">Users</Link>
            <Link href="/admin/volunteers" className="text-gray-text hover:text-teal transition-colors">Volunteers</Link>
            <Link href="/profile" className="text-gray-text hover:text-teal transition-colors">Profile</Link>
          </nav>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-charcoal mb-2">Admin Dashboard</h1>
          <p className="text-gray-text">Boulder Startup Week 2026 · Overview</p>
        </div>

        {/* Key Metrics */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-text mb-1">Total Users</p>
                <p className="text-3xl font-bold text-charcoal">{stats?.total_users || 0}</p>
              </div>
              <div className="w-12 h-12 bg-teal-light rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-teal" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-text mb-1">Total Sessions</p>
                <p className="text-3xl font-bold text-charcoal">{stats?.total_sessions || 0}</p>
              </div>
              <div className="w-12 h-12 bg-teal-light rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-teal" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-text mb-1">Total Registrations</p>
                <p className="text-3xl font-bold text-charcoal">{stats?.total_registrations || 0}</p>
              </div>
              <div className="w-12 h-12 bg-teal-light rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-teal" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Popular Sessions */}
          <div className="card">
            <h3 className="text-lg font-semibold text-charcoal mb-4">Popular Sessions</h3>
            {stats?.popular_sessions && stats.popular_sessions.length > 0 ? (
              <div className="space-y-3">
                {stats.popular_sessions.map((session, index) => (
                  <div key={session.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium text-gray-text">#{index + 1}</span>
                      <div>
                        <p className="font-medium text-charcoal">{session.title}</p>
                        <p className="text-sm text-gray-text">{session.registration_count} registered</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-text">No sessions available</p>
            )}
          </div>

          {/* Registrations by Day */}
          <div className="card">
            <h3 className="text-lg font-semibold text-charcoal mb-4">Registrations by Day</h3>
            {stats?.registrations_by_day && Object.keys(stats.registrations_by_day).length > 0 ? (
              <div className="space-y-3">
                {Object.entries(stats.registrations_by_day)
                  .sort(([a], [b]) => a.localeCompare(b))
                  .map(([day, count]) => (
                    <div key={day} className="flex items-center justify-between">
                      <span className="text-gray-text">{formatDate(day)}</span>
                      <span className="font-medium text-charcoal">{count}</span>
                    </div>
                  ))}
              </div>
            ) : (
              <p className="text-gray-text">No registration data available</p>
            )}
          </div>
        </div>

        {/* Venue Utilization */}
        {stats?.venue_utilization && stats.venue_utilization.length > 0 && (
          <div className="card mt-8">
            <h3 className="text-lg font-semibold text-charcoal mb-4">Venue Utilization</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-border">
                    <th className="text-left py-2 text-gray-text">Venue</th>
                    <th className="text-left py-2 text-gray-text">Sessions</th>
                    <th className="text-left py-2 text-gray-text">Total Registrations</th>
                    <th className="text-left py-2 text-gray-text">Avg per Session</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.venue_utilization
                    .sort((a, b) => b.totalRegistrations - a.totalRegistrations)
                    .map((venue, index) => (
                      <tr key={index} className="border-b border-gray-border last:border-0">
                        <td className="py-2 font-medium text-charcoal">{venue.name}</td>
                        <td className="py-2 text-gray-text">{venue.sessions}</td>
                        <td className="py-2 text-gray-text">{venue.totalRegistrations}</td>
                        <td className="py-2 text-gray-text">
                          {venue.sessions > 0 ? Math.round(venue.totalRegistrations / venue.sessions) : 0}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="grid md:grid-cols-3 gap-6 mt-8">
          <div className="card">
            <h3 className="text-lg font-semibold text-charcoal mb-3">User Management</h3>
            <p className="text-gray-text mb-4">Manage user roles and permissions</p>
            <Link
              href="/admin/users"
              className="text-teal hover:underline font-medium"
            >
              Manage Users →
            </Link>
          </div>

          <div className="card">
            <h3 className="text-lg font-semibold text-charcoal mb-3">Volunteer Coordination</h3>
            <p className="text-gray-text mb-4">Manage volunteer assignments and shifts</p>
            <Link
              href="/admin/volunteers"
              className="text-teal hover:underline font-medium"
            >
              Manage Volunteers →
            </Link>
          </div>

          <div className="card">
            <h3 className="text-lg font-semibold text-charcoal mb-3">Import Users</h3>
            <p className="text-gray-text mb-4">Bulk import users from CSV file</p>
            <Link
              href="/admin/import"
              className="text-teal hover:underline font-medium"
            >
              Import CSV →
            </Link>
          </div>
        </div>
      </main>
    </div>
  )
}
