/**
 * Venue API handlers
 *
 * GET    /bsw/api/venues       — list all venues
 * GET    /bsw/api/venues/:id   — get single venue
 * POST   /bsw/api/venues       — create venue (admin)
 * PUT    /bsw/api/venues/:id   — update venue (admin)
 */

import { json, notFound, badRequest, parseBody } from "./router.js";

// ── GET /bsw/api/venues ─────────────────────────────────────────────────────

export async function listVenues(request, env) {
  // TODO: SELECT * FROM venues ORDER BY name ASC
  const venues = [];
  return json({ venues });
}

// ── GET /bsw/api/venues/:id ─────────────────────────────────────────────────

export async function getVenue(request, env, ctx, { id }) {
  // TODO: SELECT * FROM venues WHERE id = ?
  const venue = null;
  if (!venue) return notFound("Venue not found");
  return json({ venue });
}

// ── POST /bsw/api/venues ────────────────────────────────────────────────────

export async function createVenue(request, env) {
  // TODO: enforce auth — admin only
  const body = await parseBody(request);
  if (!body) return badRequest("Invalid JSON body");

  const error = validateVenue(body);
  if (error) return badRequest(error);

  // TODO: INSERT INTO venues (...) VALUES (...)
  return json({ venue: body }, 201);
}

// ── PUT /bsw/api/venues/:id ─────────────────────────────────────────────────

export async function updateVenue(request, env, ctx, { id }) {
  // TODO: enforce auth — admin only
  const body = await parseBody(request);
  if (!body) return badRequest("Invalid JSON body");

  // TODO: UPDATE venues SET ... WHERE id = ?
  return json({ venue: { id, ...body } });
}

// ── Validation ────────────────────────────────────────────────────────────────

function validateVenue(body) {
  if (!body.name?.trim()) return "name is required";
  if (!body.address?.trim()) return "address is required";
  return null;
}
