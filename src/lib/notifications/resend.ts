import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'volunteers@boulderstartupweek.com'
const REPLY_TO_EMAILS = (process.env.RESEND_REPLY_TO_EMAILS || 'stuhldreheremily@gmail.com,jana.r.montgomery@gmail.com,hmeibling@gmail.com')
  .split(',')
  .map((email) => email.trim())
  .filter(Boolean)
const SEND_INTERVAL_MS = 500
const RATE_LIMIT_RETRY_DELAYS_MS = [2000, 5000, 10000]

let nextSendAt = 0
let sendQueue = Promise.resolve()

interface EmailOptions {
  to: string
  subject: string
  html: string
  text?: string
}

function sleep(milliseconds: number) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds))
}

function isRateLimitError(message?: string) {
  if (!message) return false

  const normalizedMessage = message.toLowerCase()
  return normalizedMessage.includes('too many requests') || normalizedMessage.includes('rate limit')
}

async function waitForSendWindow() {
  const now = Date.now()
  const delay = Math.max(0, nextSendAt - now)

  if (delay > 0) {
    await sleep(delay)
  }

  nextSendAt = Date.now() + SEND_INTERVAL_MS
}

async function sendEmailWithRetry(options: EmailOptions): Promise<{ success: boolean; error?: string }> {
  let lastError: string | undefined

  for (let attempt = 0; attempt <= RATE_LIMIT_RETRY_DELAYS_MS.length; attempt++) {
    await waitForSendWindow()

    try {
      const { error } = await resend.emails.send({
        from: FROM_EMAIL,
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text,
        replyTo: REPLY_TO_EMAILS,
      })

      if (!error) {
        return { success: true }
      }

      lastError = error.message
      console.error('Resend error:', error)

      if (!isRateLimitError(lastError) || attempt === RATE_LIMIT_RETRY_DELAYS_MS.length) {
        return { success: false, error: lastError }
      }
    } catch (error) {
      lastError = error instanceof Error ? error.message : 'Unknown error'
      console.error('Failed to send email:', lastError)

      if (!isRateLimitError(lastError) || attempt === RATE_LIMIT_RETRY_DELAYS_MS.length) {
        return { success: false, error: lastError }
      }
    }

    await sleep(RATE_LIMIT_RETRY_DELAYS_MS[attempt])
  }

  return { success: false, error: lastError }
}

export async function sendEmail(options: EmailOptions): Promise<{ success: boolean; error?: string }> {
  const sendTask = sendQueue.then(() => sendEmailWithRetry(options))
  sendQueue = sendTask.then(
    () => undefined,
    () => undefined
  )

  return sendTask
}

export { FROM_EMAIL, REPLY_TO_EMAILS }
