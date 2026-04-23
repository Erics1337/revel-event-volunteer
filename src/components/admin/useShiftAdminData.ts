'use client'

import { useCallback, useEffect, useState } from 'react'
import type { AvailableVolunteer, ShiftAssignment, VolunteerShift } from '@/lib/shifts/types'

export interface ShiftEditorInput {
  id?: string
  role: string
  day: string
  start_time: string
  end_time: string
  location: string
  address?: string | null
  total_slots: number
  notes?: string | null
}

export function useShiftAdminData() {
  const [shifts, setShifts] = useState<VolunteerShift[]>([])
  const [assignments, setAssignments] = useState<ShiftAssignment[]>([])
  const [volunteers, setVolunteers] = useState<AvailableVolunteer[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    setError(null)

    try {
      const [shiftsRes, assignmentsRes, volunteersRes] = await Promise.all([
        fetch('/api/admin/shifts'),
        fetch('/api/admin/shifts/assignments'),
        fetch('/api/admin/volunteers/available'),
      ])

      const [shiftsData, assignmentsData, volunteersData] = await Promise.all([
        shiftsRes.json(),
        assignmentsRes.json(),
        volunteersRes.json(),
      ])

      if (!shiftsRes.ok) throw new Error(shiftsData.error || 'Failed to load shifts')
      if (!assignmentsRes.ok) {
        throw new Error(assignmentsData.error || 'Failed to load assignments')
      }
      if (!volunteersRes.ok) {
        throw new Error(volunteersData.error || 'Failed to load volunteers')
      }

      setShifts((shiftsData.shifts || []) as VolunteerShift[])
      setAssignments((assignmentsData.assignments || []) as ShiftAssignment[])
      setVolunteers((volunteersData.volunteers || []) as AvailableVolunteer[])
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : 'Failed to load shift data')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void refresh()
    }, 0)

    return () => window.clearTimeout(timeoutId)
  }, [refresh])

  const createShift = useCallback(async (values: ShiftEditorInput) => {
    const response = await fetch('/api/admin/shifts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(values),
    })

    if (!response.ok) {
      const payload = await response.json().catch(() => ({}))
      throw new Error(payload.error || 'Failed to create shift')
    }

    await refresh()
  }, [refresh])

  const updateShift = useCallback(async (shiftId: string, values: ShiftEditorInput) => {
    const response = await fetch(`/api/admin/shifts/${shiftId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(values),
    })

    if (!response.ok) {
      const payload = await response.json().catch(() => ({}))
      throw new Error(payload.error || 'Failed to update shift')
    }

    await refresh()
  }, [refresh])

  const deleteShift = useCallback(async (shiftId: string) => {
    const response = await fetch(`/api/admin/shifts/${shiftId}`, { method: 'DELETE' })

    if (!response.ok) {
      const payload = await response.json().catch(() => ({}))
      throw new Error(payload.error || 'Failed to delete shift')
    }

    await refresh()
  }, [refresh])

  const saveSpreadsheet = useCallback(async (nextShifts: ShiftEditorInput[], deletedShiftIds: string[]) => {
    const response = await fetch('/api/admin/shifts/bulk', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ shifts: nextShifts, deletedShiftIds }),
    })

    const payload = await response.json().catch(() => ({}))
    if (!response.ok) {
      throw new Error(payload.error || 'Failed to save shifts')
    }

    setShifts((payload.shifts || []) as VolunteerShift[])
  }, [])

  const importCsv = useCallback(async (file: File) => {
    const formData = new FormData()
    formData.set('file', file)

    const response = await fetch('/api/admin/shifts/import', {
      method: 'POST',
      body: formData,
    })

    const payload = await response.json().catch(() => ({}))
    if (!response.ok) {
      throw new Error(payload.error || 'Failed to import shifts')
    }

    await refresh()
    return payload.imported as number | undefined
  }, [refresh])

  const assignVolunteer = useCallback(async (shiftId: string, volunteerId: string) => {
    const response = await fetch('/api/volunteers/assign', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ shiftId, volunteerId }),
    })

    if (!response.ok) {
      const payload = await response.json().catch(() => ({}))
      throw new Error(payload.error || 'Failed to assign volunteer')
    }

    await refresh()
  }, [refresh])

  const unassignVolunteer = useCallback(async (shiftId: string, volunteerId: string) => {
    const response = await fetch(
      `/api/volunteers/assign?shiftId=${shiftId}&volunteerId=${volunteerId}`,
      { method: 'DELETE' }
    )

    if (!response.ok) {
      const payload = await response.json().catch(() => ({}))
      throw new Error(payload.error || 'Failed to unassign volunteer')
    }

    await refresh()
  }, [refresh])

  return {
    shifts,
    assignments,
    volunteers,
    loading,
    error,
    refresh,
    createShift,
    updateShift,
    deleteShift,
    saveSpreadsheet,
    importCsv,
    assignVolunteer,
    unassignVolunteer,
  }
}
