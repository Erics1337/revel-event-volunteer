'use client'

import { useMemo, useRef, useState } from 'react'
import {
  EVENT_DAYS,
  SHIFT_ROLES,
  VENUE_ADDRESSES,
  VENUE_NAMES,
  type VolunteerShift,
} from '@/lib/shifts/types'
import { sanitizeShiftInput, shiftsToCsv, sortShifts } from '@/lib/shifts/admin'
import type { ShiftEditorInput } from '@/components/admin/useShiftAdminData'

interface ShiftSpreadsheetProps {
  shifts: VolunteerShift[]
  onSave: (shifts: ShiftEditorInput[], deletedShiftIds: string[]) => Promise<void>
  onImportCsv: (file: File) => Promise<number | undefined>
}

const EMPTY_SHIFT: ShiftEditorInput = {
  role: SHIFT_ROLES[0],
  day: EVENT_DAYS[0].date,
  start_time: '09:00',
  end_time: '11:00',
  location: VENUE_NAMES[0],
  address: VENUE_ADDRESSES[VENUE_NAMES[0]],
  total_slots: 1,
  notes: '',
}

function toEditableShift(shift: VolunteerShift): ShiftEditorInput {
  return {
    id: shift.id,
    role: shift.role,
    day: shift.day,
    start_time: shift.start_time.slice(0, 5),
    end_time: shift.end_time.slice(0, 5),
    location: shift.location,
    address: shift.address ?? VENUE_ADDRESSES[shift.location as keyof typeof VENUE_ADDRESSES] ?? '',
    total_slots: shift.total_slots,
    notes: shift.notes ?? '',
  }
}

function sameShifts(left: ShiftEditorInput[], right: ShiftEditorInput[]): boolean {
  return JSON.stringify(left) === JSON.stringify(right)
}

export function ShiftSpreadsheet({ shifts, onSave, onImportCsv }: ShiftSpreadsheetProps) {
  const [rows, setRows] = useState<ShiftEditorInput[]>(() => sortShifts(shifts.map(toEditableShift)))
  const [deletedShiftIds, setDeletedShiftIds] = useState<string[]>([])
  const [saving, setSaving] = useState(false)
  const [importing, setImporting] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const baselineRows = useMemo(() => sortShifts(shifts.map(toEditableShift)), [shifts])

  const isDirty = useMemo(() => {
    return deletedShiftIds.length > 0 || !sameShifts(rows, baselineRows)
  }, [baselineRows, deletedShiftIds, rows])

  const updateRow = (index: number, key: keyof ShiftEditorInput, value: string | number) => {
    setRows((current) =>
      current.map((row, rowIndex) => {
        if (rowIndex !== index) return row

        if (key === 'location') {
          const nextLocation = String(value)
          const previousDefault =
            VENUE_ADDRESSES[row.location as keyof typeof VENUE_ADDRESSES] ?? null
          const nextDefault =
            VENUE_ADDRESSES[nextLocation as keyof typeof VENUE_ADDRESSES] ?? null

          return {
            ...row,
            location: nextLocation,
            address:
              !row.address || row.address === previousDefault ? nextDefault ?? row.address : row.address,
          }
        }

        return { ...row, [key]: value }
      })
    )
  }

  const addRow = () => {
    setRows((current) => sortShifts([...current, { ...EMPTY_SHIFT }]))
    setMessage(null)
  }

  const duplicateRow = (index: number) => {
    const row = rows[index]
    if (!row) return
    const clone = {
      role: row.role,
      day: row.day,
      start_time: row.start_time,
      end_time: row.end_time,
      location: row.location,
      address: row.address ?? '',
      total_slots: row.total_slots,
      notes: row.notes ?? '',
    }
    setRows((current) => sortShifts([...current, { ...clone }]))
    setMessage(null)
  }

  const deleteRow = (index: number) => {
    setRows((current) => {
      const row = current[index]
      if (!row) return current

      if (row.id) {
        setDeletedShiftIds((deleted) => [...deleted, row.id!])
      }

      return current.filter((_, currentIndex) => currentIndex !== index)
    })
    setMessage(null)
  }

  const handleSave = async () => {
    setSaving(true)
    setMessage(null)

    try {
      const sanitizedRows = rows.map((row, index) => {
        const result = sanitizeShiftInput(row, index + 1)
        if (result.error || !result.value) {
          throw new Error(result.error || 'Invalid shift')
        }
        return result.value
      })

      await onSave(sortShifts(sanitizedRows), deletedShiftIds)
      setDeletedShiftIds([])
      setMessage('Saved shift spreadsheet.')
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Failed to save shifts')
    } finally {
      setSaving(false)
    }
  }

  const handleExport = () => {
    const csv = shiftsToCsv(rows)
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'shifts.csv'
    link.click()
    URL.revokeObjectURL(url)
  }

  const handleImportClick = () => {
    fileInputRef.current?.click()
  }

  const handleImportFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return

    const proceed = confirm(
      'Importing a CSV replaces the entire shift schedule and removes existing assignments. Continue?'
    )
    if (!proceed) return

    setImporting(true)
    setMessage(null)

    try {
      const importedCount = await onImportCsv(file)
      setMessage(
        importedCount != null ? `Imported ${importedCount} shifts from CSV.` : 'Imported shifts from CSV.'
      )
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Failed to import CSV')
    } finally {
      setImporting(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="card">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-charcoal">Shift Spreadsheet</h2>
            <p className="text-sm text-gray-text">
              Edit shift rows inline, then save the schedule in one batch.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={handleImportClick}
              disabled={importing}
              className="px-4 py-2 border border-gray-border rounded-md text-sm font-medium hover:border-teal hover:text-teal disabled:opacity-50"
            >
              {importing ? 'Importing...' : 'Import CSV'}
            </button>
            <button
              type="button"
              onClick={handleExport}
              className="px-4 py-2 border border-gray-border rounded-md text-sm font-medium hover:border-teal hover:text-teal"
            >
              Export CSV
            </button>
            <button
              type="button"
              onClick={addRow}
              className="px-4 py-2 border border-gray-border rounded-md text-sm font-medium hover:border-teal hover:text-teal"
            >
              + Add Row
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={!isDirty || saving}
              className="px-4 py-2 bg-teal-500 text-white rounded-md text-sm font-medium hover:bg-teal-600 disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save All'}
            </button>
          </div>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,text/csv"
          onChange={handleImportFile}
          className="hidden"
        />

        <div className="mt-3 text-sm text-gray-text">
          CSV import accepts the admin export format and legacy BSW workbook-style CSV columns.
        </div>

        {message ? (
          <div className="mt-3 rounded-md border border-gray-border bg-gray-50 px-3 py-2 text-sm text-charcoal">
            {message}
          </div>
        ) : null}
      </div>

      <div className="card p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-[1100px] w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-border">
              <tr>
                {['Day', 'Role', 'Location', 'Address', 'Start', 'End', 'Total Slots', 'Notes', ''].map(
                  (header) => (
                    <th
                      key={header || 'actions'}
                      className="px-3 py-3 text-left font-semibold text-charcoal whitespace-nowrap"
                    >
                      {header}
                    </th>
                  )
                )}
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-10 text-center text-gray-text">
                    No shifts yet. Add a row or import a CSV to get started.
                  </td>
                </tr>
              ) : (
                rows.map((row, index) => (
                  <tr key={row.id ?? `draft-${index}`} className="border-b border-gray-border align-top">
                    <td className="px-3 py-3">
                      <select
                        value={row.day}
                        onChange={(event) => updateRow(index, 'day', event.target.value)}
                        className="w-full min-w-[140px] px-2 py-2 border border-gray-border rounded-md"
                      >
                        {EVENT_DAYS.map((day) => (
                          <option key={day.date} value={day.date}>
                            {day.label}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-3 py-3">
                      <select
                        value={row.role}
                        onChange={(event) => updateRow(index, 'role', event.target.value)}
                        className="w-full min-w-[220px] px-2 py-2 border border-gray-border rounded-md"
                      >
                        {SHIFT_ROLES.map((role) => (
                          <option key={role} value={role}>
                            {role}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-3 py-3">
                      <select
                        value={row.location}
                        onChange={(event) => updateRow(index, 'location', event.target.value)}
                        className="w-full min-w-[180px] px-2 py-2 border border-gray-border rounded-md"
                      >
                        {VENUE_NAMES.map((location) => (
                          <option key={location} value={location}>
                            {location}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-3 py-3">
                      <input
                        type="text"
                        value={row.address ?? ''}
                        onChange={(event) => updateRow(index, 'address', event.target.value)}
                        className="w-full min-w-[260px] px-2 py-2 border border-gray-border rounded-md"
                        placeholder="Venue address"
                      />
                    </td>
                    <td className="px-3 py-3">
                      <input
                        type="time"
                        value={row.start_time}
                        onChange={(event) => updateRow(index, 'start_time', event.target.value)}
                        className="w-full min-w-[110px] px-2 py-2 border border-gray-border rounded-md"
                      />
                    </td>
                    <td className="px-3 py-3">
                      <input
                        type="time"
                        value={row.end_time}
                        onChange={(event) => updateRow(index, 'end_time', event.target.value)}
                        className="w-full min-w-[110px] px-2 py-2 border border-gray-border rounded-md"
                      />
                    </td>
                    <td className="px-3 py-3">
                      <input
                        type="number"
                        min={1}
                        value={row.total_slots}
                        onChange={(event) => updateRow(index, 'total_slots', Number(event.target.value))}
                        className="w-full min-w-[100px] px-2 py-2 border border-gray-border rounded-md"
                      />
                    </td>
                    <td className="px-3 py-3">
                      <textarea
                        value={row.notes ?? ''}
                        onChange={(event) => updateRow(index, 'notes', event.target.value)}
                        className="w-full min-w-[220px] px-2 py-2 border border-gray-border rounded-md"
                        rows={2}
                        placeholder="Optional notes"
                      />
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex flex-col gap-2">
                        <button
                          type="button"
                          onClick={() => duplicateRow(index)}
                          className="text-left text-xs font-medium text-teal hover:underline"
                        >
                          Duplicate
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteRow(index)}
                          className="text-left text-xs font-medium text-red-600 hover:underline"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
