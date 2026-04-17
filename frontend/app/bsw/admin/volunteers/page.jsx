'use client';

import { useState } from 'react';
import Nav from '../../../../components/Nav';
import { SHIFTS, VOLUNTEERS, ADMIN_STATS, DAYS } from '../../../../lib/mockData';

export default function AdminVolunteers() {
  const [activeTab, setActiveTab] = useState('coverage');
  const [shiftFilters, setShiftFilters] = useState({ days: [], locations: [], roles: [] });
  const [search, setSearch] = useState('');
  const [messageModal, setMessageModal] = useState(null); // null | 'all' | shiftId | dayDate
  const [messageDraft, setMessageDraft] = useState({ subject: '', message: '' });
  const [messageSent, setMessageSent] = useState(false);
  const [reminderModal, setReminderModal] = useState(false);
  const [reminderSent, setReminderSent] = useState(false);
  const [reminderFilters, setReminderFilters] = useState({ days: [], locations: [], roles: [] });
  const [manageShift, setManageShift] = useState(null);
  // Track assignments locally: { [shiftId]: Set of volunteer ids }
  const [assignments, setAssignments] = useState(() => {
    const nameToId = Object.fromEntries(VOLUNTEERS.map((v) => [v.name, v.id]));
    return Object.fromEntries(
      SHIFTS.map((s) => [
        s.id,
        new Set((s.signed_up_names ?? []).map((name) => nameToId[name]).filter(Boolean)),
      ])
    );
  });

  function getAssigned(shift) {
    return VOLUNTEERS.filter((v) => assignments[shift.id]?.has(v.id));
  }

  function getEligible(shift) {
    return VOLUNTEERS.filter(
      (v) => v.availability.includes(shift.day) && !assignments[shift.id]?.has(v.id)
    );
  }

  function assignVolunteer(shiftId, volunteerId) {
    setAssignments((prev) => {
      const next = new Set(prev[shiftId]);
      next.add(volunteerId);
      return { ...prev, [shiftId]: next };
    });
  }

  function removeVolunteer(shiftId, volunteerId) {
    setAssignments((prev) => {
      const next = new Set(prev[shiftId]);
      next.delete(volunteerId);
      return { ...prev, [shiftId]: next };
    });
  }

  const filteredVolunteers = VOLUNTEERS.filter(
    (v) =>
      v.name.toLowerCase().includes(search.toLowerCase()) ||
      v.email.toLowerCase().includes(search.toLowerCase()) ||
      v.phone.includes(search)
  );

  const openShifts = SHIFTS.filter((s) => s.filled_slots < s.total_slots);
  const fillRate = ADMIN_STATS.fill_rate;

  function openMessageModal(target) {
    setMessageModal(target);
    setMessageDraft({ subject: '', message: '' });
    setMessageSent(false);
  }

  function handleSendMessage(e) {
    e.preventDefault();
    // TODO: POST /bsw/api/admin/message or /bsw/api/admin/message/:sessionId
    setMessageSent(true);
    setTimeout(() => {
      setMessageModal(null);
      setMessageSent(false);
    }, 1500);
  }

  function handleSendReminders() {
    // TODO: POST /bsw/api/admin/volunteers/reminders
    setReminderSent(true);
    setTimeout(() => {
      setReminderModal(false);
      setReminderSent(false);
    }, 1500);
  }

  function messageModalTitle() {
    if (messageModal === 'all') return 'Message all volunteers';
    const dayMatch = DAYS.find((d) => d.date === messageModal);
    if (dayMatch) return `Message volunteers on ${dayMatch.full}`;
    return 'Message shift registrants';
  }

  function messageModalSub() {
    if (messageModal === 'all') return 'This goes to every confirmed volunteer.';
    const dayMatch = DAYS.find((d) => d.date === messageModal);
    if (dayMatch) return `This goes to every volunteer scheduled on ${dayMatch.full}.`;
    return 'This goes to everyone signed up for this shift.';
  }

  return (
    <div className="min-h-screen bg-gray-light">
      <Nav variant="admin" />

      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-start justify-between mb-6 flex-wrap gap-4">
          <div>
            <h1 className="font-accent text-3xl font-bold text-charcoal">Volunteer Dashboard</h1>
            <p className="text-gray-text text-sm mt-1">BSW 2026 · May 4–8</p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => setReminderModal(true)}
              className="btn-secondary text-sm py-2 px-4 flex items-center gap-2"
            >
              <BellIcon className="w-4 h-4" />
              Send day-before reminders
            </button>
            <button
              onClick={() => openMessageModal('all')}
              className="btn-secondary text-sm py-2 px-4 flex items-center gap-2"
            >
              <MailIcon className="w-4 h-4" />
              Message all
            </button>
            <button
              onClick={() => {
                // TODO: trigger CSV export
                alert('CSV export coming soon!');
              }}
              className="btn-secondary text-sm py-2 px-4 flex items-center gap-2"
            >
              <DownloadIcon className="w-4 h-4" />
              Export CSV
            </button>
          </div>
        </div>

        {/* Fill rate stat */}
        <div className="card mb-6 flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="flex-1">
            <p className="text-sm text-gray-text mb-1">Overall shift fill rate</p>
            <div className="flex items-center gap-3">
              <p
                className={`text-4xl font-bold font-accent ${
                  fillRate >= 80
                    ? 'text-success'
                    : fillRate >= 60
                    ? 'text-orange'
                    : 'text-error'
                }`}
              >
                {fillRate}%
              </p>
              <div className="flex-1 bg-gray-border rounded-full h-2">
                <div
                  className={`h-2 rounded-full ${
                    fillRate >= 80 ? 'bg-success' : fillRate >= 60 ? 'bg-orange' : 'bg-error'
                  }`}
                  style={{ width: `${fillRate}%` }}
                />
              </div>
            </div>
          </div>
          <div className="flex gap-6 text-sm">
            <div className="text-center">
              <p className="text-2xl font-bold font-accent text-charcoal">
                {ADMIN_STATS.total_volunteers}
              </p>
              <p className="text-gray-text">Volunteers</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold font-accent text-teal">
                {ADMIN_STATS.confirmed_volunteers}
              </p>
              <p className="text-gray-text">Confirmed</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold font-accent text-orange">
                {ADMIN_STATS.pending_volunteers}
              </p>
              <p className="text-gray-text">Pending</p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 border-b border-gray-border mb-6">
          {[
            { id: 'coverage', label: 'Coverage Gaps' },
            { id: 'volunteers', label: `Volunteers (${ADMIN_STATS.total_volunteers})` },
            { id: 'shifts', label: 'All Shifts' },
          ].map(({ id, label }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`px-5 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${
                activeTab === id
                  ? 'border-teal text-teal'
                  : 'border-transparent text-gray-text hover:text-teal'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Coverage Gaps tab */}
        {activeTab === 'coverage' && (
          <div>
            {/* Per-day recruitment buttons */}
            <div className="flex gap-2 flex-wrap mb-5">
              {DAYS.map((d) => {
                const dayShifts = SHIFTS.filter((s) => s.day === d.date);
                const dayOpen = dayShifts.reduce(
                  (acc, s) => acc + Math.max(0, s.total_slots - s.filled_slots),
                  0
                );
                return (
                  <button
                    key={d.date}
                    onClick={() => openMessageModal(d.date)}
                    className={`text-xs px-3 py-1.5 rounded-pill border font-medium transition-colors flex items-center gap-1.5 ${
                      dayOpen > 0
                        ? 'border-orange text-orange bg-orange-light hover:bg-orange hover:text-white'
                        : 'border-gray-border text-gray-mid cursor-default'
                    }`}
                    disabled={dayOpen === 0}
                  >
                    {d.label}
                    {dayOpen > 0 ? (
                      <span className="font-bold">{dayOpen} open</span>
                    ) : (
                      <span>covered</span>
                    )}
                  </button>
                );
              })}
            </div>

            {openShifts.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-success text-lg font-semibold">All shifts covered.</p>
                <p className="text-gray-text text-sm mt-1">Nice work.</p>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                <p className="text-sm text-gray-text mb-1">
                  {openShifts.length} shift{openShifts.length !== 1 ? 's' : ''} still need
                  volunteers
                </p>
                {openShifts.map((shift) => {
                  const open = shift.total_slots - shift.filled_slots;
                  const pct = Math.round((shift.filled_slots / shift.total_slots) * 100);
                  const day = DAYS.find((d) => d.date === shift.day);
                  return (
                    <div
                      key={shift.id}
                      className="card flex flex-col sm:flex-row sm:items-center gap-4"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className="badge-featured text-xs">{shift.role}</span>
                          <span className="text-xs text-gray-text">{day?.full}</span>
                        </div>
                        <p className="text-sm text-charcoal font-medium">{shift.location}</p>
                        <p className="text-xs text-gray-text">
                          {shift.start_time} – {shift.end_time}
                        </p>
                        <div className="mt-2 flex items-center gap-2">
                          <div className="flex-1 bg-gray-border rounded-full h-1.5">
                            <div
                              className="h-1.5 rounded-full bg-teal"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                          <span className="text-xs text-orange font-semibold">
                            {open} spot{open !== 1 ? 's' : ''} open
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={() => setManageShift(shift)}
                        className="btn-secondary text-sm py-2 px-4 flex-shrink-0"
                      >
                        Manage
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Volunteers tab — tabular view */}
        {activeTab === 'volunteers' && (
          <div>
            <div className="relative mb-4">
              <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-mid" />
              <input
                className="input pl-10"
                placeholder="Search by name, email, or phone…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <div className="overflow-x-auto rounded-md border border-gray-border bg-white">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-border bg-gray-light">
                    <th className="text-left px-4 py-3 font-semibold text-charcoal">Name</th>
                    <th className="text-left px-4 py-3 font-semibold text-charcoal">Email</th>
                    <th className="text-left px-4 py-3 font-semibold text-charcoal hidden sm:table-cell">Phone</th>
                    <th className="text-left px-4 py-3 font-semibold text-charcoal hidden md:table-cell">Availability</th>
                    <th className="text-left px-4 py-3 font-semibold text-charcoal">Shifts</th>
                    <th className="text-left px-4 py-3 font-semibold text-charcoal">Status</th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody>
                  {filteredVolunteers.map((v, i) => (
                    <tr
                      key={v.id}
                      className={`border-b border-gray-border last:border-0 hover:bg-gray-light transition-colors ${
                        i % 2 === 0 ? '' : 'bg-gray-light/50'
                      }`}
                    >
                      <td className="px-4 py-3 font-medium text-charcoal whitespace-nowrap">
                        {v.name}
                      </td>
                      <td className="px-4 py-3 text-gray-text">{v.email}</td>
                      <td className="px-4 py-3 text-gray-text hidden sm:table-cell whitespace-nowrap">
                        {v.phone}
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        <div className="flex gap-1 flex-wrap">
                          {DAYS.filter((d) => v.availability.includes(d.date)).map((d) => (
                            <span
                              key={d.date}
                              className="text-xs px-2 py-0.5 bg-teal-light text-teal rounded-pill font-medium"
                            >
                              {d.label}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-charcoal">
                        {v.shift_count}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`text-xs px-2 py-0.5 rounded-pill font-medium ${
                            v.status === 'confirmed'
                              ? 'bg-teal-light text-teal'
                              : 'bg-orange-light text-orange'
                          }`}
                        >
                          {v.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => openMessageModal(v.id)}
                          className="text-xs text-teal hover:underline"
                        >
                          Message
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {filteredVolunteers.length === 0 && (
                <p className="text-center text-gray-text py-10 text-sm">
                  No volunteers match that search.
                </p>
              )}
            </div>
          </div>
        )}

        {/* All shifts tab */}
        {activeTab === 'shifts' && (() => {
          const allShiftRoles = [...new Set(SHIFTS.map((s) => s.role))].sort((a, b) => a.localeCompare(b));
          const allShiftLocations = [...new Set(SHIFTS.map((s) => s.location))];

          function toggleShiftFilter(key, value) {
            setShiftFilters((f) => {
              const current = f[key];
              return {
                ...f,
                [key]: current.includes(value) ? current.filter((v) => v !== value) : [...current, value],
              };
            });
          }

          const filteredShifts = SHIFTS.filter((s) => {
            if (shiftFilters.days.length > 0 && !shiftFilters.days.includes(s.day)) return false;
            if (shiftFilters.roles.length > 0 && !shiftFilters.roles.includes(s.role)) return false;
            if (shiftFilters.locations.length > 0 && !shiftFilters.locations.includes(s.location)) return false;
            return true;
          });

          const hasFilters = shiftFilters.days.length > 0 || shiftFilters.roles.length > 0 || shiftFilters.locations.length > 0;

          return (
            <div className="flex flex-col gap-4">
              {/* Filters */}
              <div className="bg-white border border-gray-border rounded-md p-4 flex flex-col gap-4">
                {[
                  { key: 'days', label: 'Day', options: DAYS.map((d) => ({ value: d.date, label: d.label })) },
                  { key: 'locations', label: 'Location', options: allShiftLocations.map((l) => ({ value: l, label: l.split('—').pop().trim() })) },
                  { key: 'roles', label: 'Role', options: allShiftRoles.map((r) => ({ value: r, label: r })) },
                ].map(({ key, label, options }) => (
                  <div key={key} className="flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-gray-text uppercase tracking-wide">{label}</span>
                      {shiftFilters[key].length > 0 && (
                        <button
                          onClick={() => setShiftFilters((f) => ({ ...f, [key]: [] }))}
                          className="text-xs text-gray-text hover:text-teal underline underline-offset-2"
                        >
                          Clear
                        </button>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {options.map(({ value, label: optLabel }) => {
                        const active = shiftFilters[key].includes(value);
                        return (
                          <button
                            key={value}
                            onClick={() => toggleShiftFilter(key, value)}
                            className={`text-sm px-3 py-1.5 rounded-pill border font-medium transition-colors ${
                              active
                                ? 'bg-teal text-white border-teal'
                                : 'border-gray-border text-gray-text hover:border-teal hover:text-teal'
                            }`}
                          >
                            {optLabel}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>

              {/* Results count + clear */}
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-text">
                  {filteredShifts.length} shift{filteredShifts.length !== 1 ? 's' : ''}
                </p>
                {hasFilters && (
                  <button
                    onClick={() => setShiftFilters({ days: [], locations: [], roles: [] })}
                    className="text-sm text-gray-text hover:text-teal underline underline-offset-2"
                  >
                    Clear all filters
                  </button>
                )}
              </div>

              {/* Shift list */}
              <div className="flex flex-col gap-3">
                {filteredShifts.map((shift) => {
                  const open = shift.total_slots - shift.filled_slots;
                  const pct = Math.round((shift.filled_slots / shift.total_slots) * 100);
                  const day = DAYS.find((d) => d.date === shift.day);
                  return (
                    <div key={shift.id} className="card flex flex-col sm:flex-row sm:items-center gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span className="badge-default text-xs">{shift.role}</span>
                          <span className="text-xs text-gray-text">
                            {day?.full} · {shift.start_time}–{shift.end_time}
                          </span>
                        </div>
                        <p className="text-sm text-charcoal">{shift.location}</p>
                        <div className="mt-2 flex items-center gap-2">
                          <div className="w-28 bg-gray-border rounded-full h-1.5">
                            <div
                              className={`h-1.5 rounded-full ${pct === 100 ? 'bg-success' : 'bg-teal'}`}
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                          <span className="text-xs text-gray-text">
                            {shift.filled_slots}/{shift.total_slots} filled
                            {open > 0 && <span className="text-orange font-medium"> · {open} open</span>}
                          </span>
                        </div>
                      </div>
                      {pct === 100 && (
                        <span className="text-xs text-success font-semibold flex-shrink-0">Full</span>
                      )}
                    </div>
                  );
                })}
                {filteredShifts.length === 0 && (
                  <p className="text-center text-gray-text py-10 text-sm">No shifts match those filters.</p>
                )}
              </div>
            </div>
          );
        })()}
      </div>

      {/* Manage shift modal */}
      {manageShift && (
        <div
          className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50"
          onClick={(e) => { if (e.target === e.currentTarget) setManageShift(null); }}
        >
          <div className="bg-white rounded-md w-full max-w-lg shadow-card max-h-[90vh] overflow-y-auto">
            <div className="p-6 flex flex-col gap-5">

              {/* Header */}
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="font-accent text-xl font-semibold text-charcoal">{manageShift.role}</h3>
                  <p className="text-sm text-gray-text mt-0.5">Assign volunteers to this shift</p>
                </div>
                <button onClick={() => setManageShift(null)} aria-label="Close" className="text-gray-mid hover:text-charcoal flex-shrink-0">
                  <CloseIcon />
                </button>
              </div>

              {/* Shift details */}
              <div className="grid grid-cols-2 gap-3 bg-gray-light rounded-sm p-4 text-sm">
                <div>
                  <span className="text-gray-text">Time: </span>
                  <span className="font-medium text-charcoal">{manageShift.start_time} – {manageShift.end_time}</span>
                </div>
                <div>
                  <span className="text-gray-text">Location: </span>
                  <span className="font-medium text-charcoal">{manageShift.location.split('—').pop().trim()}</span>
                </div>
                <div>
                  <span className="text-gray-text">Required: </span>
                  <span className="font-medium text-charcoal">{manageShift.total_slots} volunteers</span>
                </div>
                <div>
                  <span className="text-gray-text">Assigned: </span>
                  <span className="font-medium text-charcoal">{getAssigned(manageShift).length} volunteers</span>
                </div>
              </div>

              {/* Currently Assigned */}
              <div>
                <h4 className="font-accent font-semibold text-charcoal mb-3">
                  Currently Assigned ({getAssigned(manageShift).length})
                </h4>
                {getAssigned(manageShift).length === 0 ? (
                  <p className="text-sm text-gray-text italic">No volunteers assigned yet.</p>
                ) : (
                  <div className="flex flex-col gap-2">
                    {getAssigned(manageShift).map((v) => (
                      <div key={v.id} className="flex items-center justify-between gap-3 p-3 rounded-sm border border-success/30 bg-green-50">
                        <div>
                          <p className="font-medium text-charcoal text-sm">{v.name}</p>
                          <p className="text-xs text-gray-text">{v.email}</p>
                        </div>
                        <button
                          onClick={() => removeVolunteer(manageShift.id, v.id)}
                          className="text-sm font-medium text-white bg-error px-4 py-1.5 rounded-sm hover:bg-red-700 transition-colors flex-shrink-0"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Eligible Volunteers */}
              <div>
                <h4 className="font-accent font-semibold text-charcoal mb-3">
                  Eligible Volunteers ({getEligible(manageShift).length})
                </h4>
                {getEligible(manageShift).length === 0 ? (
                  <p className="text-sm text-gray-text italic">No eligible volunteers available for this day.</p>
                ) : (
                  <div className="flex flex-col gap-2">
                    {getEligible(manageShift).map((v) => (
                      <div key={v.id} className="flex items-center justify-between gap-3 p-3 rounded-sm border border-gray-border">
                        <div>
                          <p className="font-medium text-charcoal text-sm">{v.name}</p>
                          <p className="text-xs text-gray-text">{v.email}</p>
                        </div>
                        <button
                          onClick={() => assignVolunteer(manageShift.id, v.id)}
                          className="text-sm font-medium text-white bg-charcoal px-4 py-1.5 rounded-sm hover:bg-black transition-colors flex-shrink-0"
                        >
                          Assign
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Done */}
              <div className="flex justify-end pt-2">
                <button
                  onClick={() => setManageShift(null)}
                  className="text-sm font-medium text-white bg-charcoal px-8 py-2.5 rounded-sm hover:bg-black transition-colors"
                >
                  Done
                </button>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* Day-before reminders modal */}
      {reminderModal && (() => {
        const allRoles = [...new Set(SHIFTS.map((s) => s.role))].sort((a, b) => a.localeCompare(b));
        const allLocations = [...new Set(SHIFTS.map((s) => s.location))];

        function toggleFilter(key, value) {
          setReminderFilters((f) => {
            const current = f[key];
            return {
              ...f,
              [key]: current.includes(value) ? current.filter((v) => v !== value) : [...current, value],
            };
          });
        }

        const matchingShifts = SHIFTS.filter((s) => {
          if (reminderFilters.days.length > 0 && !reminderFilters.days.includes(s.day)) return false;
          if (reminderFilters.roles.length > 0 && !reminderFilters.roles.includes(s.role)) return false;
          if (reminderFilters.locations.length > 0 && !reminderFilters.locations.includes(s.location)) return false;
          return true;
        });

        const assignedIds = new Set(matchingShifts.flatMap((s) => [...(assignments[s.id] ?? [])]));
        const recipientCount = assignedIds.size;

        return (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-md p-6 max-w-lg w-full shadow-card max-h-[90vh] overflow-y-auto">
              {reminderSent ? (
                <div className="text-center py-4">
                  <div className="w-12 h-12 bg-teal-light rounded-full flex items-center justify-center mx-auto mb-3">
                    <CheckIcon className="w-6 h-6 text-teal" />
                  </div>
                  <p className="font-semibold text-charcoal">Reminders queued.</p>
                  <p className="text-sm text-gray-text mt-1">
                    Volunteers will be notified via their preferred channel.
                  </p>
                </div>
              ) : (
                <div className="flex flex-col gap-5">
                  <div>
                    <h3 className="font-accent text-xl font-semibold text-charcoal mb-1">
                      Send day-before reminders
                    </h3>
                    <p className="text-sm text-gray-text">
                      Filter recipients by day, location, and/or role. Select multiple. Leave all unselected to message every confirmed volunteer.
                    </p>
                  </div>

                  {/* Day filter */}
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-semibold text-gray-text uppercase tracking-wide">Day</label>
                      {reminderFilters.days.length > 0 && (
                        <button onClick={() => setReminderFilters((f) => ({ ...f, days: [] }))} className="text-xs text-gray-text hover:text-teal underline underline-offset-2">Clear</button>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {DAYS.map((d) => {
                        const active = reminderFilters.days.includes(d.date);
                        return (
                          <button
                            key={d.date}
                            onClick={() => toggleFilter('days', d.date)}
                            className={`text-sm px-3 py-1.5 rounded-pill border font-medium transition-colors ${
                              active ? 'bg-teal text-white border-teal' : 'border-gray-border text-gray-text hover:border-teal hover:text-teal'
                            }`}
                          >
                            {d.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Location filter */}
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-semibold text-gray-text uppercase tracking-wide">Location</label>
                      {reminderFilters.locations.length > 0 && (
                        <button onClick={() => setReminderFilters((f) => ({ ...f, locations: [] }))} className="text-xs text-gray-text hover:text-teal underline underline-offset-2">Clear</button>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {allLocations.map((loc) => {
                        const active = reminderFilters.locations.includes(loc);
                        const shortName = loc.split('—').pop().trim();
                        return (
                          <button
                            key={loc}
                            onClick={() => toggleFilter('locations', loc)}
                            className={`text-sm px-3 py-1.5 rounded-pill border font-medium transition-colors ${
                              active ? 'bg-teal text-white border-teal' : 'border-gray-border text-gray-text hover:border-teal hover:text-teal'
                            }`}
                          >
                            {shortName}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Role filter */}
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-semibold text-gray-text uppercase tracking-wide">Role</label>
                      {reminderFilters.roles.length > 0 && (
                        <button onClick={() => setReminderFilters((f) => ({ ...f, roles: [] }))} className="text-xs text-gray-text hover:text-teal underline underline-offset-2">Clear</button>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {allRoles.map((role) => {
                        const active = reminderFilters.roles.includes(role);
                        return (
                          <button
                            key={role}
                            onClick={() => toggleFilter('roles', role)}
                            className={`text-sm px-3 py-1.5 rounded-pill border font-medium transition-colors ${
                              active ? 'bg-teal text-white border-teal' : 'border-gray-border text-gray-text hover:border-teal hover:text-teal'
                            }`}
                          >
                            {role}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Summary */}
                  <div className="bg-gray-light rounded-sm p-3 text-sm text-gray-text">
                    <p>
                      <span className="font-medium text-charcoal">Matching shifts:</span>{' '}
                      {matchingShifts.length}
                    </p>
                    <p className="mt-1">
                      <span className="font-medium text-charcoal">Estimated recipients:</span>{' '}
                      {recipientCount} volunteer{recipientCount !== 1 ? 's' : ''}
                    </p>
                    <p className="mt-1">
                      <span className="font-medium text-charcoal">Message:</span> Personalized reminder with shift name, time, and location.
                    </p>
                  </div>

                  <div className="flex gap-3">
                    <button onClick={handleSendReminders} className="btn-primary flex-1">
                      Send reminders
                    </button>
                    <button
                      onClick={() => {
                        setReminderModal(false);
                        setReminderFilters({ days: [], locations: [], roles: [] });
                      }}
                      className="btn-secondary flex-1"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        );
      })()}

      {/* Message modal */}
      {messageModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-md p-6 max-w-md w-full shadow-card">
            {messageSent ? (
              <div className="text-center py-4">
                <div className="w-12 h-12 bg-teal-light rounded-full flex items-center justify-center mx-auto mb-3">
                  <CheckIcon className="w-6 h-6 text-teal" />
                </div>
                <p className="font-semibold text-charcoal">Message queued.</p>
              </div>
            ) : (
              <form onSubmit={handleSendMessage} className="flex flex-col gap-4">
                <div>
                  <h3 className="font-accent text-xl font-semibold text-charcoal mb-1">
                    {messageModalTitle()}
                  </h3>
                  <p className="text-sm text-gray-text">{messageModalSub()}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-charcoal mb-1.5">Subject</label>
                  <input
                    className="input"
                    placeholder="Quick update on your shift"
                    value={messageDraft.subject}
                    onChange={(e) =>
                      setMessageDraft((d) => ({ ...d, subject: e.target.value }))
                    }
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-charcoal mb-1.5">Message</label>
                  <textarea
                    className="input min-h-[100px] resize-y"
                    placeholder="Hey team — just a quick note…"
                    value={messageDraft.message}
                    onChange={(e) =>
                      setMessageDraft((d) => ({ ...d, message: e.target.value }))
                    }
                    required
                  />
                </div>

                <div className="flex gap-3">
                  <button type="submit" className="btn-primary flex-1">
                    Send
                  </button>
                  <button
                    type="button"
                    onClick={() => setMessageModal(null)}
                    className="btn-secondary flex-1"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}
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

function MailIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
  );
}

function BellIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6 6 0 10-12 0v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
    </svg>
  );
}

function DownloadIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
    </svg>
  );
}

function SearchIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
      <circle cx="11" cy="11" r="8" />
      <path strokeLinecap="round" d="M21 21l-4.35-4.35" />
    </svg>
  );
}

function CheckIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  );
}
