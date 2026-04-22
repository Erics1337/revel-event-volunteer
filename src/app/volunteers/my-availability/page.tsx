'use client'

import { useState } from 'react'
import Link from 'next/link'

const DAYS = [
  { date: '2026-05-04', label: 'Mon', full: 'Monday, May 4' },
  { date: '2026-05-05', label: 'Tue', full: 'Tuesday, May 5' },
  { date: '2026-05-06', label: 'Wed', full: 'Wednesday, May 6' },
  { date: '2026-05-07', label: 'Thu', full: 'Thursday, May 7' },
  { date: '2026-05-08', label: 'Fri', full: 'Friday, May 8' },
]

const TIME_SLOTS = [
  { id: '0830', label: '8:30 – 10:30am' },
  { id: '1030', label: '10:30am – 12:30pm' },
  { id: '1230', label: '12:30 – 2:30pm' },
  { id: '1430', label: '2:30 – 5:30pm' },
]

type DayAvailability = { enabled: boolean; slots: string[] }
type AvailabilityMap = Record<string, DayAvailability>

const ACCENT_FONT = '"Space Grotesk", Inter, system-ui, -apple-system, sans-serif'

function defaultAvailability(): AvailabilityMap {
  return Object.fromEntries(
    DAYS.map((d) => [d.date, { enabled: false, slots: [] }])
  )
}

export default function MyAvailabilityPage() {
  const [availability, setAvailability] = useState<AvailabilityMap>(defaultAvailability)
  const [saved, setSaved] = useState(false)

  function toggleDay(date: string) {
    setAvailability((prev) => {
      const current = prev[date]
      return {
        ...prev,
        [date]: {
          enabled: !current.enabled,
          slots: !current.enabled ? TIME_SLOTS.map((s) => s.id) : [],
        },
      }
    })
  }

  function toggleSlot(date: string, slotId: string) {
    setAvailability((prev) => {
      const current = prev[date]
      const slots = current.slots.includes(slotId)
        ? current.slots.filter((s) => s !== slotId)
        : [...current.slots, slotId]
      return {
        ...prev,
        [date]: { enabled: slots.length > 0, slots },
      }
    })
  }

  async function handleSave() {
    // TODO: PUT /api/volunteers/availability with availability data
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  const activeDays = DAYS.filter((d) => availability[d.date].enabled)

  return (
    <div className="min-h-screen bg-[#f6f7f5]">
      <VolunteerNav />

      <div className="mx-auto max-w-2xl px-4 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-[#3f4a56]" style={{ fontFamily: ACCENT_FONT }}>
            My Availability
          </h1>
          <p className="mt-1 text-sm text-[#6f7883]">
            Tell us which days and time blocks work for you. We&apos;ll filter open shifts to match.
          </p>
        </div>

        <div className="flex flex-col gap-4">
          {DAYS.map((day) => {
            const dayState = availability[day.date]
            return (
              <div
                key={day.date}
                className={`rounded-md border bg-white p-4 transition-colors ${
                  dayState.enabled ? 'border-[#5aaeb3]' : 'border-[#e6e8eb]'
                }`}
              >
                {/* Day toggle */}
                <label className="flex cursor-pointer items-center justify-between">
                  <span className="font-semibold text-[#3f4a56]">{day.full}</span>
                  <button
                    type="button"
                    onClick={() => toggleDay(day.date)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      dayState.enabled ? 'bg-[#5aaeb3]' : 'bg-[#d1d5db]'
                    }`}
                    aria-pressed={dayState.enabled}
                    aria-label={`Toggle ${day.full}`}
                  >
                    <span
                      className={`inline-block h-4 w-4 rounded-full bg-white shadow transition-transform ${
                        dayState.enabled ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </label>

                {/* Time slots */}
                {dayState.enabled && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {TIME_SLOTS.map((slot) => {
                      const active = dayState.slots.includes(slot.id)
                      return (
                        <button
                          key={slot.id}
                          type="button"
                          onClick={() => toggleSlot(day.date, slot.id)}
                          className={`rounded-full border px-3 py-1.5 text-sm font-medium transition ${
                            active
                              ? 'border-[#5aaeb3] bg-[#5aaeb3] text-white'
                              : 'border-[#e6e8eb] bg-[#f6f7f5] text-[#6f7883] hover:border-[#5aaeb3] hover:text-[#5aaeb3]'
                          }`}
                        >
                          {slot.label}
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* Summary */}
        {activeDays.length > 0 && (
          <div className="mt-5 rounded-md border border-[#d6eced] bg-[#eef8f8] px-4 py-3 text-sm text-[#6aa9ae]">
            Available on:{' '}
            <span className="font-semibold">
              {activeDays.map((d) => d.label).join(', ')}
            </span>
          </div>
        )}

        <div className="mt-6 flex items-center gap-4">
          <button
            onClick={handleSave}
            className="rounded-sm bg-[#ef8f3d] px-8 py-2.5 text-sm font-semibold text-white shadow-[4px_4px_0_rgba(26,26,26,0.85)] transition hover:translate-x-[2px] hover:translate-y-[2px] hover:bg-[#e98529] hover:shadow-[2px_2px_0_rgba(26,26,26,0.85)]"
          >
            Save availability
          </button>
          {saved && (
            <span className="flex items-center gap-1.5 text-sm font-medium text-[#5aaeb3]">
              <CheckIcon className="h-4 w-4" /> Saved
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

function VolunteerNav() {
  const links = [
    { href: '/volunteers', label: 'Open Shifts' },
    { href: '/volunteers/my-availability', label: 'My Availability' },
    { href: '/profile', label: 'My Profile' },
  ]
  return (
    <nav className="sticky top-0 z-30 border-b border-[#e6e8eb] bg-white">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between gap-4 px-4">
        <Link href="/volunteers" className="text-lg font-bold tracking-tight text-[#6aa9ae]" style={{ fontFamily: ACCENT_FONT }}>
          BSW <span className="text-[#4a5563]">2026</span>
        </Link>
        <div className="flex flex-1 items-center justify-end gap-1 overflow-x-auto">
          {links.map((link) => {
            const isActive = typeof window !== 'undefined' && window.location.pathname === link.href
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium transition ${
                  isActive
                    ? 'bg-[#eef8f8] text-[#6aa9ae]'
                    : 'text-[#6f7883] hover:bg-[#f6f7f5] hover:text-[#6aa9ae]'
                }`}
              >
                {link.label}
              </Link>
            )
          })}
        </div>
      </div>
    </nav>
  )
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  )
}
