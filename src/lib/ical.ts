/**
 * Consolidated iCalendar (.ics) generation utility
 * Replaces duplicate logic from frontend/lib/icsExport.js and src/api/schedule.js
 */

function pad(n: number): string {
  return String(n).padStart(2, '0')
}

function toIcalDate(date: string): string {
  // Convert ISO string to iCal datetime format
  return new Date(date).toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'
}

function toIcalLocalDate(date: string, time: string): string {
  // Convert "2026-05-04" + "07:30" to iCal local datetime "20260504T073000"
  const [year, month, day] = date.split('-')
  const [hour, min] = time.split(':')
  return `${year}${month}${day}T${pad(parseInt(hour))}${pad(parseInt(min))}00`
}

function icsEscape(str: string): string {
  return String(str)
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\n/g, '\\n')
}

export interface ICalEvent {
  id: string
  title: string
  description?: string
  location?: string
  start_time: string // ISO string for API, or date string for volunteer shifts
  end_time: string // ISO string for API, or time string for volunteer shifts
  day?: string // For volunteer shifts
  domain?: string // Domain for UID, defaults to 'revel-events.com'
}

export function generateIcs(events: ICalEvent[], options: { 
  isLocalTime?: boolean 
  prodId?: string 
  domain?: string 
} = {}): string {
  const { isLocalTime = false, prodId = '-//Revel Events//Event Platform//EN', domain = 'revel-events.com' } = options
  
  const dtstamp = new Date()
    .toISOString()
    .replace(/[-:]/g, '')
    .replace(/\.\d{3}/, '')

  const icalEvents = events.map((event) => {
    const start = isLocalTime && event.day 
      ? toIcalLocalDate(event.day, event.start_time)
      : toIcalDate(event.start_time)
    
    const end = isLocalTime && event.day 
      ? toIcalLocalDate(event.day, event.end_time)
      : toIcalDate(event.end_time)

    const eventLines = [
      'BEGIN:VEVENT',
      `UID:${event.id}@${domain}`,
      `DTSTAMP:${dtstamp}`,
      `DTSTART${isLocalTime ? ';TZID=America/Denver' : ''}:${start}`,
      `DTEND${isLocalTime ? ';TZID=America/Denver' : ''}:${end}`,
      `SUMMARY:${icsEscape(event.title)}`,
    ]

    if (event.description) {
      eventLines.push(`DESCRIPTION:${icsEscape(event.description)}`)
    }

    if (event.location) {
      eventLines.push(`LOCATION:${icsEscape(event.location)}`)
    }

    eventLines.push('END:VEVENT')

    return eventLines.join('\r\n')
  })

  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    `PRODID:${prodId}`,
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    ...icalEvents,
    'END:VCALENDAR',
  ].join('\r\n')
}

export function downloadIcs(events: ICalEvent[], filename = 'revel-events.ics'): void {
  const ics = generateIcs(events)
  const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

// Legacy exports for backward compatibility
export const buildIcs = generateIcs
export const toIcsDate = toIcalDate
