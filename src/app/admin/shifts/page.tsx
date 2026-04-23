'use client'

import { ShiftSpreadsheet } from '@/components/admin/ShiftSpreadsheet'
import { useShiftAdminData } from '@/components/admin/useShiftAdminData'

export default function AdminShiftsSpreadsheetPage() {
  const { shifts, loading, error, saveSpreadsheet, importCsv } = useShiftAdminData()

  if (loading) {
    return (
      <div className="card flex items-center justify-center py-16">
        <div className="w-8 h-8 border-4 border-teal-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {error ? (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <ShiftSpreadsheet
        key={JSON.stringify(shifts)}
        shifts={shifts}
        onSave={saveSpreadsheet}
        onImportCsv={importCsv}
      />
    </div>
  )
}
