/**
 * iCal (.ics) export utility for volunteer shifts.
 * Generates a standards-compliant VCALENDAR string and triggers a file download.
 */

function pad(n) {
  return String(n).padStart(2, '0');
}

// Convert "2026-05-04" + "07:30" to iCal local datetime "20260504T073000"
function toIcalDt(date, time) {
  const [year, month, day] = date.split('-');
  const [hour, min] = time.split(':');
  return `${year}${month}${day}T${pad(hour)}${pad(min)}00`;
}

function escapeIcal(str) {
  return String(str)
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\n/g, '\\n');
}

export function generateIcs(shifts) {
  const dtstamp = new Date()
    .toISOString()
    .replace(/[-:]/g, '')
    .replace(/\.\d{3}/, '');

  const events = shifts.map((shift) => {
    const dtstart = toIcalDt(shift.day, shift.start_time);
    const dtend = toIcalDt(shift.day, shift.end_time);

    return [
      'BEGIN:VEVENT',
      `UID:${shift.id}@bsw2026`,
      `DTSTAMP:${dtstamp}`,
      `DTSTART;TZID=America/Denver:${dtstart}`,
      `DTEND;TZID=America/Denver:${dtend}`,
      `SUMMARY:BSW Volunteer — ${escapeIcal(shift.role)}`,
      `LOCATION:${escapeIcal(shift.location)}`,
      `DESCRIPTION:${escapeIcal(shift.description)}`,
      'END:VEVENT',
    ].join('\r\n');
  });

  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//BSW 2026//Volunteer Schedule//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    ...events,
    'END:VCALENDAR',
  ].join('\r\n');
}

export function downloadIcs(shifts, filename = 'bsw-volunteer-shifts.ics') {
  const ics = generateIcs(shifts);
  const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
