'use client';

import { useState } from 'react';
import Nav from '../../../../components/Nav';
import { DAYS } from '../../../../lib/mockData';

const STEPS = ['Your Info', 'Availability & Preferences', 'Notifications'];

const MOBILITY_OPTIONS = [
  'Prefer seated role',
  'Prefer standing/active role',
  'Limited stairs/walking',
  'Need accessible parking',
  'Need accessible entrance',
  'Avoid heavy lifting',
];

const ROLE_PREF_OPTIONS = [
  'Avoid public speaking',
  'Avoid large crowds',
  'Love greeting people',
  'Prefer behind-the-scenes',
  'Happy to help with setup/teardown',
];

export default function VolunteerSignup() {
  const [step, setStep] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    headline: '',
    availability: [],
    mobility_prefs: [],
    role_prefs: [],
    pref_notes: '',
    comms_preference: 'email',
  });

  function update(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function toggleArray(field, value) {
    setForm((prev) => {
      const arr = prev[field];
      return {
        ...prev,
        [field]: arr.includes(value) ? arr.filter((v) => v !== value) : [...arr, value],
      };
    });
  }

  function canAdvance() {
    if (step === 0) return form.name.trim() && form.email.trim();
    if (step === 1) return form.availability.length > 0;
    return true;
  }

  function handleSubmit(e) {
    e.preventDefault();
    // TODO: POST /bsw/api/volunteers with form data
    setSubmitted(true);
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-gray-light">
        <Nav variant="volunteer" />
        <div className="max-w-md mx-auto px-4 py-16 text-center">
          <div className="w-16 h-16 bg-teal-light rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckIcon className="w-8 h-8 text-teal" />
          </div>
          <h1 className="font-accent text-3xl font-bold text-charcoal mb-3">You're in.</h1>
          <p className="text-gray-text text-base leading-relaxed">
            You're officially on the BSW 2026 volunteer team. We'll send your confirmation to{' '}
            <strong>{form.email}</strong>.
          </p>

          <p className="mt-6 text-sm font-medium text-charcoal">What do you want to do next?</p>

          <div className="flex flex-col sm:flex-row gap-3 mt-4">
            <a href="/bsw/volunteer/my-availability" className="btn-secondary flex-1 text-center py-3">
              Set my availability
            </a>
            <a href="/bsw/volunteer" className="btn-primary flex-1 text-center py-3">
              Browse open shifts
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-light">
      <Nav variant="volunteer" />

      <div className="max-w-lg mx-auto px-4 py-8">
        {/* Step indicator */}
        <div className="flex items-center gap-0 mb-8">
          {STEPS.map((label, i) => (
            <div key={i} className="flex items-center flex-1 last:flex-none">
              <div className="flex flex-col items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-colors ${
                    i <= step ? 'bg-teal text-white' : 'bg-gray-border text-gray-mid'
                  }`}
                >
                  {i < step ? <CheckIcon className="w-4 h-4" /> : i + 1}
                </div>
                <span
                  className={`mt-1 text-xs font-medium ${
                    i === step ? 'text-teal' : 'text-gray-mid'
                  }`}
                >
                  {label}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <div
                  className={`flex-1 h-0.5 mx-2 mb-4 ${i < step ? 'bg-teal' : 'bg-gray-border'}`}
                />
              )}
            </div>
          ))}
        </div>

        <form onSubmit={step === STEPS.length - 1 ? handleSubmit : (e) => e.preventDefault()}>
          <div className="card">
            {/* Step 0 — Your Info */}
            {step === 0 && (
              <div className="flex flex-col gap-4">
                <h2 className="font-accent text-2xl font-semibold text-charcoal">Your Info</h2>
                <p className="text-gray-text text-sm">No login needed — just your name and email.</p>

                <div>
                  <label className="block text-sm font-medium text-charcoal mb-1.5">Name *</label>
                  <input
                    className="input"
                    placeholder="Full name"
                    value={form.name}
                    onChange={(e) => update('name', e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-charcoal mb-1.5">Email *</label>
                  <input
                    className="input"
                    type="email"
                    placeholder="you@example.com"
                    value={form.email}
                    onChange={(e) => update('email', e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-charcoal mb-1.5">Phone</label>
                  <input
                    className="input"
                    type="tel"
                    placeholder="(720) 555-0100"
                    value={form.phone}
                    onChange={(e) => update('phone', e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-charcoal mb-1.5">
                    One-line headline{' '}
                    <span className="text-gray-mid font-normal">(optional)</span>
                  </label>
                  <input
                    className="input"
                    placeholder="Founder, Community Builder, Dog Walker..."
                    value={form.headline}
                    onChange={(e) => update('headline', e.target.value)}
                  />
                </div>
              </div>
            )}

            {/* Step 1 — Availability & Preferences */}
            {step === 1 && (
              <div className="flex flex-col gap-6">
                <div>
                  <h2 className="font-accent text-2xl font-semibold text-charcoal mb-1">
                    Availability & Preferences
                  </h2>
                  <p className="text-gray-text text-sm">
                    Tell us when you're free and anything that'll help us place you well.
                  </p>
                </div>

                {/* Days */}
                <div>
                  <h3 className="font-semibold text-charcoal mb-1">What days can you volunteer? *</h3>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {DAYS.map((d) => (
                      <button
                        key={d.date}
                        type="button"
                        onClick={() => toggleArray('availability', d.date)}
                        className={`px-4 py-1.5 rounded-pill text-sm font-medium border transition-colors ${
                          form.availability.includes(d.date)
                            ? 'bg-teal text-white border-teal'
                            : 'bg-white text-gray-text border-gray-border hover:border-teal hover:text-teal'
                        }`}
                      >
                        {d.full}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Shift preferences */}
                <div className="flex flex-col gap-5 pt-2 border-t border-gray-border">
                  <p className="text-xs font-semibold text-gray-text uppercase tracking-wide pt-2">Shift Preferences</p>

                  {/* Physical & mobility */}
                  <div>
                    <h3 className="font-semibold text-charcoal mb-0.5">Physical & mobility</h3>
                    <p className="text-sm text-gray-text mb-3">Any mobility considerations we should plan for?</p>
                    <div className="flex flex-wrap gap-2">
                      {MOBILITY_OPTIONS.map((opt) => (
                        <button
                          key={opt}
                          type="button"
                          onClick={() => toggleArray('mobility_prefs', opt)}
                          className={`px-3 py-1.5 rounded-pill text-sm font-medium border transition-colors ${
                            form.mobility_prefs.includes(opt)
                              ? 'bg-teal text-white border-teal'
                              : 'bg-white text-gray-text border-gray-border hover:border-teal hover:text-teal'
                          }`}
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Role preferences */}
                  <div>
                    <h3 className="font-semibold text-charcoal mb-0.5">Role preferences</h3>
                    <p className="text-sm text-gray-text mb-3">Any tasks you'd prefer to avoid or lean into?</p>
                    <div className="flex flex-wrap gap-2">
                      {ROLE_PREF_OPTIONS.map((opt) => (
                        <button
                          key={opt}
                          type="button"
                          onClick={() => toggleArray('role_prefs', opt)}
                          className={`px-3 py-1.5 rounded-pill text-sm font-medium border transition-colors ${
                            form.role_prefs.includes(opt)
                              ? 'bg-teal text-white border-teal'
                              : 'bg-white text-gray-text border-gray-border hover:border-teal hover:text-teal'
                          }`}
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Anything else */}
                  <div>
                    <h3 className="font-semibold text-charcoal mb-0.5">Anything else?</h3>
                    <p className="text-sm text-gray-text mb-3">Tell us anything we missed that would help you have a good experience.</p>
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
                <h2 className="font-accent text-2xl font-semibold text-charcoal">
                  How should we reach you?
                </h2>
                <p className="text-gray-text text-sm">
                  You'll get a confirmation when you sign up for a shift, and reminders 24 hours
                  and 1 hour before.
                </p>

                {[
                  { value: 'email', label: 'Email', desc: 'Sent to the address you provided' },
                  { value: 'sms', label: 'SMS', desc: 'Text message to your phone' },
                ].map(({ value, label, desc }) => (
                  <label
                    key={value}
                    className={`flex items-start gap-4 p-4 rounded-md border-2 cursor-pointer transition-colors ${
                      form.comms_preference === value
                        ? 'border-teal bg-teal-light'
                        : 'border-gray-border'
                    }`}
                  >
                    <input
                      type="radio"
                      name="comms_preference"
                      value={value}
                      checked={form.comms_preference === value}
                      onChange={() => update('comms_preference', value)}
                      className="mt-0.5 accent-teal"
                    />
                    <div>
                      <p className="font-medium text-charcoal">{label}</p>
                      <p className="text-sm text-gray-text">{desc}</p>
                    </div>
                  </label>
                ))}

                {/* Summary */}
                <div className="mt-2 p-4 bg-gray-light rounded-md text-sm text-gray-text space-y-1">
                  <p>
                    <span className="font-medium text-charcoal">Name:</span> {form.name}
                  </p>
                  <p>
                    <span className="font-medium text-charcoal">Email:</span> {form.email}
                  </p>
                  <p>
                    <span className="font-medium text-charcoal">Available:</span>{' '}
                    {form.availability.length} day{form.availability.length !== 1 ? 's' : ''}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Navigation */}
          <div className="flex justify-between mt-6">
            {step > 0 ? (
              <button type="button" onClick={() => setStep((s) => s - 1)} className="btn-ghost">
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
                className="btn-primary disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Continue
              </button>
            ) : (
              <button type="submit" className="btn-primary">
                Join the team
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}

function CheckIcon({ className }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth="2.5"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  );
}
