'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/contexts/auth-context'

const NAV_ITEMS = [
  { href: '/', label: 'Home' },
  { href: '/admin', label: 'Dashboard' },
  { href: '/admin/users', label: 'Users' },
  { href: '/admin/volunteers', label: 'Volunteers' },
  { href: '/admin/shifts', label: 'Shifts' },
  { href: '/profile', label: 'Profile' },
] as const

function isActiveLink(pathname: string, href: string) {
  if (href === '/admin/shifts') {
    return pathname.startsWith('/admin/shifts')
  }

  return pathname === href
}

export function AdminHeader() {
  const pathname = usePathname()
  const { signOut } = useAuth()

  const handleSignOut = async () => {
    await signOut()
    window.location.href = '/'
  }

  return (
    <header className="bg-white border-b border-gray-border">
      <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-teal-500 rounded-full flex items-center justify-center">
            <span className="text-white font-bold text-sm">R</span>
          </div>
          <h1 className="text-xl font-bold text-charcoal">Revel Events Admin</h1>
        </div>

        <nav className="flex items-center gap-4 flex-wrap text-sm">
          {NAV_ITEMS.map((item) => {
            const active = isActiveLink(pathname, item.href)

            return (
              <Link
                key={item.href}
                href={item.href}
                className={
                  active
                    ? 'font-medium text-teal'
                    : 'text-gray-text hover:text-teal transition-colors'
                }
              >
                {item.label}
              </Link>
            )
          })}
          <button
            type="button"
            onClick={handleSignOut}
            className="cursor-pointer text-gray-text hover:text-teal transition-colors"
          >
            Sign Out
          </button>
        </nav>
      </div>
    </header>
  )
}
