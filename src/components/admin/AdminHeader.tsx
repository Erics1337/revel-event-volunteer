'use client'

import { Navbar } from '@/components/Navbar'

const ADMIN_NAV_ITEMS = [
  { href: '/admin', label: 'Dashboard' },
  { href: '/admin/volunteers', label: 'Volunteers' },
  { href: '/admin/shifts', label: 'Shifts' },
]

export function AdminHeader() {
  return <Navbar variant="admin" adminNavItems={ADMIN_NAV_ITEMS} />
}
