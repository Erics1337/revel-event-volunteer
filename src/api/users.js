/**
 * User profile API handlers
 *
 * GET  /bsw/api/users/me   — get current user's profile
 * PUT  /bsw/api/users/me   — update current user's profile
 */

import { json, unauthorized, badRequest, parseBody } from "./router.js";

// ── GET /bsw/api/users/me ────────────────────────────────────────────────────

export async function getMe(request, env) {
  const userId = getUserId(request);
  if (!userId) return unauthorized();

  // TODO: SELECT id, email, name, avatar_url, headline, bio, linkedin_url,
  //              email_public, role, badges
  //       FROM users WHERE id = ?
  const user = null;
  if (!user) return unauthorized();

  return json({ user });
}

// ── PUT /bsw/api/users/me ────────────────────────────────────────────────────

export async function updateMe(request, env) {
  const userId = getUserId(request);
  if (!userId) return unauthorized();

  const body = await parseBody(request);
  if (!body) return badRequest("Invalid JSON body");

  // Whitelist updatable fields — never allow role/badges/blocked via this endpoint
  const allowed = ["name", "headline", "bio", "linkedin_url", "avatar_url", "email_public"];
  const update = {};
  for (const key of allowed) {
    if (key in body) update[key] = body[key];
  }

  if (Object.keys(update).length === 0) return badRequest("No valid fields to update");

  // TODO: UPDATE users SET ... WHERE id = ?
  return json({ user: { id: userId, ...update } });
}

// ── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Extract authenticated user ID from the request.
 * TODO: replace with real session/JWT validation once auth is wired up.
 */
function getUserId(request) {
  return request.headers.get("X-User-Id") || null;
}
