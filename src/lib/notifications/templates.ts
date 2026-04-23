interface Shift {
  id: string
  role: string
  day: string
  start_time: string
  end_time: string
  location: string
  address?: string | null
}

interface Volunteer {
  name: string
  email: string
}

function formatDay(day: string): string {
  const days: Record<string, string> = {
    '2026-05-04': 'Monday, May 4',
    '2026-05-05': 'Tuesday, May 5',
    '2026-05-06': 'Wednesday, May 6',
    '2026-05-07': 'Thursday, May 7',
    '2026-05-08': 'Friday, May 8',
  }
  return days[day] || day
}

function formatTime(time: string): string {
  const [hours, minutes] = time.split(':')
  const hour = parseInt(hours, 10)
  const ampm = hour >= 12 ? 'PM' : 'AM'
  const displayHour = hour % 12 || 12
  return `${displayHour}:${minutes} ${ampm}`
}

function formatLocation(shift: Shift): string {
  return shift.address ? `${shift.location}, ${shift.address}` : shift.location
}

const emailStyles = {
  body: 'font-family: system-ui, -apple-system, sans-serif; line-height: 1.6; color: #3f4a56; max-width: 600px; margin: 0 auto; padding: 20px;',
  header: 'background: linear-gradient(90deg, #5e9a98 0%, #b5aa5f 45%, #f39c3d 100%); padding: 30px; text-align: center; border-radius: 8px 8px 0 0;',
  headerTitle: 'color: white; margin: 0; font-size: 24px; font-weight: bold;',
  content: 'background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px;',
  shiftBox: 'background: #f6f7f5; padding: 20px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #5aaeb3;',
  shiftRole: 'font-size: 18px; font-weight: 600; color: #1a1a1a; margin: 0 0 10px 0;',
  shiftDetail: 'margin: 5px 0; color: #6f7883;',
  button: 'display: inline-block; background: #5aaeb3; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 20px;',
  footer: 'text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #6f7883; font-size: 14px;',
}

export function volunteerConfirmationTemplate(shift: Shift, volunteer: Volunteer) {
  const subject = `You're signed up! ${shift.role} — Boulder Startup Week 2026`
  
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="${emailStyles.body}">
  <div style="${emailStyles.header}">
    <h1 style="${emailStyles.headerTitle}">Boulder Startup Week 2026</h1>
    <p style="color: white; margin: 10px 0 0 0;">Volunteer Confirmation</p>
  </div>
  
  <div style="${emailStyles.content}">
    <p>Hi ${volunteer.name},</p>
    
    <p>Thanks for volunteering! You're confirmed for:</p>
    
    <div style="${emailStyles.shiftBox}">
      <p style="${emailStyles.shiftRole}">${shift.role}</p>
      <p style="${emailStyles.shiftDetail}"><strong>Date:</strong> ${formatDay(shift.day)}</p>
      <p style="${emailStyles.shiftDetail}"><strong>Time:</strong> ${formatTime(shift.start_time)} – ${formatTime(shift.end_time)}</p>
      <p style="${emailStyles.shiftDetail}"><strong>Location:</strong> ${formatLocation(shift)}</p>
    </div>
    
    <p>You'll receive reminder emails 24 hours and 1 hour before your shift.</p>
    
    <a href="https://boulderstartupweek.com/open-shifts" style="${emailStyles.button}">View My Shifts</a>
    
    <div style="${emailStyles.footer}">
      <p>Questions? Reply to this email or contact the volunteer team.</p>
      <p>Boulder Startup Week · May 4–8, 2026</p>
    </div>
  </div>
</body>
</html>
  `

  const text = `Hi ${volunteer.name},

Thanks for volunteering! You're confirmed for:

${shift.role}
Date: ${formatDay(shift.day)}
Time: ${formatTime(shift.start_time)} – ${formatTime(shift.end_time)}
Location: ${formatLocation(shift)}

You'll receive reminder emails 24 hours and 1 hour before your shift.

View your shifts: https://boulderstartupweek.com/open-shifts

Questions? Reply to this email or contact the volunteer team.

Boulder Startup Week · May 4–8, 2026`

  return { subject, html, text }
}

export function reminder24hTemplate(shift: Shift, volunteer: Volunteer) {
  const subject = `Tomorrow: ${shift.role} shift — Boulder Startup Week 2026`
  
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="${emailStyles.body}">
  <div style="${emailStyles.header}">
    <h1 style="${emailStyles.headerTitle}">Reminder: Your Shift is Tomorrow!</h1>
  </div>
  
  <div style="${emailStyles.content}">
    <p>Hi ${volunteer.name},</p>
    
    <p>This is a friendly reminder that you have a volunteer shift <strong>tomorrow</strong>:</p>
    
    <div style="${emailStyles.shiftBox}">
      <p style="${emailStyles.shiftRole}">${shift.role}</p>
      <p style="${emailStyles.shiftDetail}"><strong>Date:</strong> ${formatDay(shift.day)}</p>
      <p style="${emailStyles.shiftDetail}"><strong>Time:</strong> ${formatTime(shift.start_time)} – ${formatTime(shift.end_time)}</p>
      <p style="${emailStyles.shiftDetail}"><strong>Location:</strong> ${formatLocation(shift)}</p>
    </div>
    
    <p>Please arrive 15 minutes early. You'll get another reminder 1 hour before your shift starts.</p>
    
    <p style="margin-top: 20px;"><strong>Can't make it?</strong> Please cancel ASAP so we can find a replacement.</p>
    
    <a href="https://boulderstartupweek.com/open-shifts" style="${emailStyles.button}">Manage My Shifts</a>
    
    <div style="${emailStyles.footer}">
      <p>Boulder Startup Week · May 4–8, 2026</p>
    </div>
  </div>
</body>
</html>
  `

  const text = `Reminder: Your Shift is Tomorrow!

Hi ${volunteer.name},

This is a friendly reminder that you have a volunteer shift tomorrow:

${shift.role}
Date: ${formatDay(shift.day)}
Time: ${formatTime(shift.start_time)} – ${formatTime(shift.end_time)}
Location: ${formatLocation(shift)}

Please arrive 15 minutes early. You'll get another reminder 1 hour before your shift starts.

Can't make it? Please cancel ASAP so we can find a replacement.

Manage your shifts: https://boulderstartupweek.com/open-shifts

Boulder Startup Week · May 4–8, 2026`

  return { subject, html, text }
}

export function reminder1hTemplate(shift: Shift, volunteer: Volunteer) {
  const subject = `Starting soon: ${shift.role} — Boulder Startup Week 2026`
  
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="${emailStyles.body}">
  <div style="${emailStyles.header}">
    <h1 style="${emailStyles.headerTitle}">Your Shift Starts in 1 Hour!</h1>
  </div>
  
  <div style="${emailStyles.content}">
    <p>Hi ${volunteer.name},</p>
    
    <p>Your volunteer shift starts in about <strong>1 hour</strong>:</p>
    
    <div style="${emailStyles.shiftBox}">
      <p style="${emailStyles.shiftRole}">${shift.role}</p>
      <p style="${emailStyles.shiftDetail}"><strong>Time:</strong> ${formatTime(shift.start_time)} – ${formatTime(shift.end_time)}</p>
      <p style="${emailStyles.shiftDetail}"><strong>Location:</strong> ${formatLocation(shift)}</p>
    </div>
    
    <p>See you there!</p>
    
    <div style="${emailStyles.footer}">
      <p>Boulder Startup Week · May 4–8, 2026</p>
    </div>
  </div>
</body>
</html>
  `

  const text = `Your Shift Starts in 1 Hour!

Hi ${volunteer.name},

Your volunteer shift starts in about 1 hour:

${shift.role}
Time: ${formatTime(shift.start_time)} – ${formatTime(shift.end_time)}
Location: ${formatLocation(shift)}

See you there!

Boulder Startup Week · May 4–8, 2026`

  return { subject, html, text }
}

export function adminBulkMessageTemplate(subject: string, message: string, eventName: string) {
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="${emailStyles.body}">
  <div style="${emailStyles.header}">
    <h1 style="${emailStyles.headerTitle}">${eventName}</h1>
    <p style="color: white; margin: 10px 0 0 0;">Message from the Volunteer Team</p>
  </div>
  
  <div style="${emailStyles.content}">
    <h2 style="color: #1a1a1a; margin-top: 0;">${subject}</h2>
    
    <div style="white-space: pre-wrap; line-height: 1.6;">${message.replace(/\n/g, '<br>')}</div>
    
    <div style="${emailStyles.footer}">
      <p>Questions? Reply to this email.</p>
      <p>${eventName} · May 4–8, 2026</p>
    </div>
  </div>
</body>
</html>
  `

  return { subject, html, text: message }
}
