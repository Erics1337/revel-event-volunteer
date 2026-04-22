'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useAuth } from '@/contexts/auth-context'
import { isAdmin } from '@/lib/auth/roles'
import { ShiftCalendar } from '@/components/admin/ShiftCalendar'
import { VolunteerPool } from '@/components/admin/VolunteerPool'
import { ShiftModal } from '@/components/admin/ShiftModal'
import type {
  VolunteerShift,
  ShiftAssignment,
  AvailableVolunteer,
} from '@/lib/shifts/types'

type ModalState =
  | { kind: 'closed' }
  | { kind: 'create'; start: Date; end: Date }
  | { kind: 'edit'; shift: VolunteerShift }

function toTimeHHMM(date: Date): string {
  const h = String(date.getHours()).padStart(2, '0')
  const m = String(date.getMinutes()).padStart(2, '0')
  return `${h}:${m}`
}

function toDateYMD(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export default function AdminShiftsPage() {
  const { user, profile, loading: authLoading } = useAuth()
  const [shifts, setShifts] = useState<VolunteerShift[]>([])
  const [assignments, setAssignments] = useState<ShiftAssignment[]>([])
  const [volunteers, setVolunteers] = useState<AvailableVolunteer[]>([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState<ModalState>({ kind: 'closed' })

  const refresh = useCallback(async () => {
    try {
      const [shiftsRes, assignmentsRes, volunteersRes] = await Promise.all([
        fetch('/api/admin/shifts'),
        fetch('/api/admin/shifts/assignments'),
        fetch('/api/admin/volunteers/available'),
      ])
      const shiftsData = await shiftsRes.json()
      const assignmentsData = await assignmentsRes.json()
      const volunteersData = await volunteersRes.json()
      if (shiftsRes.ok) setShifts(shiftsData.shifts || [])
      if (assignmentsRes.ok) setAssignments(assignmentsData.assignments || [])
      if (volunteersRes.ok) setVolunteers(volunteersData.volunteers || [])
    } catch (err) {
      console.error('Failed to load shifts data:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!isAdmin(profile?.role)) return

    const timeoutId = window.setTimeout(() => {
      void refresh()
    }, 0)

    return () => {
      window.clearTimeout(timeoutId)
    }
  }, [profile, refresh])

  const handleSelectSlot = (start: Date, end: Date) => {
    setModal({ kind: 'create', start, end })
  }

  const handleClickShift = (shiftId: string) => {
    const shift = shifts.find((s) => s.id === shiftId)
    if (shift) setModal({ kind: 'edit', shift })
  }

  const handleMoveShift = async (shiftId: string, start: Date, end: Date) => {
    const res = await fetch(`/api/admin/shifts/${shiftId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        day: toDateYMD(start),
        start_time: toTimeHHMM(start),
        end_time: toTimeHHMM(end),
      }),
    })
    if (!res.ok) throw new Error('Failed to move shift')
    await refresh()
  }

  const handleSaveCreate = async (values: Omit<VolunteerShift, 'id' | 'filled_slots'>) => {
    const res = await fetch('/api/admin/shifts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(values),
    })
    if (!res.ok) throw new Error('Failed to create shift')
    await refresh()
  }

  const handleSaveEdit = async (
    shiftId: string,
    values: Omit<VolunteerShift, 'id' | 'filled_slots'>
  ) => {
    const res = await fetch(`/api/admin/shifts/${shiftId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(values),
    })
    if (!res.ok) throw new Error('Failed to update shift')
    await refresh()
  }

  const handleDelete = async (shiftId: string) => {
    const res = await fetch(`/api/admin/shifts/${shiftId}`, { method: 'DELETE' })
    if (!res.ok) throw new Error('Failed to delete shift')
    await refresh()
  }

  const handleAssignVolunteer = async (shiftId: string, volunteerId: string) => {
    const res = await fetch('/api/volunteers/assign', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ shiftId, volunteerId }),
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      throw new Error(err.error || 'Failed to assign volunteer')
    }
    await refresh()
    // If modal is open for this shift, update it
    setModal((prev) => {
      if (prev.kind === 'edit' && prev.shift.id === shiftId) {
        const updated = shifts.find((s) => s.id === shiftId)
        return updated ? { kind: 'edit', shift: updated } : prev
      }
      return prev
    })
  }

  const handleUnassignVolunteer = async (shiftId: string, volunteerId: string) => {
    const url = `/api/volunteers/assign?shiftId=${shiftId}&volunteerId=${volunteerId}`
    const res = await fetch(url, { method: 'DELETE' })
    if (!res.ok) throw new Error('Failed to unassign volunteer')
    await refresh()
  }

  const modalAssignments = useMemo(() => {
    if (modal.kind !== 'edit') return []
    return assignments.filter((a) => a.shift_id === modal.shift.id)
  }, [modal, assignments])

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-light flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-teal-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!user || !profile || !isAdmin(profile.role)) {
    return (
      <div className="min-h-screen bg-gray-light flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-text text-lg mb-4">Admin access required</p>
          <Link href="/" className="text-teal hover:underline">
            Go to Homepage
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-light">
      <header className="bg-white border-b border-gray-border">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-teal-500 rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-sm">R</span>
            </div>
            <h1 className="text-xl font-bold text-charcoal">Revel Events Admin</h1>
          </div>
          <nav className="flex items-center gap-6">
            <Link href="/" className="text-gray-text hover:text-teal transition-colors">
              Home
            </Link>
            <Link href="/admin" className="text-gray-text hover:text-teal transition-colors">
              Dashboard
            </Link>
            <Link
              href="/admin/users"
              className="text-gray-text hover:text-teal transition-colors"
            >
              Users
            </Link>
            <Link
              href="/admin/volunteers"
              className="text-gray-text hover:text-teal transition-colors"
            >
              Volunteers
            </Link>
            <Link href="/admin/shifts" className="text-teal font-medium">
              Shifts
            </Link>
            <Link
              href="/profile"
              className="text-gray-text hover:text-teal transition-colors"
            >
              Profile
            </Link>
          </nav>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-charcoal mb-1">Volunteer Shifts</h1>
            <p className="text-gray-text">
              Click an empty slot to create a shift. Drag shifts to reschedule. Drag a
              volunteer onto a shift to assign.
            </p>
          </div>
          <button
            onClick={() =>
              setModal({
                kind: 'create',
                start: new Date('2026-05-04T09:00:00'),
                end: new Date('2026-05-04T11:00:00'),
              })
            }
            className="bg-teal-500 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-teal-600"
          >
            + New Shift
          </button>
        </div>

        {loading ? (
          <div className="card flex items-center justify-center py-16">
            <div className="w-8 h-8 border-4 border-teal-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
            <ShiftCalendar
              shifts={shifts}
              assignments={assignments}
              onSelectSlot={handleSelectSlot}
              onClickShift={handleClickShift}
              onMoveShift={handleMoveShift}
              onDropVolunteer={(shiftId, volunteerId) =>
                handleAssignVolunteer(shiftId, volunteerId)
              }
            />
            <VolunteerPool volunteers={volunteers} />
          </div>
        )}

        {modal.kind === 'create' && (
          <ShiftModal
            mode="create"
            initial={{
              day: toDateYMD(modal.start),
              start_time: toTimeHHMM(modal.start),
              end_time: toTimeHHMM(modal.end),
            }}
            onClose={() => setModal({ kind: 'closed' })}
            onSave={handleSaveCreate}
          />
        )}

        {modal.kind === 'edit' && (
          <ShiftModal
            mode="edit"
            initial={modal.shift}
            assignments={modalAssignments}
            volunteers={volunteers}
            onClose={() => setModal({ kind: 'closed' })}
            onSave={(values) => handleSaveEdit(modal.shift.id, values)}
            onDelete={() => handleDelete(modal.shift.id)}
            onAssign={(volunteerId) => handleAssignVolunteer(modal.shift.id, volunteerId)}
            onUnassign={(volunteerId) =>
              handleUnassignVolunteer(modal.shift.id, volunteerId)
            }
          />
        )}
      </main>
    </div>
  )
}
