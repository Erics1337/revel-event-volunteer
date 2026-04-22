'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useAuth } from '@/contexts/auth-context'

export default function ProfilePage() {
  const { user, profile, refreshProfile } = useAuth()
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    headline: '',
    bio: '',
    linkedin_url: '',
    phone: '',
    email_public: false,
  })

  useEffect(() => {
    if (profile) {
      // Keep the editable draft aligned with the loaded profile record.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setFormData({
        name: profile.name || '',
        headline: profile.headline || '',
        bio: profile.bio || '',
        linkedin_url: profile.linkedin_url || '',
        phone: profile.phone || '',
        email_public: profile.email_public || false,
      })
    }
  }, [profile])

  const handleSave = async () => {
    setSaving(true)
    try {
      const response = await fetch('/api/users/me', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        await refreshProfile()
        setEditing(false)
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to update profile')
      }
    } catch (error) {
      console.error('Error updating profile:', error)
      alert('Failed to update profile')
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    if (profile) {
      setFormData({
        name: profile.name || '',
        headline: profile.headline || '',
        bio: profile.bio || '',
        linkedin_url: profile.linkedin_url || '',
        phone: profile.phone || '',
        email_public: profile.email_public || false,
      })
    }
    setEditing(false)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  if (!user) {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4">
        <div className="text-center">
          <p className="mb-4 text-lg text-gray-text">Please sign in to view your profile.</p>
          <Link
            href="/auth/login?redirectTo=/profile"
            className="px-6 py-3 font-medium text-white bg-teal-500 rounded-md transition-colors hover:bg-teal-600"
          >
            Sign in
          </Link>
        </div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4">
        <div className="text-center">
          <div className="mx-auto mb-4 w-8 h-8 rounded-full border-4 border-teal-500 animate-spin border-t-transparent"></div>
          <p className="text-gray-text">Loading profile...</p>
        </div>
      </div>
    )
  }

  return (
    <>
      <section
        className="px-4 py-10 md:py-8"
        style={{ background: 'linear-gradient(90deg, #5e9a98 0%, #b5aa5f 45%, #f39c3d 100%)' }}
      >
        <div className="mx-auto max-w-4xl">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-white/80">
            Volunteer Portal
          </p>
          <h1
            className="mt-2 text-4xl font-bold tracking-tight text-white md:text-[2.7rem]"
            style={{ fontFamily: 'var(--font-accent)' }}
          >
            Profile
          </h1>
          <p className="mt-3 max-w-xl text-lg leading-8 text-white/95">
            Keep your volunteer contact details and preferences up to date.
          </p>
        </div>
      </section>

      <main className="px-4 py-8 mx-auto max-w-4xl">
        <div className="mb-8">
          <h2 className="mb-2 text-3xl font-bold text-charcoal">My Profile</h2>
          <p className="text-gray-text">Manage your personal information and volunteer preferences.</p>
        </div>

        <div className="p-8 bg-white rounded-lg border border-gray-border">
          {/* Profile Header */}
          <div className="flex justify-between items-start mb-8">
            <div className="flex gap-4 items-center">
              <div className="flex justify-center items-center w-20 h-20 bg-teal-500 rounded-full">
                <span className="text-2xl font-bold text-white">
                  {profile.name.charAt(0).toUpperCase()}
                </span>
              </div>
              <div>
                <h2 className="text-2xl font-bold text-charcoal">{profile.name}</h2>
                <p className="text-gray-text">{profile.email}</p>
                <div className="flex gap-2 items-center mt-2">
                  <span className="capitalize badge-default">{profile.role}</span>
                  {profile.badges?.map((badge) => (
                    <span key={badge} className="capitalize badge-featured">
                      {badge}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {!editing && (
              <button
                onClick={() => setEditing(true)}
                className="btn-secondary"
              >
                Edit Profile
              </button>
            )}
          </div>

          {/* Edit Form */}
          {editing ? (
            <div className="space-y-6">
              <div>
                <label className="block mb-2 text-sm font-medium text-gray-700">
                  Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="input"
                  required
                />
              </div>

              <div>
                <label className="block mb-2 text-sm font-medium text-gray-700">
                  Headline
                </label>
                <input
                  type="text"
                  value={formData.headline}
                  onChange={(e) => setFormData({ ...formData, headline: e.target.value })}
                  className="input"
                  placeholder="e.g., Software Engineer at Tech Company"
                />
              </div>

              <div>
                <label className="block mb-2 text-sm font-medium text-gray-700">
                  Bio
                </label>
                <textarea
                  value={formData.bio}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  className="input"
                  rows={4}
                  placeholder="Tell us about yourself..."
                />
              </div>

              <div>
                <label className="block mb-2 text-sm font-medium text-gray-700">
                  Phone number
                </label>
                <input
                  type="tel"
                  autoComplete="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="input"
                  placeholder="(555) 123-4567"
                  required
                />
                <p className="mt-1 text-xs text-gray-text">
                  Used for shift reminders and day-of coordination only.
                </p>
              </div>

              <div>
                <label className="block mb-2 text-sm font-medium text-gray-700">
                  LinkedIn URL
                </label>
                <input
                  type="url"
                  value={formData.linkedin_url}
                  onChange={(e) => setFormData({ ...formData, linkedin_url: e.target.value })}
                  className="input"
                  placeholder="https://linkedin.com/in/yourprofile"
                />
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="email_public"
                  checked={formData.email_public}
                  onChange={(e) => setFormData({ ...formData, email_public: e.target.checked })}
                  className="mr-2"
                />
                <label htmlFor="email_public" className="text-sm text-gray-700">
                  Make my email visible to other attendees
                </label>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="px-6 py-2 font-medium text-white bg-teal-500 rounded-md transition-colors hover:bg-teal-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
                <button
                  onClick={handleCancel}
                  disabled={saving}
                  className="btn-secondary"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            /* View Mode */
            <div className="space-y-6">
              <div>
                <h3 className="mb-2 text-lg font-semibold text-charcoal">About</h3>
                <p className="text-gray-text">
                  {profile.headline || 'No headline provided'}
                </p>
              </div>

              {profile.bio && (
                <div>
                  <h3 className="mb-2 text-lg font-semibold text-charcoal">Bio</h3>
                  <p className="whitespace-pre-wrap text-gray-text">{profile.bio}</p>
                </div>
              )}

              <div>
                <h3 className="mb-2 text-lg font-semibold text-charcoal">Phone</h3>
                <p className="text-gray-text">
                  {profile.phone ? (
                    <a href={`tel:${profile.phone}`} className="text-teal hover:underline">
                      {profile.phone}
                    </a>
                  ) : (
                    'No phone number on file'
                  )}
                </p>
              </div>

              {profile.linkedin_url && (
                <div>
                  <h3 className="mb-2 text-lg font-semibold text-charcoal">LinkedIn</h3>
                  <a
                    href={profile.linkedin_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-teal hover:underline"
                  >
                    {profile.linkedin_url}
                  </a>
                </div>
              )}

              <div>
                <h3 className="mb-2 text-lg font-semibold text-charcoal">Privacy</h3>
                <p className="text-gray-text">
                  Email is {profile.email_public ? 'visible' : 'hidden'} to other attendees
                </p>
              </div>

              <div>
                <h3 className="mb-2 text-lg font-semibold text-charcoal">Account</h3>
                <p className="text-gray-text">
                  Member since {profile.created_at ? formatDate(profile.created_at) : '—'}
                </p>
                <p className="text-gray-text">
                  Role: <span className="capitalize">{profile.role}</span>
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="grid gap-6 mt-8 md:grid-cols-2">
          <div className="card">
            <h3 className="mb-3 text-lg font-semibold text-charcoal">My Schedule</h3>
            <p className="mb-4 text-gray-text">
              View and manage the volunteer shifts you’ve signed up for.
            </p>
            <Link
              href="/schedule"
              className="font-medium text-teal hover:underline"
            >
              View Schedule →
            </Link>
          </div>

          <div className="card">
            <h3 className="mb-3 text-lg font-semibold text-charcoal">Open Shifts</h3>
            <p className="mb-4 text-gray-text">
              Find an open slot that fits your schedule and request it.
            </p>
            <Link
              href="/volunteers"
              className="font-medium text-teal hover:underline"
            >
              Open shifts →
            </Link>
          </div>
        </div>
      </main>
    </>
  )
}
