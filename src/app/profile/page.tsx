'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useAuth } from '@/contexts/auth-context'

interface UserProfile {
  name: string
  email: string
  avatar_url: string | null
  headline: string | null
  bio: string | null
  linkedin_url: string | null
  email_public: boolean
  role: string
  badges: string[] | null
  created_at: string | null
}

export default function ProfilePage() {
  const { user, profile, refreshProfile } = useAuth()
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    headline: '',
    bio: '',
    linkedin_url: '',
    email_public: false,
  })

  useEffect(() => {
    if (profile) {
      const updateFormData = async () => {
        setFormData({
          name: profile.name || '',
          headline: profile.headline || '',
          bio: profile.bio || '',
          linkedin_url: profile.linkedin_url || '',
          email_public: profile.email_public || false,
        })
      }
      updateFormData()
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
      <div className="flex justify-center items-center min-h-screen bg-gray-light">
        <div className="text-center">
          <p className="mb-4 text-lg text-gray-text">Please sign in to view your profile</p>
          <Link
            href="/auth/login"
            className="px-6 py-3 font-medium text-white bg-teal-500 rounded-md transition-colors hover:bg-teal-600"
          >
            Sign In
          </Link>
        </div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-light">
        <div className="text-center">
          <div className="mx-auto mb-4 w-8 h-8 rounded-full border-4 border-teal-500 animate-spin border-t-transparent"></div>
          <p className="text-gray-text">Loading profile...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-light">
      {/* Header */}
      <header className="bg-white border-b border-gray-border">
        <div className="flex justify-between items-center px-4 py-4 mx-auto max-w-6xl">
          <div className="flex gap-2 items-center">
            <div className="flex justify-center items-center w-8 h-8 bg-teal-500 rounded-full">
              <span className="text-sm font-bold text-white">R</span>
            </div>
            <h1 className="text-xl font-bold text-charcoal">Revel Events</h1>
          </div>
          
          <nav className="flex gap-6 items-center">
            <Link href="/" className="transition-colors text-gray-text hover:text-teal">Home</Link>
            <Link href="/events" className="transition-colors text-gray-text hover:text-teal">Events</Link>
            <Link href="/schedule" className="transition-colors text-gray-text hover:text-teal">Schedule</Link>
            <Link href="/profile" className="font-medium text-teal">Profile</Link>
          </nav>
        </div>
      </header>

      <main className="px-4 py-8 mx-auto max-w-4xl">
        <div className="mb-8">
          <h1 className="mb-2 text-3xl font-bold text-charcoal">Profile</h1>
          <p className="text-gray-text">Manage your personal information and preferences</p>
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
                  {(profile.badges ?? []).map((badge) => (
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
              View and manage your registered events
            </p>
            <Link
              href="/schedule"
              className="font-medium text-teal hover:underline"
            >
              View Schedule →
            </Link>
          </div>

          <div className="card">
            <h3 className="mb-3 text-lg font-semibold text-charcoal">Browse Events</h3>
            <p className="mb-4 text-gray-text">
              Discover and register for new events
            </p>
            <Link
              href="/events"
              className="font-medium text-teal hover:underline"
            >
              Browse Events →
            </Link>
          </div>
        </div>
      </main>
    </div>
  )
}
