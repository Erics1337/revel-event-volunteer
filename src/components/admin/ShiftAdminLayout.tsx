'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/contexts/auth-context'
import { isAdmin } from '@/lib/auth/roles'

interface ShiftAdminLayoutProps {
  children: React.ReactNode
}

const NAV_ITEMS = [
  { href: '/admin/shifts', label: 'Spreadsheet' },
  { href: '/admin/shifts/calendar', label: 'Calendar' },
]

export function ShiftAdminLayout({ children }: ShiftAdminLayoutProps) {
  const pathname = usePathname()
  const { user, profile, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-light flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-teal-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!user || !profile || !isAdmin(profile.role)) {
    return (
      <div className="min-h-screen bg-gray-light flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-text text-lg mb-4">Admin access required</p>
          <Link href="/" className="text-teal hover:underline">
            Go to Homepage
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-light">
      <header className="bg-white border-b border-gray-border">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-teal-500 rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-sm">R</span>
            </div>
            <h1 className="text-xl font-bold text-charcoal">Revel Events Admin</h1>
          </div>
          <nav className="flex items-center gap-6 flex-wrap">
            <Link href="/" className="text-gray-text hover:text-teal transition-colors">
              Home
            </Link>
            <Link href="/admin" className="text-gray-text hover:text-teal transition-colors">
              Dashboard
            </Link>
            <Link href="/admin/users" className="text-gray-text hover:text-teal transition-colors">
              Users
            </Link>
            <Link
              href="/admin/volunteers"
              className="text-gray-text hover:text-teal transition-colors"
            >
              Volunteers
            </Link>
            <Link href="/admin/shifts" className="text-teal font-medium">
              Shifts
            </Link>
            <Link href="/profile" className="text-gray-text hover:text-teal transition-colors">
              Profile
            </Link>
          </nav>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-charcoal mb-1">Volunteer Shifts</h1>
            <p className="text-gray-text">
              Manage the shift schedule as a spreadsheet or use the calendar planner for drag
              and drop scheduling.
            </p>
          </div>

          <div className="inline-flex rounded-md border border-gray-border bg-white p-1 shadow-sm">
            {NAV_ITEMS.map((item) => {
              const active = pathname === item.href
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                    active ? 'bg-teal-500 text-white' : 'text-gray-text hover:text-teal'
                  }`}
                >
                  {item.label}
                </Link>
              )
            })}
          </div>
        </div>

        {children}
      </main>
    </div>
  )
}
