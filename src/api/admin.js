/**
 * Admin API handlers
 *
 * GET  /bsw/api/admin/stats          — dashboard: registrations, popular sessions, venue usage
 * GET  /bsw/api/admin/users          — list all users
 * PUT  /bsw/api/admin/users/:id      — update user (role, badges, blocked)
 * POST /bsw/api/admin/import         — bulk CSV import of attendees
 * POST /bsw/api/admin/message        — bulk message all attendees
 * POST /bsw/api/admin/message/:sessionId — message registrants of a specific session
 */

import { json, forbidden, badRequest, unauthorized, parseBody } from "./router.js";
import { USER_ROLES, USER_BADGES } from "../data/schema.js";

// ── Auth guard ───────────────────────────────────────────────────────────────

function requireAdmin(request) {
  // TODO: replace with real session/role check once auth is wired up
  const role = request.headers.get("X-User-Role");
  if (role !== "admin") return forbidden("Admin access required");
  return null;
}

// ── GET /bsw/api/admin/stats ─────────────────────────────────────────────────

export async function getStats(request, env) {
  const err = requireAdmin(request);
  if (err) return err;

  // TODO: run these queries against D1/PostgreSQL:
  // - total users, total sessions, total registrations
  // - top 10 sessions by registration_count
  // - registrations per day (May 4–8)
  // - venue utilization (sessions per venue)

  return json({
    stats: {
      total_users: 0,
      total_sessions: 0,
      total_registrations: 0,
      popular_sessions: [],
      registrations_by_day: {},
      venue_utilization: [],
    },
  });
}

// ── GET /bsw/api/admin/users ─────────────────────────────────────────────────

export async function listUsers(request, env) {
  const err = requireAdmin(request);
  if (err) return err;

  const url = new URL(request.url);
  const { role, blocked, search } = Object.fromEntries(url.searchParams);

  // TODO: SELECT * FROM users [WHERE role = ?] [AND blocked = ?] [AND name ILIKE ?]
  //       ORDER BY created_at DESC
  const users = [];
  return json({ users });
}

// ── PUT /bsw/api/admin/users/:id ─────────────────────────────────────────────

export async function updateUser(request, env, ctx, { id }) {
  const err = requireAdmin(request);
  if (err) return err;

  const body = await parseBody(request);
  if (!body) return badRequest("Invalid JSON body");

  // Whitelist admin-assignable fields
  const allowed = ["role", "badges", "blocked"];
  const update = {};
  for (const key of allowed) {
    if (key in body) update[key] = body[key];
  }

  if (update.role && !USER_ROLES.includes(update.role)) {
    return badRequest(`role must be one of: ${USER_ROLES.join(", ")}`);
  }
  if (update.badges) {
    const invalid = update.badges.filter((b) => !USER_BADGES.includes(b));
    if (invalid.length > 0) return badRequest(`invalid badges: ${invalid.join(", ")}`);
  }

  // TODO: UPDATE users SET ... WHERE id = ?
  return json({ user: { id, ...update } });
}

// ── POST /bsw/api/admin/import ───────────────────────────────────────────────

export async function importAttendees(request, env) {
  const err = requireAdmin(request);
  if (err) return err;

  // Expect multipart/form-data with a "file" field containing a CSV
  const contentType = request.headers.get("Content-Type") || "";
  if (!contentType.includes("multipart/form-data")) {
    return badRequest("Expected multipart/form-data with a CSV file");
  }

  const formData = await request.formData();
  const file = formData.get("file");
  if (!file) return badRequest("No file uploaded");

  const csv = await file.text();
  const { rows, errors } = parseCsv(csv);

  // TODO: bulk INSERT into users table
  // Columns expected: name, email (required); headline, bio, linkedin_url (optional)
  // If email already exists, skip (no upsert — clean import only)

  return json({
    imported: rows.length,
    skipped: errors.length,
    errors,
  });
}

// ── POST /bsw/api/admin/message ──────────────────────────────────────────────

export async function messageAll(request, env) {
  const err = requireAdmin(request);
  if (err) return err;

  const body = await parseBody(request);
  if (!body?.subject?.trim()) return badRequest("subject is required");
  if (!body?.message?.trim()) return badRequest("message is required");

  // TODO: SELECT email FROM users WHERE blocked = false
  // TODO: send via email provider (e.g. Mailgun, Postmark, Cloudflare Email Routing)

  return json({ queued: true });
}

// ── POST /bsw/api/admin/message/:sessionId ───────────────────────────────────

export async function messageSession(request, env, ctx, { sessionId }) {
  const err = requireAdmin(request);
  if (err) return err;

  const body = await parseBody(request);
  if (!body?.subject?.trim()) return badRequest("subject is required");
  if (!body?.message?.trim()) return badRequest("message is required");

  // TODO: SELECT users.email FROM registrations
  //       JOIN users ON users.id = registrations.user_id
  //       WHERE registrations.session_id = ? AND users.blocked = false
  // TODO: send via email provider

  return json({ queued: true, session_id: sessionId });
}

// ── CSV helpers ───────────────────────────────────────────────────────────────

/**
 * Minimal CSV parser. Expects a header row with at least: name, email
 * Returns { rows: [{name, email, ...}], errors: [string] }
 */
function parseCsv(csv) {
  const lines = csv.trim().split("\n");
  if (lines.length < 2) return { rows: [], errors: ["CSV is empty or has no data rows"] };

  const headers = lines[0].split(",").map((h) => h.trim().toLowerCase());
  const nameIdx = headers.indexOf("name");
  const emailIdx = headers.indexOf("email");

  if (nameIdx === -1 || emailIdx === -1) {
    return { rows: [], errors: ["CSV must have 'name' and 'email' columns"] };
  }

  const rows = [];
  const errors = [];

  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(",").map((c) => c.trim());
    const name = cols[nameIdx];
    const email = cols[emailIdx];

    if (!name || !email || !email.includes("@")) {
      errors.push(`Row ${i + 1}: invalid name or email`);
      continue;
    }

    const row = { name, email };
    headers.forEach((h, idx) => {
      if (h !== "name" && h !== "email" && cols[idx]) row[h] = cols[idx];
    });
    rows.push(row);
  }

  return { rows, errors };
}
