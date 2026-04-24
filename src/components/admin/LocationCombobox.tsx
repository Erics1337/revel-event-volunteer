'use client'

import { useMemo, useState } from 'react'
import * as Popover from '@radix-ui/react-popover'
import { Command } from 'cmdk'
import type { VenueRecord } from '@/lib/shifts/types'

export interface LocationComboboxProps {
  address: string
  currentLocation: string
  onCreateVenue: (values: { name: string; address: string }) => Promise<VenueRecord | undefined>
  onMessage: (message: string | null) => void
  onSelectLocation: (values: { location: string; address: string }) => void
  onUpdateVenue: (
    id: string,
    values: { name: string; address: string }
  ) => Promise<VenueRecord | undefined>
  venues: VenueRecord[]
  /** Optional class name applied to the trigger button */
  className?: string
  /** Optional label shown on the right side of the trigger */
  actionLabel?: string | null
}

const inputClassName =
  'w-full rounded-md border border-gray-border bg-white px-2 py-2 text-sm text-charcoal outline-none transition focus:border-teal focus:ring-2 focus:ring-teal/20 disabled:bg-gray-100 disabled:text-gray-500'

export function LocationCombobox({
  address,
  currentLocation,
  onCreateVenue,
  onMessage,
  onSelectLocation,
  onUpdateVenue,
  venues,
  className,
  actionLabel = 'Edit',
}: LocationComboboxProps) {
  const [open, setOpen] = useState(false)
  const [mode, setMode] = useState<'browse' | 'add' | 'edit'>('browse')
  const [search, setSearch] = useState('')
  const [saving, setSaving] = useState(false)
  const [formName, setFormName] = useState(currentLocation)
  const [formAddress, setFormAddress] = useState(address)

  const currentVenue = useMemo(
    () => venues.find((venue) => venue.name === currentLocation) ?? null,
    [currentLocation, venues]
  )

  const availableVenues = useMemo(() => {
    const seen = new Set<string>()
    return [...venues]
      .sort((left, right) => left.name.localeCompare(right.name))
      .filter((venue) => {
        if (seen.has(venue.name)) return false
        seen.add(venue.name)
        return true
      })
  }, [venues])

  const filteredVenues = useMemo(
    () =>
      availableVenues.filter((venue) => {
        const needle = search.trim().toLowerCase()
        if (!needle) return true
        return [venue.name, venue.address].some((value) => value.toLowerCase().includes(needle))
      }),
    [availableVenues, search]
  )

  const handleSaveVenue = async () => {
    if (!formName.trim() || !formAddress.trim()) {
      onMessage('Location name and address are both required.')
      return
    }

    setSaving(true)
    onMessage(null)

    try {
      const values = { name: formName.trim(), address: formAddress.trim() }
      const result =
        mode === 'edit' && currentVenue
          ? await onUpdateVenue(currentVenue.id, values)
          : await onCreateVenue(values)

      if (!result) return

      onSelectLocation({ location: result.name, address: result.address })
      onMessage(mode === 'edit' ? `Updated location ${result.name}.` : `Added location ${result.name}.`)
      setOpen(false)
    } catch (error) {
      onMessage(error instanceof Error ? error.message : 'Failed to update location')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Popover.Root
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen)

        if (!nextOpen) {
          setMode('browse')
          setSearch('')
          setFormName(currentLocation)
          setFormAddress(address)
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
          <span className="truncate">{currentLocation}</span>
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
                Location Picker
              </div>
              <Command.Input
                value={search}
                onValueChange={setSearch}
                placeholder="Search locations or addresses…"
                className={`${inputClassName} mb-2`}
              />
              <Command.List className="max-h-64 overflow-y-auto rounded-lg border border-gray-border p-1">
                <Command.Empty className="px-3 py-4 text-sm text-gray-text">
                  No matching locations.
                </Command.Empty>
                {filteredVenues.map((venue) => (
                  <Command.Item
                    key={venue.id}
                    value={`${venue.name} ${venue.address}`}
                    onSelect={() => {
                      onSelectLocation({ location: venue.name, address: venue.address })
                      onMessage(null)
                      setOpen(false)
                    }}
                    className="cursor-pointer rounded-md px-3 py-2 data-[selected=true]:bg-teal-50"
                  >
                    <div className="min-w-0">
                      <div className="truncate font-medium text-charcoal">{venue.name}</div>
                      <div className="truncate text-xs text-gray-text">{venue.address}</div>
                    </div>
                  </Command.Item>
                ))}
              </Command.List>
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setMode('add')
                    setFormName(search.trim() || currentLocation)
                    setFormAddress(address)
                  }}
                  className="rounded-full border border-teal/30 bg-teal-50 px-3 py-1 text-xs font-medium text-teal"
                >
                  + Add location
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMode('edit')
                    setFormName(currentVenue?.name ?? currentLocation)
                    setFormAddress(currentVenue?.address ?? address)
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
                  {mode === 'edit' ? 'Edit Location' : 'Add Location'}
                </div>
                <p className="mt-1 text-sm text-gray-text">
                  Save a venue and immediately use it.
                </p>
              </div>
              <input
                type="text"
                value={formName}
                onChange={(event) => setFormName(event.target.value)}
                className={inputClassName}
                placeholder="Location name"
              />
              <textarea
                value={formAddress}
                onChange={(event) => setFormAddress(event.target.value)}
                className={`${inputClassName} min-h-[96px] resize-y`}
                placeholder="Street address"
              />
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => void handleSaveVenue()}
                  disabled={saving}
                  className="rounded-full bg-teal px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
                >
                  {saving ? 'Saving…' : mode === 'edit' ? 'Save location' : 'Add location'}
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
