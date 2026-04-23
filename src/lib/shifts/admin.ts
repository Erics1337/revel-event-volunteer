import Papa from 'papaparse'
import type { Database } from '@/lib/supabase/database.types'
import { EVENT_DAYS, SHIFT_ROLES, VENUE_ADDRESSES } from '@/lib/shifts/types'

export type ShiftInsert = Database['public']['Tables']['volunteer_shifts']['Insert']
export type ShiftUpdate = Database['public']['Tables']['volunteer_shifts']['Update']
export const SHIFT_EXPORT_HEADERS = [
  'Day',
  'Role',
  'Volunteer Name',
  'Volunteer Cell',
  'Volunteer Email',
  'Location',
  'Address',
  'Shift_Start',
  'Shift_End',
  'Notes',
] as const

export interface EditableShiftInput {
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

type CsvRow = Record<string, unknown>

const VALID_DAYS = new Set<string>(EVENT_DAYS.map((day) => day.date))
const VALID_ROLES = new Set<string>(SHIFT_ROLES)
const TIME_RE = /^([01]\d|2[0-3]):([0-5]\d)$/
const DAY_ALIASES = new Map<string, string>(
  EVENT_DAYS.flatMap((day) => {
    const date = new Date(`${day.date}T12:00:00Z`)
    const month = date.toLocaleDateString('en-US', { month: 'long', timeZone: 'UTC' })
    const shortMonth = date.toLocaleDateString('en-US', { month: 'short', timeZone: 'UTC' })
    const dayOfMonth = date.toLocaleDateString('en-US', { day: 'numeric', timeZone: 'UTC' })
    const weekday = date.toLocaleDateString('en-US', { weekday: 'long', timeZone: 'UTC' })
    const shortWeekday = date.toLocaleDateString('en-US', { weekday: 'short', timeZone: 'UTC' })

    return [
      [normalizeDayLabel(day.label), day.date],
      [normalizeDayLabel(`${weekday} ${month} ${dayOfMonth}`), day.date],
      [normalizeDayLabel(`${shortWeekday} ${month} ${dayOfMonth}`), day.date],
      [normalizeDayLabel(`${month} ${dayOfMonth}`), day.date],
      [normalizeDayLabel(`${shortMonth} ${dayOfMonth}`), day.date],
    ] as const
  })
)

function normalizeText(value: unknown): string {
  return typeof value === 'string' ? value.trim() : ''
}

function normalizeDayLabel(value: string): string {
  return value.toLowerCase().replace(/,/g, '').replace(/\s+/g, ' ').trim()
}

function normalizeOptionalText(value: unknown): string | null {
  const next = normalizeText(value)
  return next ? next : null
}

function normalizeTime(value: string): string | null {
  const trimmed = value.trim()
  if (TIME_RE.test(trimmed)) return trimmed

  const match = trimmed.match(/^(\d{1,2}):(\d{2})(?::\d{2})?\s*([AP]M)?$/i)
  if (!match) return null

  let hours = Number(match[1])
  const minutes = Number(match[2])
  const meridiem = match[3]?.toUpperCase()

  if (minutes > 59) return null

  if (meridiem) {
    if (hours < 1 || hours > 12) return null
    if (meridiem === 'AM') {
      hours = hours === 12 ? 0 : hours
    } else {
      hours = hours === 12 ? 12 : hours + 12
    }
  } else if (hours > 23) {
    return null
  }

  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`
}

function normalizeDay(value: string): string | null {
  const trimmed = value.trim()
  if (!trimmed) return null
  if (VALID_DAYS.has(trimmed)) return trimmed

  const aliasMatch = DAY_ALIASES.get(normalizeDayLabel(trimmed))
  if (aliasMatch) return aliasMatch

  const parsed = new Date(trimmed)
  if (Number.isNaN(parsed.getTime())) return null

  const year = parsed.getUTCFullYear()
  const month = String(parsed.getUTCMonth() + 1).padStart(2, '0')
  const day = String(parsed.getUTCDate()).padStart(2, '0')
  const normalized = `${year}-${month}-${day}`

  return VALID_DAYS.has(normalized) ? normalized : null
}

function formatLegacyDay(day: string): string {
  const date = new Date(`${day}T12:00:00Z`)
  const weekday = date.toLocaleDateString('en-US', { weekday: 'long', timeZone: 'UTC' })
  const month = date.toLocaleDateString('en-US', { month: 'long', timeZone: 'UTC' })
  const dayOfMonth = date.toLocaleDateString('en-US', { day: 'numeric', timeZone: 'UTC' })
  return `${weekday} ${month} ${dayOfMonth}`
}

function formatLegacyTime(time: string): string {
  const [hoursRaw, minutes] = time.slice(0, 5).split(':')
  const hours = Number(hoursRaw)
  return `${hours}:${minutes}`
}

function normalizeRowIndex(rowIndex?: number): string {
  return rowIndex == null ? 'Shift' : `Row ${rowIndex}`
}

export function sortShifts<T extends EditableShiftInput>(shifts: T[]): T[] {
  return [...shifts].sort((left, right) => {
    return (
      left.day.localeCompare(right.day) ||
      left.start_time.localeCompare(right.start_time) ||
      left.location.localeCompare(right.location) ||
      left.role.localeCompare(right.role)
    )
  })
}

export function sanitizeShiftInput(
  input: Partial<EditableShiftInput>,
  rowIndex?: number
): { value?: EditableShiftInput; error?: string } {
  const label = normalizeRowIndex(rowIndex)
  const role = normalizeText(input.role)
  const day = normalizeDay(normalizeText(input.day))
  const start = normalizeTime(normalizeText(input.start_time))
  const end = normalizeTime(normalizeText(input.end_time))
  const location = normalizeText(input.location)
  const totalSlots = Number(input.total_slots)
  const address = normalizeOptionalText(input.address) ?? (location in VENUE_ADDRESSES ? VENUE_ADDRESSES[location as keyof typeof VENUE_ADDRESSES] : null)
  const notes = normalizeOptionalText(input.notes)

  if (!VALID_ROLES.has(role as (typeof SHIFT_ROLES)[number])) {
    return { error: `${label}: role must be one of the supported shift roles` }
  }

  if (!day) {
    return { error: `${label}: day must be one of the Boulder Startup Week dates` }
  }

  if (!start || !end) {
    return { error: `${label}: start and end times must be valid times` }
  }

  if (start >= end) {
    return { error: `${label}: end time must be after start time` }
  }

  if (!location) {
    return { error: `${label}: location is required` }
  }

  if (!Number.isInteger(totalSlots) || totalSlots < 1) {
    return { error: `${label}: total slots must be a whole number greater than 0` }
  }

  return {
    value: {
      id: input.id,
      role,
      day,
      start_time: start,
      end_time: end,
      location,
      address,
      total_slots: totalSlots,
      notes,
    },
  }
}

export function toShiftInsert(shift: EditableShiftInput): ShiftInsert {
  return {
    role: shift.role as Database['public']['Enums']['shift_role'],
    day: shift.day,
    start_time: shift.start_time,
    end_time: shift.end_time,
    location: shift.location,
    address: shift.address ?? null,
    total_slots: shift.total_slots,
    notes: shift.notes ?? null,
  }
}

function normalizeHeader(header: string): string {
  return header.trim().toLowerCase().replace(/[\s-]+/g, '_')
}

function normalizeRow(row: CsvRow): CsvRow {
  return Object.fromEntries(
    Object.entries(row).map(([key, value]) => [normalizeHeader(key), value])
  )
}

function getCell(row: CsvRow, ...keys: string[]): string {
  for (const key of keys) {
    if (key in row) return normalizeText(row[key])
  }
  return ''
}

export function parseShiftCsv(csv: string): { shifts?: EditableShiftInput[]; error?: string } {
  const parseResult = Papa.parse(csv, {
    header: true,
    skipEmptyLines: true,
    transformHeader: normalizeHeader,
    transform: (value) => value.trim(),
  })

  if (parseResult.errors.length > 0) {
    return {
      error: parseResult.errors.map((entry) => entry.message).join(', '),
    }
  }

  const rows = parseResult.data as CsvRow[]
  return parseShiftRows(rows)
}

export function parseShiftRows(rows: CsvRow[]): { shifts?: EditableShiftInput[]; error?: string } {
  if (rows.length === 0) {
    return { error: 'The file is empty.' }
  }

  const firstRow = normalizeRow(rows[0])
  const requiredColumns = ['day', 'role', 'location', 'address', 'shift_start', 'shift_end', 'notes']
  const missingColumns = requiredColumns.filter((column) => !(column in firstRow))
  if (missingColumns.length > 0) {
    return {
      error: `The file must match the BSW workbook columns. Missing: ${missingColumns.join(', ')}`,
    }
  }

  const shifts: EditableShiftInput[] = []

  for (let index = 0; index < rows.length; index += 1) {
    const row = normalizeRow(rows[index])

    const role = getCell(row, 'role')
    const day = getCell(row, 'day')
    const location = getCell(row, 'location')
    const address = getCell(row, 'address')
    const start = getCell(row, 'shift_start')
    const end = getCell(row, 'shift_end')
    const notes = getCell(row, 'notes')

    const normalized = sanitizeShiftInput(
      {
        role,
        day,
        location,
        address,
        start_time: start,
        end_time: end,
        total_slots: 1,
        notes,
      },
      index + 2
    )

    if (normalized.error) {
      return { error: normalized.error }
    }

    shifts.push(normalized.value!)
  }

  return { shifts: sortShifts(shifts) }
}

export function shiftsToCsv(shifts: EditableShiftInput[]): string {
  return Papa.unparse(shiftsToLegacyRows(shifts), {
    columns: [...SHIFT_EXPORT_HEADERS],
  })
}

export function shiftsToTabularData(shifts: EditableShiftInput[]) {
  return shiftsToLegacyRows(shifts)
}

function shiftsToLegacyRows(shifts: EditableShiftInput[]) {
  return sortShifts(shifts).flatMap((shift) =>
    Array.from({ length: shift.total_slots }, () => ({
      Day: formatLegacyDay(shift.day),
      Role: shift.role,
      'Volunteer Name': '',
      'Volunteer Cell': '',
      'Volunteer Email': '',
      Location: shift.location,
      Address: shift.address ?? '',
      Shift_Start: formatLegacyTime(shift.start_time),
      Shift_End: formatLegacyTime(shift.end_time),
      Notes: shift.notes ?? '',
    }))
  )
}
