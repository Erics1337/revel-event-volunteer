'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { useAuth } from '@/contexts/auth-context'
import { isAdmin } from '@/lib/auth/roles'
import { AdminHeader } from '@/components/admin/AdminHeader'

interface AdminStats {
  total_users: number
  total_shifts: number
  total_volunteers: number
  confirmed_volunteers: number
  total_assignments: number
  total_slots: number
  filled_slots: number
  open_slots: number
  fill_rate: number
  shifts_by_day: Record<string, { total: number; filled: number }>
  understaffed_shifts: Array<{
    id: string
    role: string
    day: string
    location: string
    total_slots: number
    filled_slots: number
    unfilled: number
  }>
  location_utilization: Array<{
    name: string
    shifts: number
    totalSlots: number
    filledSlots: number
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
      <AdminHeader />

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
                <p className="text-sm text-gray-text mb-1">Total Shifts</p>
                <p className="text-3xl font-bold text-charcoal">{stats?.total_shifts || 0}</p>
                <p className="text-xs text-gray-text mt-1">
                  {stats?.filled_slots || 0} / {stats?.total_slots || 0} slots filled ({Math.round((stats?.fill_rate || 0) * 100)}%)
                </p>
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
                <p className="text-sm text-gray-text mb-1">Volunteers</p>
                <p className="text-3xl font-bold text-charcoal">{stats?.total_volunteers || 0}</p>
                <p className="text-xs text-gray-text mt-1">
                  {stats?.confirmed_volunteers || 0} confirmed · {stats?.total_assignments || 0} assignments
                </p>
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
          {/* Understaffed Shifts */}
          <div className="card">
            <h3 className="text-lg font-semibold text-charcoal mb-4">Shifts Needing Volunteers</h3>
            {stats?.understaffed_shifts && stats.understaffed_shifts.length > 0 ? (
              <div className="space-y-3">
                {stats.understaffed_shifts.map((shift) => (
                  <div key={shift.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium text-red-600">-{shift.unfilled}</span>
                      <div>
                        <p className="font-medium text-charcoal">{shift.role}</p>
                        <p className="text-sm text-gray-text">
                          {formatDate(shift.day)} · {shift.location} · {shift.filled_slots}/{shift.total_slots} filled
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-text">All shifts fully staffed — nice.</p>
            )}
          </div>

          {/* Shifts by Day */}
          <div className="card">
            <h3 className="text-lg font-semibold text-charcoal mb-4">Slots by Day</h3>
            {stats?.shifts_by_day && Object.keys(stats.shifts_by_day).length > 0 ? (
              <div className="space-y-3">
                {Object.entries(stats.shifts_by_day)
                  .sort(([a], [b]) => a.localeCompare(b))
                  .map(([day, counts]) => (
                    <div key={day} className="flex items-center justify-between">
                      <span className="text-gray-text">{formatDate(day)}</span>
                      <span className="font-medium text-charcoal">
                        {counts.filled} / {counts.total}
                      </span>
                    </div>
                  ))}
              </div>
            ) : (
              <p className="text-gray-text">No shift data available</p>
            )}
          </div>
        </div>

        {/* Location Utilization */}
        {stats?.location_utilization && stats.location_utilization.length > 0 && (
          <div className="card mt-8">
            <h3 className="text-lg font-semibold text-charcoal mb-4">Location Utilization</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-border">
                    <th className="text-left py-2 text-gray-text">Location</th>
                    <th className="text-left py-2 text-gray-text">Shifts</th>
                    <th className="text-left py-2 text-gray-text">Slots (filled / total)</th>
                    <th className="text-left py-2 text-gray-text">Fill Rate</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.location_utilization
                    .sort((a, b) => b.totalSlots - a.totalSlots)
                    .map((loc, index) => (
                      <tr key={index} className="border-b border-gray-border last:border-0">
                        <td className="py-2 font-medium text-charcoal">{loc.name}</td>
                        <td className="py-2 text-gray-text">{loc.shifts}</td>
                        <td className="py-2 text-gray-text">
                          {loc.filledSlots} / {loc.totalSlots}
                        </td>
                        <td className="py-2 text-gray-text">
                          {loc.totalSlots > 0 ? Math.round((loc.filledSlots / loc.totalSlots) * 100) : 0}%
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
