'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const volunteerLinks = [
  { href: '/bsw/volunteer', label: 'Open Shifts' },
  { href: '/bsw/volunteer/my-shifts', label: 'My Schedule' },
  { href: '/bsw/volunteer/my-availability', label: 'My Availability' },
  { href: '/bsw/volunteer/profile', label: 'My Profile' },
];

const adminLinks = [
  { href: '/bsw/admin/volunteers', label: 'Volunteers' },
];

export default function Nav({ variant = 'volunteer' }) {
  const pathname = usePathname();
  const links = variant === 'admin' ? adminLinks : volunteerLinks;

  return (
    <nav className="bg-white border-b border-gray-border sticky top-0 z-10">
      <div className="max-w-5xl mx-auto px-4 flex items-center justify-between h-14 gap-4">
        {/* Logo */}
        <Link href="/bsw/volunteer" className="font-accent font-bold text-teal text-lg tracking-tight flex-shrink-0">
          BSW <span className="text-charcoal">2026</span>
        </Link>

        {/* Nav links — scrollable on small screens */}
        <div className="flex items-center gap-0.5 overflow-x-auto scrollbar-hide flex-1 justify-end">
          {links.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className={`flex-shrink-0 px-3 py-1.5 rounded-sm text-sm font-medium transition-colors whitespace-nowrap ${
                pathname === href
                  ? 'bg-teal-light text-teal'
                  : 'text-gray-text hover:text-teal hover:bg-gray-light'
              }`}
            >
              {label}
            </Link>
          ))}

          {variant === 'admin' && (
            <span className="ml-2 badge-featured text-xs flex-shrink-0">Admin</span>
          )}
        </div>
      </div>
    </nav>
  );
}
