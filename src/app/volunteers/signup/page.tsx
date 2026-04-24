'use client'

import { useState } from 'react'
import Link from 'next/link'

const DAYS = [
  { date: '2026-05-04', full: 'Monday, May 4' },
  { date: '2026-05-05', full: 'Tuesday, May 5' },
  { date: '2026-05-06', full: 'Wednesday, May 6' },
  { date: '2026-05-07', full: 'Thursday, May 7' },
  { date: '2026-05-08', full: 'Friday, May 8' },
]

const MOBILITY_OPTIONS = [
  'Prefer seated role',
  'Prefer standing/active role',
  'Limited stairs/walking',
  'Need accessible parking',
  'Need accessible entrance',
  'Avoid heavy lifting',
]

const ROLE_PREF_OPTIONS = [
  'Avoid public speaking',
  'Avoid large crowds',
  'Love greeting people',
  'Prefer behind-the-scenes',
  'Happy to help with setup/teardown',
]

const STEPS = ['Your Info', 'Availability & Preferences', 'Notifications']

const ACCENT_FONT = '"Space Grotesk", Inter, system-ui, -apple-system, sans-serif'

interface FormState {
  name: string
  email: string
  phone: string
  headline: string
  availability: string[]
  mobility_prefs: string[]
  role_prefs: string[]
  pref_notes: string
  comms_preference: 'email' | 'sms'
}

export default function VolunteerSignup() {
  const [step, setStep] = useState(0)
  const [submitted, setSubmitted] = useState(false)
  const [form, setForm] = useState<FormState>({
    name: '',
    email: '',
    phone: '',
    headline: '',
    availability: DAYS.map((day) => day.date),
    mobility_prefs: [],
    role_prefs: [],
    pref_notes: '',
    comms_preference: 'email',
  })

  function update<K extends keyof FormState>(field: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  function toggleArray(field: 'availability' | 'mobility_prefs' | 'role_prefs', value: string) {
    setForm((prev) => {
      const arr = prev[field] as string[]
      return {
        ...prev,
        [field]: arr.includes(value) ? arr.filter((v) => v !== value) : [...arr, value],
      }
    })
  }

  function canAdvance() {
    if (step === 0) return form.name.trim() && form.email.trim()
    if (step === 1) return form.availability.length > 0
    return true
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    // TODO: POST /api/volunteers with form data
    setSubmitted(true)
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-[#f6f7f5]">
        <VolunteerNav />
        <div className="mx-auto max-w-md px-4 py-16 text-center">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-[#eef8f8]">
            <CheckIcon className="h-8 w-8 text-[#5aaeb3]" />
          </div>
          <h1 className="mb-3 text-3xl font-bold text-[#3f4a56]" style={{ fontFamily: ACCENT_FONT }}>
            You&apos;re in.
          </h1>
          <p className="text-base leading-relaxed text-[#6f7883]">
            You&apos;re officially on the BSW 2026 volunteer team. We&apos;ll send your confirmation to{' '}
            <strong>{form.email}</strong>.
          </p>
          <p className="mt-6 text-sm font-medium text-[#3f4a56]">What do you want to do next?</p>
          <div className="mt-4 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/volunteers/my-availability"
              className="flex-1 rounded-sm border-2 border-[#6aa9ae] px-6 py-3 text-center text-sm font-semibold text-[#6aa9ae] shadow-[3px_3px_0_rgba(31,41,55,0.85)] transition hover:translate-x-[2px] hover:translate-y-[2px] hover:bg-[#eef8f8] hover:shadow-[1px_1px_0_rgba(31,41,55,0.85)]"
            >
              Set my availability
            </Link>
            <Link
              href="/open-shifts"
              className="flex-1 rounded-sm bg-[#ef8f3d] px-6 py-3 text-center text-sm font-semibold text-white shadow-[4px_4px_0_rgba(26,26,26,0.85)] transition hover:translate-x-[2px] hover:translate-y-[2px] hover:bg-[#e98529] hover:shadow-[2px_2px_0_rgba(26,26,26,0.85)]"
            >
              Browse open shifts
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#f6f7f5]">
      <VolunteerNav />

      <div className="mx-auto max-w-lg px-4 py-8">
        {/* Step indicator */}
        <div className="mb-8 flex items-center">
          {STEPS.map((label, i) => (
            <div key={i} className="flex flex-1 items-center last:flex-none">
              <div className="flex flex-col items-center">
                <div
                  className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold transition-colors ${
                    i <= step ? 'bg-[#5aaeb3] text-white' : 'bg-[#e6e8eb] text-[#9ca3af]'
                  }`}
                >
                  {i < step ? <CheckIcon className="h-4 w-4" /> : i + 1}
                </div>
                <span className={`mt-1 text-xs font-medium ${i === step ? 'text-[#5aaeb3]' : 'text-[#9ca3af]'}`}>
                  {label}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <div className={`mb-4 mx-2 h-0.5 flex-1 ${i < step ? 'bg-[#5aaeb3]' : 'bg-[#e6e8eb]'}`} />
              )}
            </div>
          ))}
        </div>

        <form onSubmit={step === STEPS.length - 1 ? handleSubmit : (e) => e.preventDefault()}>
          <div className="rounded-md border border-[#e6e8eb] bg-white p-6 shadow-[0_1px_2px_rgba(26,26,26,0.05)]">

            {/* Step 0 — Your Info */}
            {step === 0 && (
              <div className="flex flex-col gap-4">
                <div>
                  <h2 className="text-2xl font-semibold text-[#3f4a56]" style={{ fontFamily: ACCENT_FONT }}>Your Info</h2>
                  <p className="mt-1 text-sm text-[#6f7883]">No login needed — just your name and email.</p>
                </div>
                <Field label="Name *">
                  <input className="input" placeholder="Full name" value={form.name} onChange={(e) => update('name', e.target.value)} />
                </Field>
                <Field label="Email *">
                  <input className="input" type="email" placeholder="you@example.com" value={form.email} onChange={(e) => update('email', e.target.value)} />
                </Field>
                <Field label="Phone">
                  <input className="input" type="tel" placeholder="(720) 555-0100" value={form.phone} onChange={(e) => update('phone', e.target.value)} />
                </Field>
                <Field label={<>One-line headline <span className="font-normal text-[#9ca3af]">(optional)</span></>}>
                  <input className="input" placeholder="Founder, Community Builder, Dog Walker..." value={form.headline} onChange={(e) => update('headline', e.target.value)} />
                </Field>
              </div>
            )}

            {/* Step 1 — Availability & Preferences */}
            {step === 1 && (
              <div className="flex flex-col gap-6">
                <div>
                  <h2 className="text-2xl font-semibold text-[#3f4a56]" style={{ fontFamily: ACCENT_FONT }}>Availability &amp; Preferences</h2>
                  <p className="mt-1 text-sm text-[#6f7883]">Tell us when you&apos;re free and anything that&apos;ll help us place you well.</p>
                </div>

                <div>
                  <h3 className="mb-1 font-semibold text-[#3f4a56]">What days can you volunteer? *</h3>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {DAYS.map((d) => (
                      <PillButton
                        key={d.date}
                        active={form.availability.includes(d.date)}
                        onClick={() => toggleArray('availability', d.date)}
                      >
                        {d.full}
                      </PillButton>
                    ))}
                  </div>
                </div>

                <div className="flex flex-col gap-5 border-t border-[#e6e8eb] pt-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-[#9ca3af]">Shift Preferences</p>

                  <div>
                    <h3 className="mb-0.5 font-semibold text-[#3f4a56]">Physical &amp; mobility</h3>
                    <p className="mb-3 text-sm text-[#6f7883]">Any mobility considerations we should plan for?</p>
                    <div className="flex flex-wrap gap-2">
                      {MOBILITY_OPTIONS.map((opt) => (
                        <PillButton key={opt} active={form.mobility_prefs.includes(opt)} onClick={() => toggleArray('mobility_prefs', opt)}>
                          {opt}
                        </PillButton>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h3 className="mb-0.5 font-semibold text-[#3f4a56]">Role preferences</h3>
                    <p className="mb-3 text-sm text-[#6f7883]">Any tasks you&apos;d prefer to avoid or lean into?</p>
                    <div className="flex flex-wrap gap-2">
                      {ROLE_PREF_OPTIONS.map((opt) => (
                        <PillButton key={opt} active={form.role_prefs.includes(opt)} onClick={() => toggleArray('role_prefs', opt)}>
                          {opt}
                        </PillButton>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h3 className="mb-0.5 font-semibold text-[#3f4a56]">Anything else?</h3>
                    <p className="mb-3 text-sm text-[#6f7883]">Tell us anything we missed that would help you have a good experience.</p>
                    <textarea
                      className="input min-h-[80px] resize-y"
                      placeholder="e.g. I'm hard of hearing, need a quiet area, bringing my service dog..."
                      value={form.pref_notes}
                      onChange={(e) => update('pref_notes', e.target.value)}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Step 2 — Notifications */}
            {step === 2 && (
              <div className="flex flex-col gap-4">
                <div>
                  <h2 className="text-2xl font-semibold text-[#3f4a56]" style={{ fontFamily: ACCENT_FONT }}>How should we reach you?</h2>
                  <p className="mt-1 text-sm text-[#6f7883]">
                    You&apos;ll get a confirmation when you sign up for a shift, and reminders 24 hours and 1 hour before.
                  </p>
                </div>

                {(['email', 'sms'] as const).map((value) => (
                  <label
                    key={value}
                    className={`flex cursor-pointer items-start gap-4 rounded-md border-2 p-4 transition-colors ${
                      form.comms_preference === value ? 'border-[#5aaeb3] bg-[#eef8f8]' : 'border-[#e6e8eb]'
                    }`}
                  >
                    <input
                      type="radio"
                      name="comms_preference"
                      value={value}
                      checked={form.comms_preference === value}
                      onChange={() => update('comms_preference', value)}
                      className="mt-0.5 accent-[#5aaeb3]"
                    />
                    <div>
                      <p className="font-medium text-[#3f4a56]">{value === 'email' ? 'Email' : 'SMS'}</p>
                      <p className="text-sm text-[#6f7883]">
                        {value === 'email' ? 'Sent to the address you provided' : 'Text message to your phone'}
                      </p>
                    </div>
                  </label>
                ))}

                <div className="mt-2 rounded-md bg-[#f6f7f5] p-4 text-sm text-[#6f7883] space-y-1">
                  <p><span className="font-medium text-[#3f4a56]">Name:</span> {form.name}</p>
                  <p><span className="font-medium text-[#3f4a56]">Email:</span> {form.email}</p>
                  <p><span className="font-medium text-[#3f4a56]">Available:</span> {form.availability.length} day{form.availability.length !== 1 ? 's' : ''}</p>
                </div>
              </div>
            )}
          </div>

          {/* Navigation */}
          <div className="mt-6 flex justify-between">
            {step > 0 ? (
              <button
                type="button"
                onClick={() => setStep((s) => s - 1)}
                className="rounded-sm border border-[#e6e8eb] px-5 py-2.5 text-sm font-medium text-[#6f7883] transition hover:border-[#6aa9ae] hover:text-[#6aa9ae]"
              >
                Back
              </button>
            ) : (
              <div />
            )}

            {step < STEPS.length - 1 ? (
              <button
                type="button"
                onClick={() => setStep((s) => s + 1)}
                disabled={!canAdvance()}
                className="rounded-sm bg-[#ef8f3d] px-8 py-2.5 text-sm font-semibold text-white shadow-[4px_4px_0_rgba(26,26,26,0.85)] transition hover:translate-x-[2px] hover:translate-y-[2px] hover:bg-[#e98529] hover:shadow-[2px_2px_0_rgba(26,26,26,0.85)] disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none disabled:translate-x-0 disabled:translate-y-0"
              >
                Continue
              </button>
            ) : (
              <button
                type="submit"
                className="rounded-sm bg-[#ef8f3d] px-8 py-2.5 text-sm font-semibold text-white shadow-[4px_4px_0_rgba(26,26,26,0.85)] transition hover:translate-x-[2px] hover:translate-y-[2px] hover:bg-[#e98529] hover:shadow-[2px_2px_0_rgba(26,26,26,0.85)]"
              >
                Join the team
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  )
}

function Field({ label, children }: { label: React.ReactNode; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-[#3f4a56]">{label}</label>
      {children}
    </div>
  )
}

function PillButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full border px-3 py-1.5 text-sm font-medium transition ${
        active
          ? 'border-[#5aaeb3] bg-[#5aaeb3] text-white'
          : 'border-[#e6e8eb] bg-white text-[#6f7883] hover:border-[#5aaeb3] hover:text-[#5aaeb3]'
      }`}
    >
      {children}
    </button>
  )
}

function VolunteerNav() {
  const links = [
    { href: '/open-shifts', label: 'Open Shifts' },
    { href: '/volunteers/my-availability', label: 'My Availability' },
    { href: '/profile', label: 'My Profile' },
  ]
  return (
    <nav className="sticky top-0 z-30 border-b border-[#e6e8eb] bg-white">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between gap-4 px-4">
        <Link href="/open-shifts" className="text-lg font-bold tracking-tight text-[#6aa9ae]" style={{ fontFamily: ACCENT_FONT }}>
          BSW <span className="text-[#4a5563]">2026</span>
        </Link>
        <div className="flex flex-1 items-center justify-end gap-1 overflow-x-auto">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium text-[#6f7883] transition hover:bg-[#f6f7f5] hover:text-[#6aa9ae]"
            >
              {link.label}
            </Link>
          ))}
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
