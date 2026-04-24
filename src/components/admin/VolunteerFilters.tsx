'use client'

import { useState } from 'react'

interface VolunteerFiltersProps {
  dayFilters: string[]
  locationFilters: string[]
  roleFilters: string[]
  availableDays: Array<{ date: string; label: string }>
  availableLocations: string[]
  availableRoles: string[]
  onToggleDayFilter: (day: string) => void
  onToggleLocationFilter: (location: string) => void
  onToggleRoleFilter: (role: string) => void
  onClearDayFilters: () => void
  onClearLocationFilters: () => void
  onClearRoleFilters: () => void
  onClearAllFilters: () => void
}

export function VolunteerFilters({
  dayFilters,
  locationFilters,
  roleFilters,
  availableDays,
  availableLocations,
  availableRoles,
  onToggleDayFilter,
  onToggleLocationFilter,
  onToggleRoleFilter,
  onClearDayFilters,
  onClearLocationFilters,
  onClearRoleFilters,
  onClearAllFilters,
}: VolunteerFiltersProps) {
  const [open, setOpen] = useState(false)

  const activeCount = dayFilters.length + locationFilters.length + roleFilters.length
  const hasFilters = activeCount > 0

  return (
    <div className="bg-white border border-gray-border rounded-md overflow-hidden">
      {/* Header row — always visible */}
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-light/60 transition-colors"
      >
        <div className="flex items-center gap-2">
          <svg className="w-4 h-4 text-gray-mid" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-.293.707L13 13.414V19a1 1 0 01-.553.894l-4 2A1 1 0 017 21v-7.586L3.293 6.707A1 1 0 013 6V4z" />
          </svg>
          <span className="text-sm font-medium text-charcoal">Filter shifts</span>
          {hasFilters && (
            <span className="ml-1 inline-flex items-center justify-center w-5 h-5 rounded-full bg-teal-500 text-white text-xs font-semibold">
              {activeCount}
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          {hasFilters && (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onClearAllFilters() }}
              className="text-xs text-gray-text hover:text-teal underline underline-offset-2 transition-colors"
            >
              Clear all
            </button>
          )}
          <svg
            className={`w-4 h-4 text-gray-mid transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
            fill="none" stroke="currentColor" viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

      {/* Active filter summary chips — shown when collapsed but filters are active */}
      {!open && hasFilters && (
        <div className="px-4 pb-3 flex flex-wrap gap-1.5">
          {dayFilters.map((d) => {
            const day = availableDays.find((ad) => ad.date === d)
            return (
              <span key={d} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-teal-500 text-white text-xs font-medium">
                {day?.label.split(',')[0] ?? d}
                <button type="button" onClick={() => onToggleDayFilter(d)} className="hover:opacity-70">×</button>
              </span>
            )
          })}
          {locationFilters.map((l) => (
            <span key={l} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-teal-500 text-white text-xs font-medium">
              {l.split('—').pop()?.trim() ?? l}
              <button type="button" onClick={() => onToggleLocationFilter(l)} className="hover:opacity-70">×</button>
            </span>
          ))}
          {roleFilters.map((r) => (
            <span key={r} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-teal-500 text-white text-xs font-medium">
              {r}
              <button type="button" onClick={() => onToggleRoleFilter(r)} className="hover:opacity-70">×</button>
            </span>
          ))}
        </div>
      )}

      {/* Expanded filter panel */}
      {open && (
        <div className="border-t border-gray-border px-4 py-4 flex flex-col gap-4">
          {/* Day Filters */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-gray-text uppercase tracking-wide">Day</span>
              {dayFilters.length > 0 && (
                <button
                  onClick={onClearDayFilters}
                  className="text-xs text-gray-text hover:text-teal underline underline-offset-2"
                >
                  Clear
                </button>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              {availableDays.map((day) => {
                const active = dayFilters.includes(day.date)
                return (
                  <button
                    key={day.date}
                    onClick={() => onToggleDayFilter(day.date)}
                    className={`text-sm px-3 py-1.5 rounded-pill border font-medium transition-colors ${
                      active
                        ? 'bg-teal-500 text-white border-teal-500'
                        : 'border-gray-border text-gray-text hover:border-teal-500 hover:text-teal'
                    }`}
                  >
                    {day.label.split(',')[0]}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Location Filters */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-gray-text uppercase tracking-wide">Location</span>
              {locationFilters.length > 0 && (
                <button
                  onClick={onClearLocationFilters}
                  className="text-xs text-gray-text hover:text-teal underline underline-offset-2"
                >
                  Clear
                </button>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              {availableLocations.map((location) => {
                const active = locationFilters.includes(location)
                const shortName = location.split('—').pop()?.trim() || location
                return (
                  <button
                    key={location}
                    onClick={() => onToggleLocationFilter(location)}
                    className={`text-sm px-3 py-1.5 rounded-pill border font-medium transition-colors ${
                      active
                        ? 'bg-teal-500 text-white border-teal-500'
                        : 'border-gray-border text-gray-text hover:border-teal-500 hover:text-teal'
                    }`}
                  >
                    {shortName}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Role Filters */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-gray-text uppercase tracking-wide">Role</span>
              {roleFilters.length > 0 && (
                <button
                  onClick={onClearRoleFilters}
                  className="text-xs text-gray-text hover:text-teal underline underline-offset-2"
                >
                  Clear
                </button>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              {availableRoles.map((role) => {
                const active = roleFilters.includes(role)
                return (
                  <button
                    key={role}
                    onClick={() => onToggleRoleFilter(role)}
                    className={`text-sm px-3 py-1.5 rounded-pill border font-medium transition-colors ${
                      active
                        ? 'bg-teal-500 text-white border-teal-500'
                        : 'border-gray-border text-gray-text hover:border-teal-500 hover:text-teal'
                    }`}
                  >
                    {role}
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
