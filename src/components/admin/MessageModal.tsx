'use client'

import { useState } from 'react'
import { CheckIcon } from '@/components/icons'

interface MessageModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  subtitle: string
  submitLabel?: string
  successTitle?: string
  successMessage?: string
  onSend: (subject: string, message: string) => Promise<void>
}

export function MessageModal({
  isOpen,
  onClose,
  title,
  subtitle,
  submitLabel = 'Send Message',
  successTitle = 'Message sent!',
  successMessage = 'Volunteers will receive the message shortly.',
  onSend,
}: MessageModalProps) {
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!subject.trim() || !message.trim()) {
      return
    }

    setSending(true)
    try {
      await onSend(subject, message)
      setSent(true)
      setTimeout(() => {
        onClose()
        setSent(false)
        setSubject('')
        setMessage('')
      }, 1500)
    } catch (error) {
      console.error('Error sending message:', error)
      alert('Failed to send message')
    } finally {
      setSending(false)
    }
  }

  const handleClose = () => {
    if (!sending) {
      onClose()
      setSubject('')
      setMessage('')
      setSent(false)
    }
  }

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50"
      onClick={(e) => {
        if (e.target === e.currentTarget) handleClose()
      }}
    >
      <div className="bg-white rounded-md p-6 max-w-lg w-full shadow-card max-h-[90vh] overflow-y-auto">
        {sent ? (
          <div className="text-center py-4">
            <div className="w-12 h-12 bg-teal-light rounded-full flex items-center justify-center mx-auto mb-3">
              <CheckIcon className="w-6 h-6 text-teal" />
            </div>
            <p className="font-semibold text-charcoal">{successTitle}</p>
            <p className="text-sm text-gray-text mt-1">
              {successMessage}
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <div>
              <h3 className="font-accent text-xl font-semibold text-charcoal mb-1">
                {title}
              </h3>
              <p className="text-sm text-gray-text">
                {subtitle}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Subject
              </label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="input"
                placeholder="Enter message subject"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Message
              </label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="input"
                rows={6}
                placeholder="Enter your message..."
                required
              />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={handleClose}
                disabled={sending}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={sending || !subject.trim() || !message.trim()}
                className="bg-teal-500 text-white px-6 py-2 rounded-md font-medium hover:bg-teal-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {sending ? 'Sending...' : submitLabel}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
