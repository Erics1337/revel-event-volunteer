'use client';

import { useState } from 'react';
import Nav from '../../../components/Nav';
import ShiftCard from '../../../components/ShiftCard';
import { SHIFTS, DAYS, MY_AVAILABILITY } from '../../../lib/mockData';

// Mock: replace with real auth check once auth is wired up
const IS_LOGGED_IN = false;

export default function VolunteerPortal() {
  const [selectedDay, setSelectedDay] = useState('all');
  const [selectedRole, setSelectedRole] = useState('all');
  const [selectedLocation, setSelectedLocation] = useState('all');
  const [onlyMyAvailability, setOnlyMyAvailability] = useState(true);
  const [signedUp, setSignedUp] = useState(new Set());
  const [showRecruitModal, setShowRecruitModal] = useState(!IS_LOGGED_IN);

  const roles = ['all', ...new Set(SHIFTS.map((s) => s.role))].sort((a, b) =>
    a === 'all' ? -1 : b === 'all' ? 1 : a.localeCompare(b)
  );

  const usedLocations = ['all', ...new Set(SHIFTS.map((s) => s.location))];

  const filtered = SHIFTS.filter((s) => {
    if (onlyMyAvailability && !MY_AVAILABILITY.includes(s.day)) return false;
    if (selectedDay !== 'all' && s.day !== selectedDay) return false;
    if (selectedRole !== 'all' && s.role !== selectedRole) return false;
    if (selectedLocation !== 'all' && s.location !== selectedLocation) return false;
    return true;
  });

  function handleSignUp(shiftId, action) {
    setSignedUp((prev) => {
      const next = new Set(prev);
      if (action === 'cancel') {
        next.delete(shiftId);
      } else {
        next.add(shiftId);
      }
      return next;
    });
  }

  const openCount = SHIFTS.filter((s) => s.filled_slots < s.total_slots).length;

  const availabilityDayLabels = MY_AVAILABILITY.map(
    (d) => DAYS.find((day) => day.date === d)?.label
  ).filter(Boolean);

  return (
    <div className="min-h-screen bg-gray-light">
      <Nav variant="volunteer" />

      {/* Hero */}
      <div
        className="px-4 py-12 text-center"
        style={{ background: 'linear-gradient(135deg, #2B8A8F 0%, #F5A623 60%, #F58220 100%)' }}
      >
        <h1
          className="font-accent text-4xl font-bold text-white"
          style={{ textShadow: '0 2px 8px rgba(0,0,0,0.2)' }}
        >
          Volunteer at Boulder Startup Week 2026
        </h1>
        <p className="mt-3 text-white/90 text-lg max-w-md mx-auto">
          {openCount} shifts need you. No sign-up fees. No corporate BS. Just real community work.
        </p>
        {!IS_LOGGED_IN && (
          <button
            onClick={() => setShowRecruitModal(true)}
            className="inline-block mt-6 btn-primary"
          >
            Become a Volunteer
          </button>
        )}
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6">

        {/* Availability filter banner */}
        <div className="flex items-center justify-between bg-teal-light border border-teal/20 rounded-sm px-4 py-3 mb-5 gap-3 flex-wrap">
          <p className="text-sm text-teal">
            {onlyMyAvailability ? (
              <>
                Showing shifts on your available days:{' '}
                <span className="font-semibold">{availabilityDayLabels.join(', ')}</span>
              </>
            ) : (
              'Showing all shifts'
            )}
          </p>
          <div className="flex gap-3 text-sm flex-shrink-0">
            <button
              onClick={() => setOnlyMyAvailability((v) => !v)}
              className="text-teal font-medium underline underline-offset-2 hover:text-teal-dark"
            >
              {onlyMyAvailability ? 'Show all shifts' : 'Filter to my availability'}
            </button>
            <a
              href="/bsw/volunteer/my-availability"
              className="text-gray-text hover:text-teal"
            >
              Edit availability →
            </a>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white border border-gray-border rounded-md p-4 flex flex-col sm:flex-row gap-3">
          <div className="flex flex-col gap-1 flex-1">
            <label className="text-xs font-semibold text-gray-text uppercase tracking-wide">Day</label>
            <select
              value={selectedDay}
              onChange={(e) => setSelectedDay(e.target.value)}
              className="input py-2 text-sm"
            >
              <option value="all">All Days</option>
              {DAYS.map((d) => (
                <option key={d.date} value={d.date}>{d.full}</option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1 flex-1">
            <label className="text-xs font-semibold text-gray-text uppercase tracking-wide">Role</label>
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              className="input py-2 text-sm"
            >
              <option value="all">All Roles</option>
              {roles.filter((r) => r !== 'all').map((role) => (
                <option key={role} value={role}>{role}</option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1 flex-1">
            <label className="text-xs font-semibold text-gray-text uppercase tracking-wide">Location</label>
            <select
              value={selectedLocation}
              onChange={(e) => setSelectedLocation(e.target.value)}
              className="input py-2 text-sm"
            >
              <option value="all">All Locations</option>
              {usedLocations.filter((l) => l !== 'all').map((loc) => (
                <option key={loc} value={loc}>{loc}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Results count + clear */}
        <div className="flex items-center justify-between mt-5 mb-3">
          <p className="text-sm text-gray-text">
            {filtered.length} shift{filtered.length !== 1 ? 's' : ''}
            {selectedDay !== 'all' && ` · ${DAYS.find((d) => d.date === selectedDay)?.full}`}
            {selectedRole !== 'all' && ` · ${selectedRole}`}
            {selectedLocation !== 'all' && ` · ${selectedLocation}`}
          </p>
          {(selectedDay !== 'all' || selectedRole !== 'all' || selectedLocation !== 'all') && (
            <button
              onClick={() => {
                setSelectedDay('all');
                setSelectedRole('all');
                setSelectedLocation('all');
              }}
              className="text-sm text-gray-text hover:text-teal underline underline-offset-2"
            >
              Clear filters
            </button>
          )}
        </div>

        {/* Volunteer Need — shifts with zero sign-ups */}
        {(() => {
          const urgent = filtered.filter((s) => s.filled_slots === 0);
          if (urgent.length === 0) return null;
          return (
            <div className="mb-8">
              <div className="flex items-center gap-3 mb-3">
                <h2 className="font-accent text-lg font-semibold text-error">Priority Shifts</h2>
              </div>
              <div
                className="rounded-md border-2 border-error/30 bg-red-50 p-4"
              >
                <p className="text-xs text-error/80 mb-3 font-medium">
                  These shifts have zero volunteers. They need you most.
                </p>
                <div className="grid gap-3 sm:grid-cols-2">
                  {urgent.map((shift) => (
                    <div key={shift.id}>
                      <ShiftCard
                        shift={shift}
                        isSignedUp={signedUp.has(shift.id)}
                        onSignUp={handleSignUp}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          );
        })()}

        {/* Shift grid */}
        {filtered.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2">
            {filtered.map((shift) => (
              <ShiftCard
                key={shift.id}
                shift={shift}
                isSignedUp={signedUp.has(shift.id)}
                onSignUp={handleSignUp}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <p className="text-gray-text text-lg">No shifts match those filters.</p>
            <div className="flex flex-col items-center gap-2 mt-2">
              <button
                onClick={() => {
                  setSelectedDay('all');
                  setSelectedRole('all');
                  setSelectedLocation('all');
                }}
                className="btn-ghost"
              >
                Clear filters
              </button>
              {onlyMyAvailability && (
                <button
                  onClick={() => setOnlyMyAvailability(false)}
                  className="text-sm text-gray-text hover:text-teal underline underline-offset-2"
                >
                  Show shifts outside my availability
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Volunteer recruitment modal — shown to non-logged-in visitors */}
      {showRecruitModal && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
          onClick={(e) => { if (e.target === e.currentTarget) setShowRecruitModal(false); }}
        >
          <div className="bg-white rounded-md w-full max-w-md shadow-card">
            {/* Gradient header */}
            <div
              className="rounded-t-md px-6 pt-8 pb-6 text-center relative"
              style={{ background: 'linear-gradient(135deg, #2B8A8F 0%, #F5A623 60%, #F58220 100%)' }}
            >
              <button
                onClick={() => setShowRecruitModal(false)}
                aria-label="Close"
                className="absolute top-3 right-3 w-8 h-8 flex items-center justify-center rounded-full bg-white/20 text-white hover:bg-white/30 transition-colors"
              >
                <CloseIcon />
              </button>
              <h2
                className="font-accent text-2xl font-bold text-white"
                style={{ textShadow: '0 2px 8px rgba(0,0,0,0.2)' }}
              >
                Make Boulder Startup Week happen.
              </h2>
              <p className="mt-2 text-white/90 text-sm">
                Volunteers are the backbone of Boulder Startup Week. 50+ people give thousands of hours to make this week real. Be one of them.
              </p>
            </div>

            {/* Body */}
            <div className="px-6 py-6 flex flex-col gap-4">
              <div className="flex flex-col gap-2 text-sm text-gray-text">
                <p className="font-semibold text-charcoal">Why Volunteer?</p>
                {[
                  'Network with Boulder\'s top entrepreneurs and innovators',
                  'Gain behind-the-scenes event management experience',
                  'Access to exclusive volunteer appreciation events',
                  'Flexible scheduling — choose shifts that work for you',
                  'Give back to the Boulder startup community',
                ].map((item) => (
                  <div key={item} className="flex items-start gap-3">
                    <span className="text-teal font-bold mt-0.5">✓</span>
                    <span>{item}</span>
                  </div>
                ))}
              </div>

              <a
                href="/bsw/volunteer/signup"
                className="btn-primary text-center w-full"
                onClick={() => setShowRecruitModal(false)}
              >
                Become a Volunteer
              </a>

              <button
                onClick={() => setShowRecruitModal(false)}
                className="text-sm text-gray-text hover:text-teal text-center transition-colors"
              >
                Just browsing shifts for now
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function CloseIcon() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}
