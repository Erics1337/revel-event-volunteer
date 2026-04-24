'use client'

import { useMemo, useState } from 'react'
import * as Popover from '@radix-ui/react-popover'
import { Command } from 'cmdk'

export interface RoleComboboxProps {
  currentRole: string
  availableRoles: string[]
  onSelectRole: (role: string) => void
  /** Optional class name applied to the trigger button */
  className?: string
  /** Optional label shown on the right side of the trigger */
  actionLabel?: string | null
}

const inputClassName =
  'w-full rounded-md border border-gray-border bg-white px-2 py-2 text-sm text-charcoal outline-none transition focus:border-teal focus:ring-2 focus:ring-teal/20 disabled:bg-gray-100 disabled:text-gray-500'

export function RoleCombobox({
  currentRole,
  availableRoles,
  onSelectRole,
  className,
  actionLabel = 'Edit',
}: RoleComboboxProps) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')

  const filteredRoles = useMemo(() => {
    const needle = search.trim().toLowerCase()
    if (!needle) return availableRoles
    return availableRoles.filter((role) => role.toLowerCase().includes(needle))
  }, [availableRoles, search])

  const searchTrimmed = search.trim()
  const isCustom =
    searchTrimmed.length > 0 &&
    !availableRoles.some((role) => role.toLowerCase() === searchTrimmed.toLowerCase())

  return (
    <Popover.Root
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen)
        if (!nextOpen) setSearch('')
      }}
    >
      <Popover.Trigger asChild>
        <button
          type="button"
          className={
            className ??
            `${inputClassName} flex min-w-[220px] items-center justify-between gap-3 text-left`
          }
        >
          <span className="truncate">{currentRole || 'Select role…'}</span>
          {actionLabel ? (
            <span className="text-xs font-medium uppercase tracking-wide text-teal">{actionLabel}</span>
          ) : null}
        </button>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          sideOffset={8}
          align="start"
          className="z-50 w-[340px] rounded-xl border border-gray-border bg-white p-3 shadow-xl"
        >
          <Command className="w-full">
            <div className="mb-2 text-xs font-medium uppercase tracking-wide text-gray-text">
              Role Picker
            </div>
            <Command.Input
              value={search}
              onValueChange={setSearch}
              placeholder="Search or type a new role…"
              className={`${inputClassName} mb-2`}
            />
            <Command.List className="max-h-64 overflow-y-auto rounded-lg border border-gray-border p-1">
              <Command.Empty className="px-3 py-4 text-sm text-gray-text">
                No matching roles.
              </Command.Empty>
              {filteredRoles.map((role) => (
                <Command.Item
                  key={role}
                  value={role}
                  onSelect={() => {
                    onSelectRole(role)
                    setOpen(false)
                  }}
                  className="cursor-pointer rounded-md px-3 py-2 data-[selected=true]:bg-teal-50"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="truncate font-medium text-charcoal">{role}</span>
                    {role === currentRole && (
                      <span className="rounded-full bg-teal-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-teal-700">
                        Current
                      </span>
                    )}
                  </div>
                </Command.Item>
              ))}
            </Command.List>
            {isCustom && (
              <button
                type="button"
                onClick={() => {
                  onSelectRole(searchTrimmed)
                  setOpen(false)
                }}
                className="mt-2 w-full rounded-full border border-teal/30 bg-teal-50 px-3 py-2 text-left text-sm font-medium text-teal"
              >
                + Use &ldquo;{searchTrimmed}&rdquo; as new role
              </button>
            )}
          </Command>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  )
}
