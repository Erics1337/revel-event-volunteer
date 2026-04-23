'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/contexts/auth-context'
import { isAdmin } from '@/lib/auth/roles'
import Image from 'next/image'
import bswLogo from '../../public/bsw-logo-BUCTZ2oQ.png'

const MAIN_NAV_LINKS = [
  { href: '/open-shifts', label: 'Open Shifts' },
  { href: '/schedule', label: 'My Schedule' },
  { href: '/profile', label: 'Profile' },
] as const

function isActiveLink(pathname: string, href: string) {
  if (pathname === href) return true
  // Preserve `/events` as a friendly alias for the open shifts browser.
  return href === '/open-shifts' && pathname === '/events'
}

interface NavbarProps {
  variant?: 'default' | 'admin'
  adminNavItems?: Array<{ href: string; label: string }>
  showLogoImage?: boolean
}

export function Navbar({ variant = 'default', adminNavItems, showLogoImage = false }: NavbarProps) {
  const pathname = usePathname()
  const { user, profile, loading, signOut } = useAuth()
  const signInHref = `/auth/login?redirectTo=${encodeURIComponent(pathname)}`

  const handleSignOut = async () => {
    await signOut()
    window.location.href = '/'
  }

  const isAdminUser = !loading && isAdmin(profile?.role)

  if (variant === 'admin') {
    return (
      <header className="sticky top-0 z-30 border-b border-[#e6e8eb] bg-white/95 backdrop-blur">
        <div className="mx-auto flex min-h-16 max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="flex items-center gap-2 text-lg font-bold tracking-tight text-[#6aa9ae]"
              style={{ fontFamily: 'var(--font-accent)' }}
            >
              {showLogoImage ? (
                <Image src={bswLogo} alt="Boulder Startup Week" className="h-8 w-auto" />
              ) : (
                <>
                  <span className="text-[#6aa9ae]">BSW</span>
                  <span className="text-[#4a5563]">Admin</span>
                </>
              )}
            </Link>
          </div>

        <nav className="flex flex-1 items-center justify-center gap-1 overflow-x-auto">
          {adminNavItems?.map((link) => {
              const active = pathname === link.href || pathname.startsWith(`${link.href}/`)
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium transition ${
                    active
                      ? 'bg-[#eef8f8] text-[#6aa9ae]'
                      : 'text-[#6f7883] hover:bg-[#f0f2ef] hover:text-[#5aaeb3]'
                  }`}
                >
                  {link.label}
                </Link>
              )
            })}
          </nav>

          <div className="flex items-center gap-2">
            <Link
              href="/open-shifts"
              className={`rounded-sm px-3 py-1.5 text-sm font-medium transition ${
                pathname === '/open-shifts' || pathname === '/schedule'
                  ? 'bg-[#eef8f8] text-[#6aa9ae]'
                  : 'text-[#6f7883] hover:bg-[#f0f2ef] hover:text-[#5aaeb3]'
              }`}
            >
              Volunteer Portal
            </Link>

            {!loading &&
              (user ? (
                <button
                  type="button"
                  onClick={handleSignOut}
                  className="rounded-sm bg-[#ef8f3d] px-3 py-1.5 text-sm font-semibold text-white shadow-[3px_3px_0_rgba(26,26,26,0.85)] transition hover:translate-x-[1px] hover:translate-y-[1px] hover:bg-[#e98529] hover:shadow-[2px_2px_0_rgba(26,26,26,0.85)]"
                >
                  Sign Out
                </button>
              ) : (
                <Link
                  href={signInHref}
                  className="rounded-sm bg-[#ef8f3d] px-3 py-1.5 text-sm font-semibold text-white shadow-[3px_3px_0_rgba(26,26,26,0.85)] transition hover:translate-x-[1px] hover:translate-y-[1px] hover:bg-[#e98529] hover:shadow-[2px_2px_0_rgba(26,26,26,0.85)]"
                >
                  Sign In
                </Link>
              ))}
          </div>
        </div>
      </header>
    )
  }

  // Default variant (volunteer portal style)
  return (
    <header className="sticky top-0 z-30 border-b border-[#e6e8eb] bg-white/95 backdrop-blur">
      <div className="mx-auto flex min-h-16 max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3">
        <div className="flex items-center gap-3">
          <Link
            href="/open-shifts"
            className="text-lg font-bold tracking-tight text-[#6aa9ae]"
            style={{ fontFamily: 'var(--font-accent)' }}
          >
            {showLogoImage ? (
              <Image src={bswLogo} alt="Boulder Startup Week" className="h-8 w-auto" />
            ) : (
              <>
                BSW <span className="text-[#4a5563]">Volunteer Crew</span>
              </>
            )}
          </Link>
        </div>

        <nav className="flex flex-1 items-center justify-center gap-1 overflow-x-auto">
          {MAIN_NAV_LINKS.map((link) => {
            const active = isActiveLink(pathname, link.href)
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium transition ${
                  active
                    ? 'bg-[#eef8f8] text-[#6aa9ae]'
                    : 'text-[#6f7883] hover:bg-[#f0f2ef] hover:text-[#5aaeb3]'
                }`}
              >
                {link.label}
              </Link>
            )
          })}
        </nav>

        <div className="flex items-center gap-2">
          {isAdminUser && (
            <Link
              href="/admin/volunteers"
              className="rounded-sm px-3 py-1.5 text-sm font-medium text-[#6f7883] transition hover:bg-[#f0f2ef] hover:text-[#5aaeb3]"
            >
              Admin
            </Link>
          )}

          {!loading &&
            (user ? (
              <button
                type="button"
                onClick={handleSignOut}
                className="rounded-sm bg-[#ef8f3d] px-3 py-1.5 text-sm font-semibold text-white shadow-[3px_3px_0_rgba(26,26,26,0.85)] transition hover:translate-x-[1px] hover:translate-y-[1px] hover:bg-[#e98529] hover:shadow-[2px_2px_0_rgba(26,26,26,0.85)]"
              >
                Sign Out
              </button>
            ) : (
              <Link
                href={signInHref}
                className="rounded-sm bg-[#ef8f3d] px-3 py-1.5 text-sm font-semibold text-white shadow-[3px_3px_0_rgba(26,26,26,0.85)] transition hover:translate-x-[1px] hover:translate-y-[1px] hover:bg-[#e98529] hover:shadow-[2px_2px_0_rgba(26,26,26,0.85)]"
              >
                Sign In
              </Link>
            ))}
        </div>
      </div>
    </header>
  )
}
