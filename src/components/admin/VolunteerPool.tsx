'use client'

import { useEffect, useRef, useState } from 'react'
import { Draggable } from '@fullcalendar/interaction'
import type { AvailableVolunteer } from '@/lib/shifts/types'
import { EVENT_DAYS } from '@/lib/shifts/types'

interface VolunteerPoolProps {
  volunteers: AvailableVolunteer[]
}

export function VolunteerPool({ volunteers }: VolunteerPoolProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [search, setSearch] = useState('')
  const [dayFilter, setDayFilter] = useState<string>('all')

  useEffect(() => {
    if (!containerRef.current) return
    const draggable = new Draggable(containerRef.current, {
      itemSelector: '.volunteer-card',
      eventData(eventEl) {
        return {
          title: eventEl.getAttribute('data-name') || 'Volunteer',
          extendedProps: {
            volunteerId: eventEl.getAttribute('data-volunteer-id'),
            volunteerName: eventEl.getAttribute('data-name'),
            isVolunteerDrop: true,
          },
        }
      },
    })
    return () => draggable.destroy()
  }, [volunteers])

  const filtered = volunteers.filter((v) => {
    const matchesSearch =
      v.name.toLowerCase().includes(search.toLowerCase()) ||
      v.email.toLowerCase().includes(search.toLowerCase())
    const matchesDay = dayFilter === 'all' || v.availability.includes(dayFilter)
    return matchesSearch && matchesDay
  })

  return (
    <div className="card sticky top-4">
      <h3 className="text-lg font-semibold text-charcoal mb-3">Volunteers</h3>
      <p className="text-xs text-gray-text mb-3">
        Drag a volunteer onto a shift to assign. Click a shift to manage its roster.
      </p>

      <input
        type="text"
        placeholder="Search name or email..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full px-3 py-2 border border-gray-border rounded-md text-sm mb-2"
      />

      <select
        value={dayFilter}
        onChange={(e) => setDayFilter(e.target.value)}
        className="w-full px-3 py-2 border border-gray-border rounded-md text-sm mb-3"
      >
        <option value="all">All availability</option>
        {EVENT_DAYS.map((d) => (
          <option key={d.date} value={d.date}>
            Available {d.label}
          </option>
        ))}
      </select>

      <div ref={containerRef} className="space-y-2 max-h-[60vh] overflow-y-auto">
        {filtered.length === 0 && (
          <p className="text-sm text-gray-text italic">No volunteers match.</p>
        )}
        {filtered.map((v) => (
          <div
            key={v.id}
            className="volunteer-card cursor-grab active:cursor-grabbing border border-gray-border rounded-md px-3 py-2 bg-white hover:bg-teal-50 hover:border-teal-500 transition"
            data-volunteer-id={v.id}
            data-name={v.name}
          >
            <div className="flex items-center justify-between">
              <div className="min-w-0">
                <p className="font-medium text-charcoal text-sm truncate">{v.name}</p>
                <p className="text-xs text-gray-text truncate">{v.email}</p>
              </div>
              <span
                className={`text-xs px-2 py-0.5 rounded-full ${
                  v.status === 'confirmed'
                    ? 'bg-teal-100 text-teal-700'
                    : 'bg-gray-100 text-gray-text'
                }`}
              >
                {v.shift_count} shift{v.shift_count === 1 ? '' : 's'}
              </span>
            </div>
            {v.availability.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-1">
                {v.availability.map((d) => {
                  const day = EVENT_DAYS.find((e) => e.date === d)
                  return (
                    <span
                      key={d}
                      className="text-[10px] px-1.5 py-0.5 bg-gray-100 text-gray-text rounded"
                    >
                      {day?.label.split(',')[0] ?? d}
                    </span>
                  )
                })}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
