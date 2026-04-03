'use client';

import { useState } from 'react';
import Nav from '../../../../components/Nav';

const DIETARY_OPTIONS = [
  'Vegetarian',
  'Vegan',
  'Gluten-free',
  'Dairy-free',
  'Nut allergy',
  'Kosher',
  'Halal',
  'No restrictions',
];

const defaultProfile = {
  name: 'Mia Torres',
  email: 'mia@example.com',
  phone: '(720) 555-0101',
  headline: 'Founder & Community Builder',
  dietary: [],
  preferences: '',
};

export default function VolunteerProfile() {
  const [form, setForm] = useState(defaultProfile);
  const [saved, setSaved] = useState(false);
  const [dirty, setDirty] = useState(false);

  function update(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
    setDirty(true);
    setSaved(false);
  }

  function toggleDietary(option) {
    setForm((prev) => {
      const next = prev.dietary.includes(option)
        ? prev.dietary.filter((d) => d !== option)
        : [...prev.dietary, option];
      return { ...prev, dietary: next };
    });
    setDirty(true);
    setSaved(false);
  }

  function handleSave(e) {
    e.preventDefault();
    // TODO: PUT /bsw/api/volunteers/me with form data
    setSaved(true);
    setDirty(false);
  }

  return (
    <div className="min-h-screen bg-gray-light">
      <Nav variant="volunteer" />

      <div className="max-w-lg mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="font-accent text-3xl font-bold text-charcoal">My Profile</h1>
          <p className="text-gray-text text-sm mt-1">
            Keep your info current so we can reach you and take care of you during the week.
          </p>
        </div>

        <form onSubmit={handleSave} className="flex flex-col gap-5">
          {/* Contact info */}
          <div className="card flex flex-col gap-4">
            <h2 className="font-accent text-lg font-semibold text-charcoal">Contact Info</h2>

            <div>
              <label className="block text-sm font-medium text-charcoal mb-1.5">Name</label>
              <input
                className="input"
                value={form.name}
                onChange={(e) => update('name', e.target.value)}
                placeholder="Full name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-charcoal mb-1.5">Email</label>
              <input
                className="input"
                type="email"
                value={form.email}
                onChange={(e) => update('email', e.target.value)}
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-charcoal mb-1.5">Phone</label>
              <input
                className="input"
                type="tel"
                value={form.phone}
                onChange={(e) => update('phone', e.target.value)}
                placeholder="(720) 555-0100"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-charcoal mb-1.5">
                Headline{' '}
                <span className="text-gray-mid font-normal">(optional)</span>
              </label>
              <input
                className="input"
                value={form.headline}
                onChange={(e) => update('headline', e.target.value)}
                placeholder="Founder, Community Builder, Dog Walker..."
              />
            </div>
          </div>

          {/* Dietary needs */}
          <div className="card flex flex-col gap-4">
            <div>
              <h2 className="font-accent text-lg font-semibold text-charcoal">Dietary Needs</h2>
              <p className="text-gray-text text-sm mt-1">
                We'll make sure there's food for you at volunteer meals and events.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {DIETARY_OPTIONS.map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => toggleDietary(option)}
                  className={`px-4 py-1.5 rounded-pill text-sm font-medium border transition-colors ${
                    form.dietary.includes(option)
                      ? 'bg-teal text-white border-teal'
                      : 'bg-white text-gray-text border-gray-border hover:border-teal hover:text-teal'
                  }`}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>

          {/* Preferences / notes */}
          <div className="card flex flex-col gap-4">
            <div>
              <h2 className="font-accent text-lg font-semibold text-charcoal">
                Anything else we should know?
              </h2>
              <p className="text-gray-text text-sm mt-1">
                Accessibility needs, preferences, or anything that helps us set you up well.
              </p>
            </div>
            <textarea
              className="input min-h-[100px] resize-y"
              value={form.preferences}
              onChange={(e) => update('preferences', e.target.value)}
              placeholder="e.g. I need ground-floor access, I'm best in the mornings, I'm bringing my dog..."
            />
          </div>

          {/* Save */}
          <div className="flex items-center justify-between gap-4">
            {saved && (
              <p className="text-sm text-success">Profile saved.</p>
            )}
            {!saved && <div />}
            <button
              type="submit"
              disabled={!dirty}
              className="btn-primary py-3 px-8 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Save profile
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
