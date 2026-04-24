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

function shortLabel(value: string) {
  return value.split('—').pop()?.trim() || value
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
  const hasFilters =
    dayFilters.length > 0 || locationFilters.length > 0 || roleFilters.length > 0

  const handleLocationChange = (value: string) => {
    onClearLocationFilters()
    if (value) onToggleLocationFilter(value)
  }

  const handleRoleChange = (value: string) => {
    onClearRoleFilters()
    if (value) onToggleRoleFilter(value)
  }

  return (
    <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
      <div className="flex flex-wrap gap-1.5">
        {availableDays.map((day) => {
          const active = dayFilters.includes(day.date)
          const label = day.label.split(',')[0]

          return (
            <button
              key={day.date}
              type="button"
              onClick={() => onToggleDayFilter(day.date)}
              className={`rounded-sm border px-3 py-2 text-sm font-medium transition-colors ${
                active
                  ? 'border-teal-500 bg-teal-500 text-white'
                  : 'border-gray-border bg-white text-gray-text hover:border-teal-500 hover:text-teal'
              }`}
            >
              {label}
            </button>
          )
        })}
      </div>

      <div className="grid gap-2 sm:grid-cols-2 lg:min-w-[420px]">
        <select
          value={locationFilters[0] ?? ''}
          onChange={(event) => handleLocationChange(event.target.value)}
          className="h-10 rounded-sm border border-gray-border bg-white px-3 text-sm font-medium text-charcoal outline-none transition-colors focus:border-teal-500"
        >
          <option value="">All locations</option>
          {availableLocations.map((location) => (
            <option key={location} value={location}>
              {shortLabel(location)}
            </option>
          ))}
        </select>

        <select
          value={roleFilters[0] ?? ''}
          onChange={(event) => handleRoleChange(event.target.value)}
          className="h-10 rounded-sm border border-gray-border bg-white px-3 text-sm font-medium text-charcoal outline-none transition-colors focus:border-teal-500"
        >
          <option value="">All roles</option>
          {availableRoles.map((role) => (
            <option key={role} value={role}>
              {role}
            </option>
          ))}
        </select>
      </div>

      {hasFilters && (
        <button
          type="button"
          onClick={() => {
            onClearDayFilters()
            onClearAllFilters()
          }}
          className="self-start text-sm font-medium text-gray-text underline underline-offset-2 transition-colors hover:text-teal lg:self-auto"
        >
          Clear filters
        </button>
      )}
    </div>
  )
}
