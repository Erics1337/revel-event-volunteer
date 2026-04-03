'use client';

import { useState } from 'react';
import Nav from '../../../../components/Nav';
import { DAYS, MY_AVAILABILITY } from '../../../../lib/mockData';

const TIME_SLOTS = [
  { id: 'morning', label: 'Morning', sub: 'Before noon' },
  { id: 'afternoon', label: 'Afternoon', sub: '12pm – 5pm' },
  { id: 'evening', label: 'Evening', sub: 'After 5pm' },
];

function defaultAvailability() {
  return DAYS.reduce((acc, d) => {
    acc[d.date] = {
      available: MY_AVAILABILITY.includes(d.date),
      times: MY_AVAILABILITY.includes(d.date) ? ['morning', 'afternoon'] : [],
    };
    return acc;
  }, {});
}

export default function MyAvailability() {
  const [availability, setAvailability] = useState(defaultAvailability);
  const [saved, setSaved] = useState(false);

  function toggleDay(date) {
    setAvailability((prev) => {
      const current = prev[date];
      return {
        ...prev,
        [date]: {
          available: !current.available,
          times: !current.available ? ['morning', 'afternoon'] : [],
        },
      };
    });
    setSaved(false);
  }

  function toggleTime(date, timeId) {
    setAvailability((prev) => {
      const current = prev[date];
      const times = current.times.includes(timeId)
        ? current.times.filter((t) => t !== timeId)
        : [...current.times, timeId];
      return { ...prev, [date]: { ...current, times } };
    });
    setSaved(false);
  }

  function handleSave() {
    // TODO: PUT /bsw/api/volunteers/me/availability with availability data
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  const selectedDayCount = Object.values(availability).filter((v) => v.available).length;

  return (
    <div className="min-h-screen bg-gray-light">
      <Nav variant="volunteer" />

      <div className="max-w-lg mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="font-accent text-3xl font-bold text-charcoal">My Availability</h1>
          <p className="text-gray-text text-sm mt-1">
            Tell us which days and times work for you. We'll show you shifts that match.
          </p>
        </div>

        <div className="flex flex-col gap-4">
          {DAYS.map((day) => {
            const { available, times } = availability[day.date];
            return (
              <div
                key={day.date}
                className={`card transition-all ${available ? '' : 'opacity-60'}`}
              >
                {/* Day toggle */}
                <label className="flex items-center justify-between cursor-pointer gap-4">
                  <div>
                    <p className="font-semibold text-charcoal">{day.full}</p>
                    {available && times.length > 0 && (
                      <p className="text-xs text-gray-text mt-0.5">
                        {times
                          .map((t) => TIME_SLOTS.find((s) => s.id === t)?.label)
                          .join(', ')}
                      </p>
                    )}
                  </div>
                  <div className="relative flex-shrink-0">
                    <input
                      type="checkbox"
                      checked={available}
                      onChange={() => toggleDay(day.date)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-border rounded-full peer peer-checked:bg-teal transition-colors" />
                    <div className="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform peer-checked:translate-x-5" />
                  </div>
                </label>

                {/* Time slot picker (only when day is on) */}
                {available && (
                  <div className="flex gap-2 mt-4 flex-wrap">
                    {TIME_SLOTS.map((slot) => (
                      <button
                        key={slot.id}
                        type="button"
                        onClick={() => toggleTime(day.date, slot.id)}
                        className={`flex-1 min-w-0 py-2 px-3 rounded-sm border text-xs font-medium transition-colors text-center ${
                          times.includes(slot.id)
                            ? 'bg-teal text-white border-teal'
                            : 'bg-white text-gray-text border-gray-border hover:border-teal hover:text-teal'
                        }`}
                      >
                        <span className="block font-semibold">{slot.label}</span>
                        <span className="block font-normal opacity-80">{slot.sub}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Save */}
        <div className="mt-6 flex items-center justify-between gap-4">
          <p className="text-sm text-gray-text">
            {selectedDayCount} day{selectedDayCount !== 1 ? 's' : ''} selected
          </p>
          <button onClick={handleSave} className="btn-primary py-3 px-8">
            {saved ? 'Saved ✓' : 'Save availability'}
          </button>
        </div>

        {saved && (
          <p className="mt-3 text-sm text-success text-center">
            Availability saved. Your shift matches will update automatically.
          </p>
        )}
      </div>
    </div>
  );
}
