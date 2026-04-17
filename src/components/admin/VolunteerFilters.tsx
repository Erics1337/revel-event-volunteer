'use client'


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
  const hasFilters = dayFilters.length > 0 || locationFilters.length > 0 || roleFilters.length > 0

  return (
    <div className="bg-white border border-gray-border rounded-md p-4 flex flex-col gap-4">
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
                {day.label}
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

      {/* Clear All */}
      {hasFilters && (
        <button
          onClick={onClearAllFilters}
          className="text-sm text-gray-text hover:text-teal underline underline-offset-2"
        >
          Clear all filters
        </button>
      )}
    </div>
  )
}
