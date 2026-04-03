'use client';

import { useState } from 'react';
import { ROLE_INFO } from '../lib/mockData';

function fillPercent(shift) {
  return Math.round((shift.filled_slots / shift.total_slots) * 100);
}

function spotsLeft(shift) {
  return shift.total_slots - shift.filled_slots;
}

function formatNames(names) {
  if (!names || names.length === 0) return null;
  const display = names.slice(0, 3);
  const extra = names.length - display.length;
  const abbreviated = display.map((n) => {
    const parts = n.split(' ');
    return parts.length > 1 ? `${parts[0]} ${parts[1][0]}.` : parts[0];
  });
  if (extra > 0) abbreviated.push(`+${extra} more`);
  return abbreviated.join(', ');
}

export default function ShiftCard({ shift, onSignUp, isSignedUp = false }) {
  const [showRoleInfo, setShowRoleInfo] = useState(false);
  const [showModal, setShowModal] = useState(false);

  const open = spotsLeft(shift);
  const full = open === 0;
  const pct = fillPercent(shift);
  const almostFull = !full && pct >= 80;
  const roleDescription = ROLE_INFO[shift.role];
  const signedUpDisplay = formatNames(shift.signed_up_names);

  function handleSignUpClick() {
    if (full || isSignedUp) return;
    setShowModal(true);
  }

  function handleConfirm() {
    onSignUp?.(shift.id);
    setShowModal(false);
  }

  function handleCancel() {
    onSignUp?.(shift.id, 'cancel');
  }

  return (
    <>
      <div className="card flex flex-col gap-3">
        {/* Role + info tooltip */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="badge-default text-xs">{shift.role}</span>
            {roleDescription && (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowRoleInfo((v) => !v)}
                  aria-expanded={showRoleInfo}
                  aria-label={`What does ${shift.role} do?`}
                  className="w-5 h-5 rounded-full border border-gray-border bg-gray-light text-gray-text text-xs font-semibold flex items-center justify-center hover:border-teal hover:text-teal transition-colors"
                >
                  ?
                </button>
                {showRoleInfo && (
                  <div
                    className="absolute left-0 top-7 z-20 w-64 bg-white border border-gray-border rounded-md p-3 shadow-card text-xs text-gray-text leading-relaxed"
                    role="tooltip"
                  >
                    <p className="font-semibold text-charcoal mb-1">{shift.role}</p>
                    {roleDescription}
                    <button
                      type="button"
                      onClick={() => setShowRoleInfo(false)}
                      className="absolute top-2 right-2 text-gray-mid hover:text-charcoal"
                      aria-label="Close"
                    >
                      ✕
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
          {isSignedUp && (
            <span className="badge-registered text-xs flex-shrink-0">Signed up ✓</span>
          )}
        </div>

        {/* Description */}
        <p className="text-sm text-gray-text leading-relaxed line-clamp-2">
          {shift.description}
        </p>

        {/* Meta pills */}
        <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-sm text-charcoal">
          <span className="flex items-center gap-1.5">
            <ClockIcon />
            {shift.start_time} – {shift.end_time}
          </span>
          <span className="flex items-center gap-1.5">
            <PinIcon />
            {shift.location}
          </span>
        </div>

        {/* Capacity bar */}
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className={almostFull ? 'text-orange font-semibold' : full ? 'text-gray-mid' : 'text-gray-text'}>
              {full
                ? 'Shift full'
                : almostFull
                ? `${open} spot${open !== 1 ? 's' : ''} left!`
                : `${open} of ${shift.total_slots} spots open`}
            </span>
            <span className="text-gray-mid">{pct}%</span>
          </div>
          <div className="w-full bg-gray-border rounded-full h-1.5">
            <div
              className={`h-1.5 rounded-full transition-all ${
                pct === 100 ? 'bg-gray-mid' : almostFull ? 'bg-orange' : 'bg-teal'
              }`}
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>

        {/* CTA */}
        <div className="flex items-center justify-between pt-1">
          {isSignedUp ? (
            <button
              onClick={handleCancel}
              className="btn-ghost text-sm text-error hover:text-error px-0"
            >
              Cancel sign-up
            </button>
          ) : (
            <button
              onClick={handleSignUpClick}
              disabled={full}
              className={`text-sm py-2 px-5 ${full ? 'btn-secondary opacity-40 cursor-not-allowed' : 'btn-secondary'}`}
            >
              {full ? 'Full' : 'Sign up'}
            </button>
          )}
        </div>
      </div>

      {/* Detail modal */}
      {showModal && (
        <div
          className="fixed inset-0 bg-black/40 flex items-end sm:items-center justify-center p-4 z-50"
          onClick={(e) => { if (e.target === e.currentTarget) setShowModal(false); }}
        >
          <div className="bg-white rounded-md w-full max-w-md shadow-card max-h-[90vh] overflow-y-auto">
            <div className="p-6 flex flex-col gap-4">
              {/* Header */}
              <div className="flex items-start justify-between gap-3">
                <div>
                  <span className="badge-default text-xs mb-2 inline-block">{shift.role}</span>
                  <h2 className="font-accent text-xl font-semibold text-charcoal leading-snug">
                    {shift.role} — {shift.location.split('—')[0].trim()}
                  </h2>
                </div>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-gray-mid hover:text-charcoal flex-shrink-0 mt-1"
                  aria-label="Close"
                >
                  <CloseIcon />
                </button>
              </div>

              {/* Full description */}
              <p className="text-sm text-gray-text leading-relaxed">{shift.description}</p>

              {/* Role info */}
              {roleDescription && (
                <div className="bg-teal-light rounded-sm p-3 text-xs text-teal leading-relaxed">
                  <span className="font-semibold">What you'll do: </span>
                  {roleDescription}
                </div>
              )}

              {/* Meta */}
              <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-charcoal">
                <span className="flex items-center gap-1.5">
                  <ClockIcon />
                  {shift.start_time} – {shift.end_time}
                </span>
                <span className="flex items-center gap-1.5">
                  <PinIcon />
                  {shift.location}
                </span>
              </div>

              {/* Capacity */}
              <div className="flex flex-col gap-1.5">
                <div className="flex justify-between text-xs text-gray-text">
                  <span>{shift.filled_slots} of {shift.total_slots} spots filled</span>
                  <span className={almostFull ? 'text-orange font-semibold' : ''}>
                    {open > 0 ? `${open} open` : 'Full'}
                  </span>
                </div>
                <div className="w-full bg-gray-border rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${pct === 100 ? 'bg-gray-mid' : almostFull ? 'bg-orange' : 'bg-teal'}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>

              {/* Who's signed up */}
              {shift.signed_up_names && shift.signed_up_names.length > 0 && (
                <div>
                  <p className="text-xs text-gray-text">
                    <span className="font-medium text-charcoal">Also signed up: </span>
                    {signedUpDisplay}
                  </p>
                  <p className="text-xs text-gray-mid mt-0.5">
                    Volunteer names are visible to other BSW volunteers.
                  </p>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3 pt-2">
                <button
                  onClick={handleConfirm}
                  className="btn-primary flex-1 text-sm py-3"
                >
                  Confirm — I'm in
                </button>
                <button
                  onClick={() => setShowModal(false)}
                  className="btn-secondary flex-1 text-sm py-3"
                >
                  Not now
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function ClockIcon() {
  return (
    <svg className="w-4 h-4 text-teal flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <circle cx="12" cy="12" r="10" strokeWidth="2" />
      <path strokeLinecap="round" d="M12 6v6l4 2" strokeWidth="2" />
    </svg>
  );
}

function PinIcon() {
  return (
    <svg className="w-4 h-4 text-teal flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}
