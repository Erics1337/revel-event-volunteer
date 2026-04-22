'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { useAuth } from '@/contexts/auth-context'
import { BellIcon, MailIcon, DownloadIcon, SearchIcon, CloseIcon, CheckIcon } from '@/components/icons'
import { VolunteerFilters } from '@/components/admin/VolunteerFilters'
import { VolunteerTable } from '@/components/admin/VolunteerTable'
import { MessageModal } from '@/components/admin/MessageModal'
import { AssignmentActions } from '@/components/admin/AssignmentActions'
import { isAdmin } from '@/lib/auth/roles'

interface Volunteer {
  id: string
  name: string
  email: string
  phone: string
  availability: string[]
  shift_count: number
  status: 'confirmed' | 'pending'
}

interface VolunteerShift {
  id: string
  role: string
  day: string
  start_time: string
  end_time: string
  location: string
  total_slots: number
  filled_slots: number
}

const DAYS = [
  { date: '2026-05-04', label: 'Mon', full: 'Monday, May 4' },
  { date: '2026-05-05', label: 'Tue', full: 'Tuesday, May 5' },
  { date: '2026-05-06', label: 'Wed', full: 'Wednesday, May 6' },
  { date: '2026-05-07', label: 'Thu', full: 'Thursday, May 7' },
  { date: '2026-05-08', label: 'Fri', full: 'Friday, May 8' },
]

export default function AdminVolunteersPage() {
  const { user, profile } = useAuth()
  const [activeTab, setActiveTab] = useState('coverage')
  const [volunteers, setVolunteers] = useState<Volunteer[]>([])
  const [shifts, setShifts] = useState<VolunteerShift[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  
  // Filter states
  const [shiftFilters, setShiftFilters] = useState({ days: [] as string[], locations: [] as string[], roles: [] as string[] })
  const [reminderFilters, setReminderFilters] = useState({ days: [] as string[], locations: [] as string[], roles: [] as string[] })
  
  // Modal states
  const [messageModal, setMessageModal] = useState<string | null>(null)
  const [messageDraft, setMessageDraft] = useState({ subject: '', message: '' })
  const [reminderModal, setReminderModal] = useState(false)
  const [reminderSent, setReminderSent] = useState(false)
  const [manageShift, setManageShift] = useState<VolunteerShift | null>(null)
  
  // Assignment tracking
  const [assignments, setAssignments] = useState<Record<string, Set<string>>>({})

  const fetchData = useCallback(async () => {
    try {
      // In a real implementation, these would be actual API calls
      // For now, we'll use mock data similar to the original
      const mockVolunteers: Volunteer[] = [
        {
          id: '1',
          name: 'Alice Johnson',
          email: 'alice@example.com',
          phone: '555-0101',
          availability: ['2026-05-04', '2026-05-05'],
          shift_count: 2,
          status: 'confirmed',
        },
        {
          id: '2',
          name: 'Bob Smith',
          email: 'bob@example.com',
          phone: '555-0102',
          availability: ['2026-05-06', '2026-05-07'],
          shift_count: 1,
          status: 'pending',
        },
      ]

      const mockShifts: VolunteerShift[] = [
        {
          id: 'shift1',
          role: 'Registration Desk',
          day: '2026-05-04',
          start_time: '08:00',
          end_time: '10:00',
          location: 'Boulder Theater — Lobby',
          total_slots: 3,
          filled_slots: 1,
        },
        {
          id: 'shift2',
          role: 'Event Setup',
          day: '2026-05-05',
          start_time: '07:00',
          end_time: '09:00',
          location: 'Central Park — Main Stage',
          total_slots: 5,
          filled_slots: 2,
        },
      ]

      setVolunteers(mockVolunteers)
      setShifts(mockShifts)
      
      // Initialize assignments
      const initialAssignments: Record<string, Set<string>> = {}
      mockShifts.forEach(shift => {
        initialAssignments[shift.id] = new Set()
      })
      setAssignments(initialAssignments)
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    const loadData = async () => {
      if (isAdmin(profile?.role)) {
        await fetchData()
      }
    }
    
    loadData()
  }, [profile, fetchData])

  const filteredVolunteers = volunteers.filter(
    (v) =>
      v.name.toLowerCase().includes(search.toLowerCase()) ||
      v.email.toLowerCase().includes(search.toLowerCase()) ||
      v.phone.includes(search)
  )

  const openShifts = shifts.filter((s) => s.filled_slots < s.total_slots)
  const fillRate = shifts.length > 0 
    ? Math.round((shifts.reduce((acc, s) => acc + s.filled_slots, 0) / 
                 shifts.reduce((acc, s) => acc + s.total_slots, 0)) * 100)
    : 0

  const toggleShiftFilter = (key: string, value: string) => {
    setShiftFilters((f) => {
      const current = f[key as keyof typeof f] as string[]
      return {
        ...f,
        [key]: current.includes(value) 
          ? current.filter((v) => v !== value) 
          : [...current, value],
      }
    })
  }

  const toggleReminderFilter = (key: string, value: string) => {
    setReminderFilters((f) => {
      const current = f[key as keyof typeof f] as string[]
      return {
        ...f,
        [key]: current.includes(value) 
          ? current.filter((v) => v !== value) 
          : [...current, value],
      }
    })
  }

  const getAssigned = (shift: VolunteerShift) => {
    return volunteers.filter((v) => assignments[shift.id]?.has(v.id))
  }

  const getEligible = (shift: VolunteerShift) => {
    return volunteers.filter(
      (v) => v.availability.includes(shift.day) && !assignments[shift.id]?.has(v.id)
    )
  }

  const assignVolunteer = (shiftId: string, volunteerId: string) => {
    setAssignments((prev) => {
      const next = new Set(prev[shiftId] || [])
      next.add(volunteerId)
      return { ...prev, [shiftId]: next }
    })
    
    // Update shift filled count
    setShifts(prev => prev.map(shift => 
      shift.id === shiftId 
        ? { ...shift, filled_slots: shift.filled_slots + 1 }
        : shift
    ))
  }

  const removeVolunteer = (shiftId: string, volunteerId: string) => {
    setAssignments((prev) => {
      const next = new Set(prev[shiftId] || [])
      next.delete(volunteerId)
      return { ...prev, [shiftId]: next }
    })
    
    // Update shift filled count
    setShifts(prev => prev.map(shift => 
      shift.id === shiftId 
        ? { ...shift, filled_slots: Math.max(0, shift.filled_slots - 1) }
        : shift
    ))
  }

  const handleSendMessage = async (subject: string, message: string) => {
    // In a real implementation, this would call the messaging API
    console.log('Sending message:', { subject, message, target: messageModal })
  }

  const handleSendReminders = async () => {
    // In a real implementation, this would call the reminder API
    setReminderSent(true)
    setTimeout(() => {
      setReminderModal(false)
      setReminderSent(false)
    }, 1500)
  }

  const getMessageModalTitle = () => {
    if (messageModal === 'all') return 'Message all volunteers'
    const dayMatch = DAYS.find((d) => d.date === messageModal)
    if (dayMatch) return `Message volunteers on ${dayMatch.full}`
    return 'Message shift registrants'
  }

  const getMessageModalSubtitle = () => {
    if (messageModal === 'all') return 'This goes to every confirmed volunteer.'
    const dayMatch = DAYS.find((d) => d.date === messageModal)
    if (dayMatch) return `This goes to every volunteer scheduled on ${dayMatch.full}.`
    return 'This goes to everyone signed up for this shift.'
  }

  if (!user || !profile || !isAdmin(profile.role)) {
    return (
      <div className="min-h-screen bg-gray-light flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-text text-lg mb-4">Admin access required</p>
          <Link href="/" className="text-teal hover:underline">Go to Homepage</Link>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-light flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-text">Loading volunteer data...</p>
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
            <h1 className="text-xl font-bold text-charcoal">Revel Events Admin</h1>
          </div>
          
          <nav className="flex items-center gap-6">
            <Link href="/admin" className="text-gray-text hover:text-teal transition-colors">Dashboard</Link>
            <Link href="/admin/users" className="text-gray-text hover:text-teal transition-colors">Users</Link>
            <Link href="/admin/volunteers" className="text-teal font-medium">Volunteers</Link>
            <Link href="/profile" className="text-gray-text hover:text-teal transition-colors">Profile</Link>
          </nav>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-start justify-between mb-6 flex-wrap gap-4">
          <div>
            <h1 className="font-accent text-3xl font-bold text-charcoal">Volunteer Dashboard</h1>
            <p className="text-gray-text text-sm mt-1">BSW 2026 · May 4–8</p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => setReminderModal(true)}
              className="btn-secondary text-sm py-2 px-4 flex items-center gap-2"
            >
              <BellIcon className="w-4 h-4" />
              Send day-before reminders
            </button>
            <button
              onClick={() => setMessageModal('all')}
              className="btn-secondary text-sm py-2 px-4 flex items-center gap-2"
            >
              <MailIcon className="w-4 h-4" />
              Message all
            </button>
            <button
              onClick={() => {
                // TODO: trigger CSV export
                alert('CSV export coming soon!')
              }}
              className="btn-secondary text-sm py-2 px-4 flex items-center gap-2"
            >
              <DownloadIcon className="w-4 h-4" />
              Export CSV
            </button>
          </div>
        </div>

        {/* Fill rate stat */}
        <div className="card mb-6 flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="flex-1">
            <p className="text-sm text-gray-text mb-1">Overall shift fill rate</p>
            <div className="flex items-center gap-3">
              <p
                className={`text-4xl font-bold font-accent ${
                  fillRate >= 80
                    ? 'text-success'
                    : fillRate >= 60
                    ? 'text-orange'
                    : 'text-error'
                }`}
              >
                {fillRate}%
              </p>
              <div className="flex-1 bg-gray-border rounded-full h-2">
                <div
                  className={`h-2 rounded-full ${
                    fillRate >= 80 ? 'bg-success' : fillRate >= 60 ? 'bg-orange' : 'bg-error'
                  }`}
                  style={{ width: `${fillRate}%` }}
                />
              </div>
            </div>
          </div>
          <div className="flex gap-6 text-sm">
            <div className="text-center">
              <p className="text-2xl font-bold font-accent text-charcoal">
                {volunteers.length}
              </p>
              <p className="text-gray-text">Volunteers</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold font-accent text-teal">
                {volunteers.filter(v => v.status === 'confirmed').length}
              </p>
              <p className="text-gray-text">Confirmed</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold font-accent text-orange">
                {volunteers.filter(v => v.status === 'pending').length}
              </p>
              <p className="text-gray-text">Pending</p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 border-b border-gray-border mb-6">
          {[
            { id: 'coverage', label: 'Coverage Gaps' },
            { id: 'volunteers', label: `Volunteers (${volunteers.length})` },
            { id: 'shifts', label: 'All Shifts' },
          ].map(({ id, label }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`px-5 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${
                activeTab === id
                  ? 'border-teal-500 text-teal'
                  : 'border-transparent text-gray-text hover:text-teal'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {activeTab === 'coverage' && (
          <div>
            {/* Per-day recruitment buttons */}
            <div className="flex gap-2 flex-wrap mb-5">
              {DAYS.map((d) => {
                const dayShifts = shifts.filter((s) => s.day === d.date)
                const dayOpen = dayShifts.reduce(
                  (acc, s) => acc + Math.max(0, s.total_slots - s.filled_slots),
                  0
                )
                return (
                  <button
                    key={d.date}
                    onClick={() => setMessageModal(d.date)}
                    className={`text-xs px-3 py-1.5 rounded-pill border font-medium transition-colors flex items-center gap-1.5 ${
                      dayOpen > 0
                        ? 'border-orange text-orange bg-orange-light hover:bg-orange hover:text-white'
                        : 'border-gray-border text-gray-mid cursor-default'
                    }`}
                    disabled={dayOpen === 0}
                  >
                    {d.label}
                    {dayOpen > 0 ? (
                      <span className="font-bold">{dayOpen} open</span>
                    ) : (
                      <span>covered</span>
                    )}
                  </button>
                )
              })}
            </div>

            {openShifts.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-success text-lg font-semibold">All shifts covered.</p>
                <p className="text-gray-text text-sm mt-1">Nice work.</p>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                <p className="text-sm text-gray-text mb-1">
                  {openShifts.length} shift{openShifts.length !== 1 ? 's' : ''} still need volunteers
                </p>
                {openShifts.map((shift) => {
                  const open = shift.total_slots - shift.filled_slots
                  const pct = Math.round((shift.filled_slots / shift.total_slots) * 100)
                  const day = DAYS.find((d) => d.date === shift.day)
                  return (
                    <div
                      key={shift.id}
                      className="card flex flex-col sm:flex-row sm:items-center gap-4"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className="badge-featured text-xs">{shift.role}</span>
                          <span className="text-xs text-gray-text">{day?.full}</span>
                        </div>
                        <p className="text-sm text-charcoal font-medium">{shift.location}</p>
                        <p className="text-xs text-gray-text">
                          {shift.start_time} – {shift.end_time}
                        </p>
                        <div className="mt-2 flex items-center gap-2">
                          <div className="flex-1 bg-gray-border rounded-full h-1.5">
                            <div
                              className="h-1.5 rounded-full bg-teal-500"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                          <span className="text-xs text-orange font-semibold">
                            {open} spot{open !== 1 ? 's' : ''} open
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={() => setManageShift(shift)}
                        className="btn-secondary text-sm py-2 px-4 shrink-0"
                      >
                        Manage
                      </button>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {activeTab === 'volunteers' && (
          <div>
            <div className="relative mb-4">
              <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-mid" />
              <input
                className="input pl-10"
                placeholder="Search by name, email, or phone…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <VolunteerTable
              volunteers={filteredVolunteers}
              availableDays={DAYS}
              onMessageVolunteer={(volunteerId) => setMessageModal(volunteerId)}
            />
          </div>
        )}

        {activeTab === 'shifts' && (() => {
          const allShiftRoles = [...new Set(shifts.map((s) => s.role))].sort()
          const allShiftLocations = [...new Set(shifts.map((s) => s.location))]

          const filteredShifts = shifts.filter((s) => {
            if (shiftFilters.days.length > 0 && !shiftFilters.days.includes(s.day)) return false
            if (shiftFilters.roles.length > 0 && !shiftFilters.roles.includes(s.role)) return false
            if (shiftFilters.locations.length > 0 && !shiftFilters.locations.includes(s.location)) return false
            return true
          })

          const hasFilters = shiftFilters.days.length > 0 || shiftFilters.roles.length > 0 || shiftFilters.locations.length > 0

          return (
            <div className="flex flex-col gap-4">
              <VolunteerFilters
                dayFilters={shiftFilters.days}
                locationFilters={shiftFilters.locations}
                roleFilters={shiftFilters.roles}
                availableDays={DAYS}
                availableLocations={allShiftLocations}
                availableRoles={allShiftRoles}
                onToggleDayFilter={(day) => toggleShiftFilter('days', day)}
                onToggleLocationFilter={(location) => toggleShiftFilter('locations', location)}
                onToggleRoleFilter={(role) => toggleShiftFilter('roles', role)}
                onClearDayFilters={() => setShiftFilters({ ...shiftFilters, days: [] })}
                onClearLocationFilters={() => setShiftFilters({ ...shiftFilters, locations: [] })}
                onClearRoleFilters={() => setShiftFilters({ ...shiftFilters, roles: [] })}
                onClearAllFilters={() => setShiftFilters({ days: [], locations: [], roles: [] })}
              />

              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-text">
                  {filteredShifts.length} shift{filteredShifts.length !== 1 ? 's' : ''}
                </p>
                {hasFilters && (
                  <button
                    onClick={() => setShiftFilters({ days: [], locations: [], roles: [] })}
                    className="text-sm text-gray-text hover:text-teal underline underline-offset-2"
                  >
                    Clear all filters
                  </button>
                )}
              </div>

              <div className="flex flex-col gap-3">
                {filteredShifts.map((shift) => {
                  const open = shift.total_slots - shift.filled_slots
                  const pct = Math.round((shift.filled_slots / shift.total_slots) * 100)
                  const day = DAYS.find((d) => d.date === shift.day)
                  return (
                    <div key={shift.id} className="card flex flex-col sm:flex-row sm:items-center gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span className="badge-default text-xs">{shift.role}</span>
                          <span className="text-xs text-gray-text">
                            {day?.full} · {shift.start_time}–{shift.end_time}
                          </span>
                        </div>
                        <p className="text-sm text-charcoal">{shift.location}</p>
                        <div className="mt-2 flex items-center gap-2">
                          <div className="w-28 bg-gray-border rounded-full h-1.5">
                            <div
                              className={`h-1.5 rounded-full ${pct === 100 ? 'bg-success' : 'bg-teal-500'}`}
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                          <span className="text-xs text-gray-text">
                            {shift.filled_slots}/{shift.total_slots} filled
                            {open > 0 && <span className="text-orange font-medium"> · {open} open</span>}
                          </span>
                        </div>
                      </div>
                      {pct === 100 && (
                        <span className="text-xs text-success font-semibold shrink-0">Full</span>
                      )}
                    </div>
                  )
                })}
                {filteredShifts.length === 0 && (
                  <p className="text-center text-gray-text py-10 text-sm">No shifts match those filters.</p>
                )}
              </div>
            </div>
          )
        })()}
      </main>

      {/* Manage Shift Modal */}
      {manageShift && (
        <div
          className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50"
          onClick={(e) => { if (e.target === e.currentTarget) setManageShift(null) }}
        >
          <div className="bg-white rounded-md w-full max-w-lg shadow-card max-h-[90vh] overflow-y-auto">
            <div className="p-6 flex flex-col gap-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="font-accent text-xl font-semibold text-charcoal">{manageShift.role}</h3>
                  <p className="text-sm text-gray-text mt-0.5">Assign volunteers to this shift</p>
                </div>
                <button onClick={() => setManageShift(null)} className="text-gray-mid hover:text-charcoal shrink-0">
                  <CloseIcon />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3 bg-gray-light rounded-sm p-4 text-sm">
                <div>
                  <span className="text-gray-text">Time: </span>
                  <span className="font-medium text-charcoal">{manageShift.start_time} – {manageShift.end_time}</span>
                </div>
                <div>
                  <span className="text-gray-text">Location: </span>
                  <span className="font-medium text-charcoal">{manageShift.location.split('—').pop()?.trim()}</span>
                </div>
                <div>
                  <span className="text-gray-text">Required: </span>
                  <span className="font-medium text-charcoal">{manageShift.total_slots} volunteers</span>
                </div>
                <div>
                  <span className="text-gray-text">Assigned: </span>
                  <span className="font-medium text-charcoal">{getAssigned(manageShift).length} volunteers</span>
                </div>
              </div>

              <div>
                <h4 className="font-accent font-semibold text-charcoal mb-3">
                  Currently Assigned ({getAssigned(manageShift).length})
                </h4>
                {getAssigned(manageShift).length === 0 ? (
                  <p className="text-sm text-gray-text italic">No volunteers assigned yet.</p>
                ) : (
                  <div className="flex flex-col gap-2">
                    {getAssigned(manageShift).map((volunteer) => (
                      <AssignmentActions
                        key={volunteer.id}
                        isAssigned={true}
                        volunteerName={volunteer.name}
                        volunteerEmail={volunteer.email}
                        onAssign={() => {}}
                        onRemove={() => removeVolunteer(manageShift.id, volunteer.id)}
                      />
                    ))}
                  </div>
                )}
              </div>

              <div>
                <h4 className="font-accent font-semibold text-charcoal mb-3">
                  Eligible Volunteers ({getEligible(manageShift).length})
                </h4>
                {getEligible(manageShift).length === 0 ? (
                  <p className="text-sm text-gray-text italic">No eligible volunteers available for this day.</p>
                ) : (
                  <div className="flex flex-col gap-2">
                    {getEligible(manageShift).map((volunteer) => (
                      <AssignmentActions
                        key={volunteer.id}
                        isAssigned={false}
                        volunteerName={volunteer.name}
                        volunteerEmail={volunteer.email}
                        onAssign={() => assignVolunteer(manageShift.id, volunteer.id)}
                        onRemove={() => {}}
                      />
                    ))}
                  </div>
                )}
              </div>

              <div className="flex justify-end pt-2">
                <button
                  onClick={() => setManageShift(null)}
                  className="text-sm font-medium text-white bg-charcoal px-8 py-2.5 rounded-sm hover:bg-black transition-colors"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Message Modal */}
      <MessageModal
        isOpen={messageModal !== null}
        onClose={() => setMessageModal(null)}
        title={getMessageModalTitle()}
        subtitle={getMessageModalSubtitle()}
        onSend={handleSendMessage}
      />

      {/* Reminder Modal */}
      {reminderModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-md p-6 max-w-lg w-full shadow-card max-h-[90vh] overflow-y-auto">
            {reminderSent ? (
              <div className="text-center py-4">
                <div className="w-12 h-12 bg-teal-light rounded-full flex items-center justify-center mx-auto mb-3">
                  <CheckIcon className="w-6 h-6 text-teal" />
                </div>
                <p className="font-semibold text-charcoal">Reminders queued.</p>
                <p className="text-sm text-gray-text mt-1">
                  Volunteers will be notified via their preferred channel.
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-5">
                <div>
                  <h3 className="font-accent text-xl font-semibold text-charcoal mb-1">
                    Send day-before reminders
                  </h3>
                  <p className="text-sm text-gray-text">
                    Filter recipients by day, location, and/or role. Select multiple. Leave all unselected to message every confirmed volunteer.
                  </p>
                </div>

                <VolunteerFilters
                  dayFilters={reminderFilters.days}
                  locationFilters={reminderFilters.locations}
                  roleFilters={reminderFilters.roles}
                  availableDays={DAYS}
                  availableLocations={[...new Set(shifts.map(s => s.location))]}
                  availableRoles={[...new Set(shifts.map(s => s.role))]}
                  onToggleDayFilter={(day) => toggleReminderFilter('days', day)}
                  onToggleLocationFilter={(location) => toggleReminderFilter('locations', location)}
                  onToggleRoleFilter={(role) => toggleReminderFilter('roles', role)}
                  onClearDayFilters={() => setReminderFilters({ ...reminderFilters, days: [] })}
                  onClearLocationFilters={() => setReminderFilters({ ...reminderFilters, locations: [] })}
                  onClearRoleFilters={() => setReminderFilters({ ...reminderFilters, roles: [] })}
                  onClearAllFilters={() => setReminderFilters({ days: [], locations: [], roles: [] })}
                />

                <div className="flex justify-end pt-2">
                  <button
                    onClick={handleSendReminders}
                    className="bg-teal-500 text-white px-6 py-2 rounded-md font-medium hover:bg-teal-600 transition-colors"
                  >
                    Send Reminders
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
