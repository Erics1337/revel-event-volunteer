/**
 * Personal schedule API handlers
 *
 * GET    /bsw/api/schedule              — get current user's registered sessions
 * POST   /bsw/api/schedule/:sessionId   — add session to schedule
 * DELETE /bsw/api/schedule/:sessionId   — remove session from schedule
 * GET    /bsw/api/schedule/export.ics   — export schedule as iCal file
 */

import { json, notFound, unauthorized, badRequest } from "./router.js";

// ── GET /bsw/api/schedule ───────────────────────────────────────────────────

export async function getSchedule(request, env) {
  const userId = getUserId(request);
  if (!userId) return unauthorized();

  // TODO: SELECT sessions.* FROM registrations
  //       JOIN sessions ON sessions.id = registrations.session_id
  //       WHERE registrations.user_id = ?
  //       ORDER BY sessions.start_time ASC
  const sessions = [];

  return json({ sessions });
}

// ── POST /bsw/api/schedule/:sessionId ──────────────────────────────────────

export async function addToSchedule(request, env, ctx, { sessionId }) {
  const userId = getUserId(request);
  if (!userId) return unauthorized();

  // TODO: check session exists and is published
  // TODO: INSERT INTO registrations (user_id, session_id, registered_at) VALUES (...)
  //       ON CONFLICT DO NOTHING
  // TODO: UPDATE sessions SET registration_count = registration_count + 1 WHERE id = ?

  return json({ added: sessionId }, 201);
}

// ── DELETE /bsw/api/schedule/:sessionId ────────────────────────────────────

export async function removeFromSchedule(request, env, ctx, { sessionId }) {
  const userId = getUserId(request);
  if (!userId) return unauthorized();

  // TODO: DELETE FROM registrations WHERE user_id = ? AND session_id = ?
  // TODO: UPDATE sessions SET registration_count = registration_count - 1 WHERE id = ?

  return json({ removed: sessionId });
}

// ── GET /bsw/api/schedule/export.ics ───────────────────────────────────────

export async function exportSchedule(request, env) {
  const userId = getUserId(request);
  if (!userId) return unauthorized();

  // TODO: fetch user's sessions from DB
  const sessions = [];

  const ics = buildIcs(sessions);

  return new Response(ics, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": 'attachment; filename="bsw-2026-schedule.ics"',
    },
  });
}

// ── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Extract authenticated user ID from the request.
 * TODO: replace with real JWT/session validation once auth is wired up.
 */
function getUserId(request) {
  // Placeholder: read from a header set by auth middleware
  return request.headers.get("X-User-Id") || null;
}

/**
 * Build an iCal string from an array of sessions.
 */
function buildIcs(sessions) {
  const events = sessions.map((s) => {
    const start = toIcsDate(s.start_time);
    const end = toIcsDate(s.end_time);
    return [
      "BEGIN:VEVENT",
      `UID:${s.id}@bsw2026.com`,
      `DTSTART:${start}`,
      `DTEND:${end}`,
      `SUMMARY:${icsEscape(s.title)}`,
      `DESCRIPTION:${icsEscape(s.description || "")}`,
      `LOCATION:${icsEscape(s.venue?.name || "")}`,
      "END:VEVENT",
    ].join("\r\n");
  });

  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//BSW 2026//Revel Event Platform//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    ...events,
    "END:VCALENDAR",
  ].join("\r\n");
}

function toIcsDate(iso) {
  return new Date(iso).toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
}

function icsEscape(str) {
  return String(str).replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\n/g, "\\n");
}
