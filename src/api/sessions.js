/**
 * Session API handlers
 *
 * GET    /bsw/api/sessions          — list sessions (filterable by day, type, category)
 * GET    /bsw/api/sessions/:id      — get single session
 * POST   /bsw/api/sessions          — create session (admin/facilitator)
 * PUT    /bsw/api/sessions/:id      — update session (admin/facilitator)
 * DELETE /bsw/api/sessions/:id      — delete session (admin)
 */

import { json, notFound, badRequest, forbidden, parseBody } from "./router.js";
import { SESSION_TYPES, SESSION_CATEGORIES, SESSION_STATUSES } from "../data/schema.js";

// ── GET /bsw/api/sessions ───────────────────────────────────────────────────

export async function listSessions(request, env) {
  const url = new URL(request.url);
  const { day, type, category, status } = Object.fromEntries(url.searchParams);

  // TODO: replace with DB query (env.DB)
  // Query: SELECT * FROM sessions WHERE status = 'published' [AND day = ?] [AND type = ?] [AND category = ?]
  const sessions = [];

  return json({ sessions });
}

// ── GET /bsw/api/sessions/:id ───────────────────────────────────────────────

export async function getSession(request, env, ctx, { id }) {
  // TODO: SELECT * FROM sessions WHERE id = ? AND status = 'published'
  const session = null;

  if (!session) return notFound("Session not found");
  return json({ session });
}

// ── POST /bsw/api/sessions ──────────────────────────────────────────────────

export async function createSession(request, env) {
  // TODO: enforce auth — must be admin or facilitator
  const body = await parseBody(request);
  if (!body) return badRequest("Invalid JSON body");

  const error = validateSession(body);
  if (error) return badRequest(error);

  // TODO: INSERT INTO sessions (...) VALUES (...)
  // Return the created session
  return json({ session: body }, 201);
}

// ── PUT /bsw/api/sessions/:id ───────────────────────────────────────────────

export async function updateSession(request, env, ctx, { id }) {
  // TODO: enforce auth — must be admin or the facilitator of this session
  const body = await parseBody(request);
  if (!body) return badRequest("Invalid JSON body");

  // TODO: UPDATE sessions SET ... WHERE id = ?
  return json({ session: { id, ...body } });
}

// ── DELETE /bsw/api/sessions/:id ────────────────────────────────────────────

export async function deleteSession(request, env, ctx, { id }) {
  // TODO: enforce auth — admin only
  // TODO: DELETE FROM sessions WHERE id = ?
  return json({ deleted: id });
}

// ── Validation ───────────────────────────────────────────────────────────────

function validateSession(body) {
  if (!body.title?.trim()) return "title is required";
  if (!SESSION_TYPES.includes(body.type)) return `type must be one of: ${SESSION_TYPES.join(", ")}`;
  if (!SESSION_CATEGORIES.includes(body.category)) return `category must be one of: ${SESSION_CATEGORIES.join(", ")}`;
  if (!body.start_time) return "start_time is required";
  if (!body.end_time) return "end_time is required";
  if (body.status && !SESSION_STATUSES.includes(body.status)) return "status must be draft or published";
  return null;
}
