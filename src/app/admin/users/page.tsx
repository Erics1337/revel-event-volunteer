'use client'

import { useDeferredValue, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useAuth } from '@/contexts/auth-context'
import { isAdmin } from '@/lib/auth/roles'
import type { Database } from '@/lib/supabase/database.types'

type AdminUser = Pick<
  Database['public']['Tables']['users']['Row'],
  | 'id'
  | 'email'
  | 'name'
  | 'avatar_url'
  | 'headline'
  | 'bio'
  | 'linkedin_url'
  | 'email_public'
  | 'role'
  | 'badges'
  | 'blocked'
  | 'created_at'
>

type UserDraft = {
  role: string
  badges: string[]
  blocked: boolean
}

type BadgeOption = 'facilitator' | 'volunteer' | 'sponsor'
type RoleFilter = 'all' | 'admin' | 'volunteer'
type BlockedFilter = 'all' | 'active' | 'blocked'

const BADGE_OPTIONS: BadgeOption[] = ['facilitator', 'volunteer', 'sponsor']

function formatJoinedDate(value: string | null) {
  if (!value) return 'Unknown'

  return new Date(value).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function buildQuery({
  search,
  role,
  blocked,
}: {
  search: string
  role: RoleFilter
  blocked: BlockedFilter
}) {
  const params = new URLSearchParams()

  if (search.trim()) {
    params.set('search', search.trim())
  }

  if (role !== 'all') {
    params.set('role', role)
  }

  if (blocked === 'active') {
    params.set('blocked', 'false')
  }

  if (blocked === 'blocked') {
    params.set('blocked', 'true')
  }

  const query = params.toString()
  return query ? `?${query}` : ''
}

export default function AdminUsersPage() {
  const { user, profile, loading: authLoading } = useAuth()
  const [users, setUsers] = useState<AdminUser[]>([])
  const [drafts, setDrafts] = useState<Record<string, UserDraft>>({})
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState<RoleFilter>('all')
  const [blockedFilter, setBlockedFilter] = useState<BlockedFilter>('all')
  const [savingUserId, setSavingUserId] = useState<string | null>(null)

  const deferredSearch = useDeferredValue(search)

  useEffect(() => {
    if (!successMessage) return

    const timeoutId = window.setTimeout(() => {
      setSuccessMessage(null)
    }, 2400)

    return () => {
      window.clearTimeout(timeoutId)
    }
  }, [successMessage])

  useEffect(() => {
    if (authLoading || !isAdmin(profile?.role)) {
      return
    }

    let cancelled = false

    async function loadUsers() {
      setErrorMessage(null)
      setRefreshing(true)

      try {
        const query = buildQuery({
          search: deferredSearch,
          role: roleFilter,
          blocked: blockedFilter,
        })
        const response = await fetch(`/api/admin/users${query}`)
        const payload = await response.json()

        if (!response.ok) {
          throw new Error(payload.error || 'Failed to load users')
        }

        if (cancelled) {
          return
        }

        const nextUsers = (payload.users || []) as AdminUser[]
        setUsers(nextUsers)
        setDrafts((current) => {
          const nextDrafts = { ...current }

          nextUsers.forEach((entry) => {
            nextDrafts[entry.id] = {
              role: current[entry.id]?.role ?? entry.role,
              badges: current[entry.id]?.badges ?? entry.badges ?? [],
              blocked: current[entry.id]?.blocked ?? Boolean(entry.blocked),
            }
          })

          Object.keys(nextDrafts).forEach((id) => {
            if (!nextUsers.some((entry) => entry.id === id)) {
              delete nextDrafts[id]
            }
          })

          return nextDrafts
        })
      } catch (error) {
        if (!cancelled) {
          setErrorMessage(error instanceof Error ? error.message : 'Failed to load users')
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
          setRefreshing(false)
        }
      }
    }

    const timeoutId = window.setTimeout(() => {
      void loadUsers()
    }, deferredSearch === search ? 0 : 180)

    return () => {
      cancelled = true
      window.clearTimeout(timeoutId)
    }
  }, [authLoading, blockedFilter, deferredSearch, profile, roleFilter, search])

  const totals = useMemo(() => {
    const admins = users.filter((entry) => entry.role === 'admin').length
    const volunteers = users.filter((entry) => entry.role === 'volunteer').length
    const blocked = users.filter((entry) => entry.blocked).length
    const withBadges = users.filter((entry) => (entry.badges || []).length > 0).length

    return {
      total: users.length,
      admins,
      volunteers,
      blocked,
      withBadges,
    }
  }, [users])

  const dirtyUserIds = useMemo(() => {
    const nextDirtyIds = new Set<string>()

    users.forEach((entry) => {
      const draft = drafts[entry.id]

      if (!draft) {
        return
      }

      const entryBadges = [...(entry.badges || [])].sort().join('|')
      const draftBadges = [...draft.badges].sort().join('|')

      if (
        draft.role !== entry.role ||
        draft.blocked !== Boolean(entry.blocked) ||
        entryBadges !== draftBadges
      ) {
        nextDirtyIds.add(entry.id)
      }
    })

    return nextDirtyIds
  }, [drafts, users])

  const updateDraft = (userId: string, updater: (current: UserDraft) => UserDraft) => {
    setDrafts((current) => {
      const existingUser = users.find((entry) => entry.id === userId)

      if (!existingUser) {
        return current
      }

      const baseDraft =
        current[userId] || {
          role: existingUser.role,
          badges: existingUser.badges ?? [],
          blocked: Boolean(existingUser.blocked),
        }

      return {
        ...current,
        [userId]: updater(baseDraft),
      }
    })
  }

  const saveUser = async (userId: string) => {
    const userDraft = drafts[userId]
    const original = users.find((entry) => entry.id === userId)

    if (!userDraft || !original) {
      return
    }

    setErrorMessage(null)
    setSuccessMessage(null)
    setSavingUserId(userId)

    try {
      const response = await fetch('/api/admin/users', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: userId,
          role: userDraft.role,
          badges: userDraft.badges,
          blocked: userDraft.blocked,
        }),
      })

      const payload = await response.json()

      if (!response.ok) {
        throw new Error(payload.error || 'Failed to update user')
      }

      const updatedUser = payload.user as AdminUser

      setUsers((current) =>
        current.map((entry) => (entry.id === userId ? updatedUser : entry))
      )
      setDrafts((current) => ({
        ...current,
        [userId]: {
          role: updatedUser.role,
          badges: updatedUser.badges ?? [],
          blocked: Boolean(updatedUser.blocked),
        },
      }))
      setSuccessMessage(`Updated ${updatedUser.name}`)
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Failed to update user')
    } finally {
      setSavingUserId(null)
    }
  }

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-light flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-teal-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!user || !profile || !isAdmin(profile.role)) {
    return (
      <div className="min-h-screen bg-gray-light flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-text text-lg mb-4">Admin access required</p>
          <Link href="/" className="text-teal hover:underline">
            Go to Homepage
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-light">
      <header className="bg-white border-b border-gray-border">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-teal-500 rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-sm">R</span>
            </div>
            <h1 className="text-xl font-bold text-charcoal">Revel Events Admin</h1>
          </div>

          <nav className="flex items-center gap-6 text-sm">
            <Link href="/" className="text-gray-text hover:text-teal transition-colors">
              Home
            </Link>
            <Link href="/admin" className="text-gray-text hover:text-teal transition-colors">
              Dashboard
            </Link>
            <Link href="/admin/users" className="text-teal font-medium">
              Users
            </Link>
            <Link
              href="/admin/volunteers"
              className="text-gray-text hover:text-teal transition-colors"
            >
              Volunteers
            </Link>
            <Link
              href="/admin/shifts"
              className="text-gray-text hover:text-teal transition-colors"
            >
              Shifts
            </Link>
            <Link
              href="/profile"
              className="text-gray-text hover:text-teal transition-colors"
            >
              Profile
            </Link>
          </nav>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <section className="mb-8 rounded-[28px] border border-teal-200 bg-[linear-gradient(135deg,#f0fdfa_0%,#ffffff_42%,#fff7ed_100%)] p-6 shadow-[0_18px_40px_rgba(20,184,166,0.08)]">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <p className="mb-2 inline-flex rounded-full border border-teal-200 bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-teal-700">
                Admin Controls
              </p>
              <h1 className="font-serif text-3xl font-bold text-charcoal sm:text-4xl">
                User directory and access control
              </h1>
              <p className="mt-3 text-gray-text">
                Search the full account list, adjust roles, manage badges, and block
                problem accounts without leaving the page.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div className="rounded-2xl border border-white bg-white/90 px-4 py-3 shadow-sm">
                <p className="text-xs uppercase tracking-[0.18em] text-gray-text">Loaded</p>
                <p className="mt-2 text-2xl font-bold text-charcoal">{totals.total}</p>
              </div>
              <div className="rounded-2xl border border-white bg-white/90 px-4 py-3 shadow-sm">
                <p className="text-xs uppercase tracking-[0.18em] text-gray-text">Admins</p>
                <p className="mt-2 text-2xl font-bold text-charcoal">{totals.admins}</p>
              </div>
              <div className="rounded-2xl border border-white bg-white/90 px-4 py-3 shadow-sm">
                <p className="text-xs uppercase tracking-[0.18em] text-gray-text">Volunteers</p>
                <p className="mt-2 text-2xl font-bold text-charcoal">{totals.volunteers}</p>
              </div>
              <div className="rounded-2xl border border-white bg-white/90 px-4 py-3 shadow-sm">
                <p className="text-xs uppercase tracking-[0.18em] text-gray-text">Blocked</p>
                <p className="mt-2 text-2xl font-bold text-charcoal">{totals.blocked}</p>
              </div>
            </div>
          </div>
        </section>

        <section className="card mb-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="grid flex-1 gap-4 md:grid-cols-[minmax(0,1.5fr)_220px_220px]">
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-charcoal">Search</span>
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search by name or email"
                  className="input"
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-medium text-charcoal">Role</span>
                <select
                  value={roleFilter}
                  onChange={(event) => setRoleFilter(event.target.value as RoleFilter)}
                  className="input"
                >
                  <option value="all">All roles</option>
                  <option value="admin">Admins</option>
                  <option value="volunteer">Volunteers</option>
                </select>
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-medium text-charcoal">Status</span>
                <select
                  value={blockedFilter}
                  onChange={(event) => setBlockedFilter(event.target.value as BlockedFilter)}
                  className="input"
                >
                  <option value="all">All accounts</option>
                  <option value="active">Active only</option>
                  <option value="blocked">Blocked only</option>
                </select>
              </label>
            </div>

            <div className="flex items-center gap-3">
              <div className="text-sm text-gray-text">
                {refreshing ? 'Refreshing…' : `${dirtyUserIds.size} unsaved change${dirtyUserIds.size === 1 ? '' : 's'}`}
              </div>
              <button
                type="button"
                onClick={() => {
                  setSearch('')
                  setRoleFilter('all')
                  setBlockedFilter('all')
                }}
                className="rounded-full border border-gray-border px-4 py-2 text-sm font-medium text-charcoal hover:border-teal-300 hover:text-teal-700"
              >
                Clear filters
              </button>
            </div>
          </div>

          {(errorMessage || successMessage) && (
            <div className="mt-4 space-y-2">
              {errorMessage && (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {errorMessage}
                </div>
              )}
              {successMessage && (
                <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                  {successMessage}
                </div>
              )}
            </div>
          )}
        </section>

        {loading ? (
          <div className="card flex items-center justify-center py-20">
            <div className="flex flex-col items-center gap-3">
              <div className="w-8 h-8 border-4 border-teal-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-gray-text">Loading users…</p>
            </div>
          </div>
        ) : users.length === 0 ? (
          <div className="card py-16 text-center">
            <h2 className="text-xl font-semibold text-charcoal">No users matched these filters</h2>
            <p className="mt-2 text-gray-text">
              Try widening the search or clearing one of the filters above.
            </p>
          </div>
        ) : (
          <>
            <section className="mb-5 grid gap-4 md:grid-cols-3">
              <div className="rounded-3xl border border-gray-border bg-white p-5 shadow-sm">
                <p className="text-sm font-medium text-gray-text">Accounts with badges</p>
                <p className="mt-2 text-3xl font-bold text-charcoal">{totals.withBadges}</p>
                <p className="mt-2 text-sm text-gray-text">
                  Quick signal for featured organizers, sponsors, and support roles.
                </p>
              </div>

              <div className="rounded-3xl border border-gray-border bg-white p-5 shadow-sm">
                <p className="text-sm font-medium text-gray-text">Edit workflow</p>
                <p className="mt-2 text-3xl font-bold text-charcoal">{dirtyUserIds.size}</p>
                <p className="mt-2 text-sm text-gray-text">
                  Row-level saves keep changes isolated and easier to verify.
                </p>
              </div>

              <div className="rounded-3xl border border-gray-border bg-white p-5 shadow-sm">
                <p className="text-sm font-medium text-gray-text">Visible accounts</p>
                <p className="mt-2 text-3xl font-bold text-charcoal">{users.length}</p>
                <p className="mt-2 text-sm text-gray-text">
                  Filters are applied server-side so the list stays responsive as it grows.
                </p>
              </div>
            </section>

            <section className="space-y-4 lg:hidden">
              {users.map((entry) => {
                const draft = drafts[entry.id] || {
                  role: entry.role,
                  badges: entry.badges ?? [],
                  blocked: Boolean(entry.blocked),
                }
                const isDirty = dirtyUserIds.has(entry.id)
                const isSaving = savingUserId === entry.id

                return (
                  <article
                    key={entry.id}
                    className="rounded-3xl border border-gray-border bg-white p-5 shadow-sm"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h2 className="text-lg font-semibold text-charcoal">{entry.name}</h2>
                        <p className="text-sm text-gray-text">{entry.email}</p>
                        <p className="mt-2 text-xs uppercase tracking-[0.18em] text-gray-mid">
                          Joined {formatJoinedDate(entry.created_at)}
                        </p>
                      </div>

                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${
                          draft.blocked
                            ? 'bg-red-100 text-red-700'
                            : 'bg-teal-100 text-teal-700'
                        }`}
                      >
                        {draft.blocked ? 'Blocked' : 'Active'}
                      </span>
                    </div>

                    {(entry.headline || entry.bio) && (
                      <div className="mt-4 rounded-2xl bg-gray-50 px-4 py-3 text-sm text-gray-text">
                        {entry.headline && <p className="font-medium text-charcoal">{entry.headline}</p>}
                        {entry.bio && <p className="mt-1 line-clamp-3">{entry.bio}</p>}
                      </div>
                    )}

                    <div className="mt-4 grid gap-4">
                      <label className="block">
                        <span className="mb-2 block text-sm font-medium text-charcoal">Role</span>
                        <select
                          value={draft.role}
                          onChange={(event) =>
                            updateDraft(entry.id, (current) => ({
                              ...current,
                              role: event.target.value,
                            }))
                          }
                          className="input"
                        >
                          <option value="volunteer">Volunteer</option>
                          <option value="admin">Admin</option>
                        </select>
                      </label>

                      <div>
                        <span className="mb-2 block text-sm font-medium text-charcoal">Badges</span>
                        <div className="flex flex-wrap gap-2">
                          {BADGE_OPTIONS.map((badge) => {
                            const selected = draft.badges.includes(badge)

                            return (
                              <button
                                key={badge}
                                type="button"
                                onClick={() =>
                                  updateDraft(entry.id, (current) => ({
                                    ...current,
                                    badges: selected
                                      ? current.badges.filter((value) => value !== badge)
                                      : [...current.badges, badge],
                                  }))
                                }
                                className={`rounded-full border px-3 py-2 text-sm font-medium capitalize transition-colors ${
                                  selected
                                    ? 'border-teal-500 bg-teal-500 text-white'
                                    : 'border-gray-border text-charcoal hover:border-teal-300 hover:text-teal-700'
                                }`}
                              >
                                {badge}
                              </button>
                            )
                          })}
                        </div>
                      </div>

                      <label className="flex items-center justify-between rounded-2xl border border-gray-border px-4 py-3">
                        <span className="text-sm font-medium text-charcoal">Blocked</span>
                        <input
                          type="checkbox"
                          checked={draft.blocked}
                          onChange={(event) =>
                            updateDraft(entry.id, (current) => ({
                              ...current,
                              blocked: event.target.checked,
                            }))
                          }
                          className="h-4 w-4 accent-teal-600"
                        />
                      </label>
                    </div>

                    <div className="mt-5 flex items-center justify-between gap-3">
                      <div className="text-sm text-gray-text">
                        {isDirty ? 'Unsaved changes' : 'Up to date'}
                      </div>
                      <button
                        type="button"
                        disabled={!isDirty || isSaving}
                        onClick={() => void saveUser(entry.id)}
                        className="rounded-full bg-charcoal px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {isSaving ? 'Saving…' : 'Save changes'}
                      </button>
                    </div>
                  </article>
                )
              })}
            </section>

            <section className="hidden overflow-hidden rounded-3xl border border-gray-border bg-white shadow-sm lg:block">
              <div className="overflow-x-auto">
                <table className="min-w-full text-left">
                  <thead className="bg-gray-50">
                    <tr className="text-sm text-gray-text">
                      <th className="px-5 py-4 font-medium">User</th>
                      <th className="px-5 py-4 font-medium">Role</th>
                      <th className="px-5 py-4 font-medium">Badges</th>
                      <th className="px-5 py-4 font-medium">Access</th>
                      <th className="px-5 py-4 font-medium">Joined</th>
                      <th className="px-5 py-4 font-medium text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((entry) => {
                      const draft = drafts[entry.id] || {
                        role: entry.role,
                        badges: entry.badges ?? [],
                        blocked: Boolean(entry.blocked),
                      }
                      const isDirty = dirtyUserIds.has(entry.id)
                      const isSaving = savingUserId === entry.id

                      return (
                        <tr key={entry.id} className="border-t border-gray-border align-top">
                          <td className="px-5 py-5">
                            <div className="max-w-sm">
                              <p className="font-semibold text-charcoal">{entry.name}</p>
                              <p className="text-sm text-gray-text">{entry.email}</p>
                              {entry.headline && (
                                <p className="mt-2 text-sm font-medium text-charcoal">
                                  {entry.headline}
                                </p>
                              )}
                              {entry.bio && (
                                <p className="mt-1 text-sm leading-6 text-gray-text line-clamp-2">
                                  {entry.bio}
                                </p>
                              )}
                            </div>
                          </td>
                          <td className="px-5 py-5">
                            <select
                              value={draft.role}
                              onChange={(event) =>
                                updateDraft(entry.id, (current) => ({
                                  ...current,
                                  role: event.target.value,
                                }))
                              }
                              className="input min-w-[140px]"
                            >
                              <option value="volunteer">Volunteer</option>
                              <option value="admin">Admin</option>
                            </select>
                          </td>
                          <td className="px-5 py-5">
                            <div className="flex max-w-xs flex-wrap gap-2">
                              {BADGE_OPTIONS.map((badge) => {
                                const selected = draft.badges.includes(badge)

                                return (
                                  <button
                                    key={badge}
                                    type="button"
                                    onClick={() =>
                                      updateDraft(entry.id, (current) => ({
                                        ...current,
                                        badges: selected
                                          ? current.badges.filter((value) => value !== badge)
                                          : [...current.badges, badge],
                                      }))
                                    }
                                    className={`rounded-full border px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] transition-colors ${
                                      selected
                                        ? 'border-teal-500 bg-teal-500 text-white'
                                        : 'border-gray-border text-gray-text hover:border-teal-300 hover:text-teal-700'
                                    }`}
                                  >
                                    {badge}
                                  </button>
                                )
                              })}
                            </div>
                          </td>
                          <td className="px-5 py-5">
                            <label className="inline-flex items-center gap-3 rounded-full border border-gray-border px-3 py-2 text-sm font-medium text-charcoal">
                              <input
                                type="checkbox"
                                checked={draft.blocked}
                                onChange={(event) =>
                                  updateDraft(entry.id, (current) => ({
                                    ...current,
                                    blocked: event.target.checked,
                                  }))
                                }
                                className="h-4 w-4 accent-teal-600"
                              />
                              {draft.blocked ? 'Blocked' : 'Active'}
                            </label>
                          </td>
                          <td className="px-5 py-5 text-sm text-gray-text">
                            {formatJoinedDate(entry.created_at)}
                          </td>
                          <td className="px-5 py-5">
                            <div className="flex items-center justify-end gap-3">
                              <span className="text-xs uppercase tracking-[0.16em] text-gray-mid">
                                {isDirty ? 'Edited' : 'Synced'}
                              </span>
                              <button
                                type="button"
                                disabled={!isDirty || isSaving}
                                onClick={() => void saveUser(entry.id)}
                                className="rounded-full bg-charcoal px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-50"
                              >
                                {isSaving ? 'Saving…' : 'Save'}
                              </button>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </section>
          </>
        )}
      </main>
    </div>
  )
}
