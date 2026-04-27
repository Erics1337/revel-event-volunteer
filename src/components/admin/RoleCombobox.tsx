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
  const [mode, setMode] = useState<'browse' | 'add' | 'edit'>('browse')
  const [search, setSearch] = useState('')
  const [formRole, setFormRole] = useState(currentRole)

  const filteredRoles = useMemo(() => {
    const needle = search.trim().toLowerCase()
    if (!needle) return availableRoles
    return availableRoles.filter((role) => role.toLowerCase().includes(needle))
  }, [availableRoles, search])

  const handleSaveRole = () => {
    const trimmed = formRole.trim()
    if (!trimmed) return
    onSelectRole(trimmed)
    setOpen(false)
  }

  return (
    <Popover.Root
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen)
        if (!nextOpen) {
          setMode('browse')
          setSearch('')
          setFormRole(currentRole)
        }
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
          {mode === 'browse' ? (
            <Command className="w-full">
              <div className="mb-2 text-xs font-medium uppercase tracking-wide text-gray-text">
                Role Picker
              </div>
              <Command.Input
                value={search}
                onValueChange={setSearch}
                placeholder="Search roles…"
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
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setMode('add')
                    setFormRole(search.trim())
                  }}
                  className="rounded-full border border-teal/30 bg-teal-50 px-3 py-1 text-xs font-medium text-teal"
                >
                  + Add role
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMode('edit')
                    setFormRole(currentRole)
                  }}
                  className="rounded-full border border-gray-border px-3 py-1 text-xs font-medium text-charcoal"
                >
                  Edit current
                </button>
              </div>
            </Command>
          ) : (
            <div className="space-y-3">
              <div>
                <div className="text-xs font-medium uppercase tracking-wide text-gray-text">
                  {mode === 'edit' ? 'Edit Role' : 'Add Role'}
                </div>
                <p className="mt-1 text-sm text-gray-text">
                  {mode === 'edit' ? 'Rename the role for this shift.' : 'Type a new role name and apply it.'}
                </p>
              </div>
              <input
                type="text"
                value={formRole}
                onChange={(event) => setFormRole(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') handleSaveRole()
                }}
                className={inputClassName}
                placeholder="Role name"
                autoFocus
              />
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleSaveRole}
                  disabled={!formRole.trim()}
                  className="rounded-full bg-teal px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
                >
                  {mode === 'edit' ? 'Save role' : 'Add role'}
                </button>
                <button
                  type="button"
                  onClick={() => setMode('browse')}
                  className="rounded-full border border-gray-border px-4 py-2 text-sm font-medium text-charcoal"
                >
                  Back
                </button>
              </div>
            </div>
          )}
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  )
}
