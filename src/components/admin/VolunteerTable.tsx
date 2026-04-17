'use client'

import { MailIcon } from '@/components/icons/MailIcon'

interface Volunteer {
  id: string
  name: string
  email: string
  phone: string
  availability: string[]
  shift_count: number
  status: 'confirmed' | 'pending'
}

interface VolunteerTableProps {
  volunteers: Volunteer[]
  availableDays: Array<{ date: string; label: string }>
  onMessageVolunteer: (volunteerId: string) => void
}

export function VolunteerTable({ volunteers, availableDays, onMessageVolunteer }: VolunteerTableProps) {
  return (
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
          {volunteers.map((volunteer, i) => (
            <tr
              key={volunteer.id}
              className={`border-b border-gray-border last:border-0 hover:bg-gray-light transition-colors ${
                i % 2 === 0 ? '' : 'bg-gray-light/50'
              }`}
            >
              <td className="px-4 py-3 font-medium text-charcoal whitespace-nowrap">
                {volunteer.name}
              </td>
              <td className="px-4 py-3 text-gray-text">{volunteer.email}</td>
              <td className="px-4 py-3 text-gray-text hidden sm:table-cell whitespace-nowrap">
                {volunteer.phone}
              </td>
              <td className="px-4 py-3 hidden md:table-cell">
                <div className="flex gap-1 flex-wrap">
                  {availableDays
                    .filter((d) => volunteer.availability.includes(d.date))
                    .map((day) => (
                      <span
                        key={day.date}
                        className="text-xs px-2 py-0.5 bg-teal-light text-teal rounded-pill font-medium"
                      >
                        {day.label}
                      </span>
                    ))}
                </div>
              </td>
              <td className="px-4 py-3 text-charcoal">
                {volunteer.shift_count}
              </td>
              <td className="px-4 py-3">
                <span
                  className={`text-xs px-2 py-0.5 rounded-pill font-medium ${
                    volunteer.status === 'confirmed'
                      ? 'bg-teal-light text-teal'
                      : 'bg-orange-light text-orange'
                  }`}
                >
                  {volunteer.status}
                </span>
              </td>
              <td className="px-4 py-3 text-right">
                <button
                  onClick={() => onMessageVolunteer(volunteer.id)}
                  className="text-xs text-teal hover:underline flex items-center gap-1"
                >
                  <MailIcon className="w-3 h-3" />
                  Message
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {volunteers.length === 0 && (
        <p className="text-center text-gray-text py-10 text-sm">
          No volunteers found.
        </p>
      )}
    </div>
  )
}
