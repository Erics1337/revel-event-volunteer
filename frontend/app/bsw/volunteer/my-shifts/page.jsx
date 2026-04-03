'use client';

import { useState } from 'react';
import Nav from '../../../../components/Nav';
import { MY_SHIFTS, DAYS } from '../../../../lib/mockData';
import { downloadIcs } from '../../../../lib/icsExport';

export default function MyShifts() {
  const [shifts, setShifts] = useState(MY_SHIFTS);
  const [cancelTarget, setCancelTarget] = useState(null);

  function groupByDay(list) {
    const groups = {};
    for (const shift of list) {
      if (!groups[shift.day]) groups[shift.day] = [];
      groups[shift.day].push(shift);
    }
    return groups;
  }

  function handleCancel(shiftId) {
    setShifts((prev) => prev.filter((s) => s.id !== shiftId));
    setCancelTarget(null);
  }

  const grouped = groupByDay(shifts);
  const dayLabel = (date) => DAYS.find((d) => d.date === date)?.full ?? date;

  return (
    <div className="min-h-screen bg-gray-light">
      <Nav variant="volunteer" />

      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
          <div>
            <h1 className="font-accent text-3xl font-bold text-charcoal">My Schedule</h1>
            <p className="text-gray-text text-sm mt-1">
              {shifts.length} shift{shifts.length !== 1 ? 's' : ''} coming up
            </p>
          </div>
          {shifts.length > 0 && (
            <button
              onClick={() => downloadIcs(shifts)}
              className="btn-secondary text-sm py-2 px-4 flex items-center gap-2"
            >
              <CalendarIcon className="w-4 h-4" />
              Export to calendar
            </button>
          )}
        </div>

        {shifts.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-gray-text text-lg">No shifts yet.</p>
            <p className="text-gray-text text-sm mt-1">
              Head over to open shifts and grab one.
            </p>
            <a href="/bsw/volunteer" className="inline-block mt-6 btn-primary">
              Browse Shifts
            </a>
          </div>
        ) : (
          <div className="flex flex-col gap-8">
            {Object.entries(grouped)
              .sort()
              .map(([date, dayShifts]) => (
                <div key={date}>
                  <h2 className="text-sm font-semibold text-teal uppercase tracking-wide mb-3">
                    {dayLabel(date)}
                  </h2>
                  <div className="flex flex-col gap-3">
                    {dayShifts.map((shift) => (
                      <div key={shift.id} className="card flex flex-col gap-2">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <span className="badge-registered text-xs mb-2 inline-block">
                              Confirmed
                            </span>
                            <p className="font-semibold text-charcoal">{shift.role}</p>
                          </div>
                          <button
                            onClick={() => setCancelTarget(shift.id)}
                            className="text-xs text-gray-mid hover:text-error transition-colors flex-shrink-0 mt-1"
                          >
                            Cancel
                          </button>
                        </div>

                        <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-charcoal">
                          <span className="flex items-center gap-1.5">
                            <ClockIcon />
                            {shift.start_time} – {shift.end_time}
                          </span>
                          <span className="flex items-center gap-1.5">
                            <PinIcon />
                            {shift.location}
                          </span>
                        </div>

                        <p className="text-sm text-gray-text leading-relaxed">
                          {shift.description}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>

      {/* Cancel confirmation modal */}
      {cancelTarget && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-md p-6 max-w-sm w-full shadow-card">
            <h3 className="font-accent text-xl font-semibold text-charcoal mb-2">
              Cancel this shift?
            </h3>
            <p className="text-gray-text text-sm mb-6">
              The spot will open back up for another volunteer. If you signed up by mistake, no
              hard feelings.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => handleCancel(cancelTarget)}
                className="btn-primary flex-1"
                style={{ background: '#D93025' }}
              >
                Yes, cancel
              </button>
              <button onClick={() => setCancelTarget(null)} className="btn-secondary flex-1">
                Keep it
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
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

function CalendarIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  );
}
