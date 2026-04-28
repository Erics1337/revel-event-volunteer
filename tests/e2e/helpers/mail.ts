import { expect } from '@playwright/test'

const mailBaseUrl = process.env.MAIL_CAPTURE_URL ?? 'http://127.0.0.1:54324'

type MailMessageSummary = {
  id: string
  to: string[]
}

function mailboxFor(email: string) {
  return email.split('@')[0]
}

async function fetchJson(url: string, init?: RequestInit) {
  const response = await fetch(url, init)
  if (!response.ok) {
    throw new Error(`${response.status} ${response.statusText}`)
  }
  return response.json() as Promise<unknown>
}

function collectRecipients(value: unknown): string[] {
  if (!Array.isArray(value)) return []

  return value
    .map((item) => {
      if (typeof item === 'string') return item
      if (item && typeof item === 'object') {
        const record = item as Record<string, unknown>
        return [record.Address, record.address, record.Mailbox, record.mailbox]
          .find((candidate): candidate is string => typeof candidate === 'string')
      }
      return null
    })
    .filter((candidate): candidate is string => Boolean(candidate))
}

function normalizeMailpitMessages(payload: unknown): MailMessageSummary[] {
  const messages = Array.isArray((payload as { messages?: unknown }).messages)
    ? (payload as { messages: unknown[] }).messages
    : Array.isArray(payload)
      ? payload
      : []

  return messages
    .map((message) => {
      if (!message || typeof message !== 'object') return null
      const record = message as Record<string, unknown>
      const id = [record.ID, record.Id, record.id].find(
        (candidate): candidate is string | number => typeof candidate === 'string' || typeof candidate === 'number'
      )
      if (id === undefined) return null

      const to = [
        ...collectRecipients(record.To),
        ...collectRecipients(record.to),
        ...(typeof record.Recipient === 'string' ? [record.Recipient] : []),
        ...(typeof record.recipient === 'string' ? [record.recipient] : []),
      ]

      return { id: String(id), to }
    })
    .filter((message): message is MailMessageSummary => Boolean(message))
}

function extractHtml(payload: unknown) {
  if (!payload || typeof payload !== 'object') return ''
  const record = payload as Record<string, unknown>

  for (const candidate of [record.HTML, record.Html, record.html, record.Body, record.body, record.Text, record.text]) {
    if (typeof candidate === 'string' && candidate.length > 0) {
      return candidate
    }
  }

  return ''
}

async function listMessages(email: string) {
  const mailbox = mailboxFor(email)

  try {
    return normalizeMailpitMessages(await fetchJson(`${mailBaseUrl}/api/v1/messages`))
  } catch {
    // Fall through to the older Inbucket-shaped API.
  }

  try {
    return normalizeMailpitMessages(await fetchJson(`${mailBaseUrl}/api/v1/mailbox/${encodeURIComponent(mailbox)}`))
  } catch {
    return []
  }
}

async function readMessage(email: string, id: string) {
  const mailbox = mailboxFor(email)

  for (const url of [
    `${mailBaseUrl}/api/v1/message/${encodeURIComponent(id)}`,
    `${mailBaseUrl}/api/v1/mailbox/${encodeURIComponent(mailbox)}/${encodeURIComponent(id)}`,
  ]) {
    try {
      const html = extractHtml(await fetchJson(url))
      if (html) return html
    } catch {
      // Try the next API shape.
    }
  }

  return ''
}

export async function clearCapturedEmails(email: string) {
  const mailbox = mailboxFor(email)

  for (const url of [
    `${mailBaseUrl}/api/v1/messages`,
    `${mailBaseUrl}/api/v1/mailbox/${encodeURIComponent(mailbox)}`,
  ]) {
    await fetch(url, { method: 'DELETE' }).catch(() => undefined)
  }
}

export async function waitForMagicLink(email: string, baseURL: string) {
  const deadline = Date.now() + 30_000

  while (Date.now() < deadline) {
    const messages = await listMessages(email)
    const matchingMessages = messages.filter((message) =>
      message.to.some((recipient) => recipient.toLowerCase().includes(email.toLowerCase()))
    )

    for (const message of matchingMessages) {
      const html = await readMessage(email, message.id)
      const decoded = html
        .replaceAll('&amp;', '&')
        .replaceAll('&#43;', '+')

      const callbackMatch = decoded.match(/https?:\/\/[^"'\s<>]+\/auth\/callback\?[^"'\s<>]+/)
      if (callbackMatch) {
        const url = new URL(callbackMatch[0])
        return new URL(`${url.pathname}${url.search}`, baseURL).toString()
      }

      const relativeMatch = decoded.match(/\/auth\/callback\?[^"'\s<>]+/)
      if (relativeMatch) {
        return new URL(relativeMatch[0], baseURL).toString()
      }
    }

    await new Promise((resolve) => setTimeout(resolve, 500))
  }

  await expect.poll(async () => (await listMessages(email)).length, {
    message: `Expected local mail capture to receive a magic link for ${email}`,
    timeout: 1,
  }).toBeGreaterThan(0)

  throw new Error(`No magic-link callback URL found for ${email}`)
}
