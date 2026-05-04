import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'volunteers@boulderstartupweek.com'
const REPLY_TO_EMAILS = (process.env.RESEND_REPLY_TO_EMAILS || 'stuhldreheremily@gmail.com,ana.r.montgomery@gmail.com,hmeibling@gmail.com')
  .split(',')
  .map((email) => email.trim())
  .filter(Boolean)

interface EmailOptions {
  to: string
  subject: string
  html: string
  text?: string
}

export async function sendEmail(options: EmailOptions): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text,
      replyTo: REPLY_TO_EMAILS,
    })

    if (error) {
      console.error('Resend error:', error)
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    console.error('Failed to send email:', errorMessage)
    return { success: false, error: errorMessage }
  }
}

export { FROM_EMAIL, REPLY_TO_EMAILS }
