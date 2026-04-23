import { ShiftAdminLayout } from '@/components/admin/ShiftAdminLayout'

export default function AdminShiftsLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return <ShiftAdminLayout>{children}</ShiftAdminLayout>
}
