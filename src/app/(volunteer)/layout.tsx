'use client'

import { Navbar } from '@/components/Navbar'

export default function VolunteerLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <div className="min-h-screen bg-[#f6f7f5] text-[#3f4a56]">
      <Navbar variant="default" />
      {children}
    </div>
  )
}
