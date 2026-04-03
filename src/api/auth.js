/**
 * Auth API handlers
 *
 * POST /bsw/api/auth/register   — create account (email + password)
 * POST /bsw/api/auth/login      — login, returns session token
 * POST /bsw/api/auth/logout     — invalidate session
 */

import { json, badRequest, unauthorized, parseBody } from "./router.js";

// ── POST /bsw/api/auth/register ─────────────────────────────────────────────

export async function register(request, env) {
  const body = await parseBody(request);
  if (!body) return badRequest("Invalid JSON body");

  const { email, password, name } = body;

  if (!email?.trim()) return badRequest("email is required");
  if (!password || password.length < 8) return badRequest("password must be at least 8 characters");
  if (!name?.trim()) return badRequest("name is required");

  // TODO: check email not already registered
  // TODO: hash password with bcrypt/argon2 (use Workers-compatible implementation)
  // TODO: INSERT INTO users (email, password_hash, name, role) VALUES (?, ?, ?, 'attendee')
  // TODO: create session token and store in KV or D1
  // TODO: return Set-Cookie with HttpOnly session cookie

  return json({ message: "Account created" }, 201);
}

// ── POST /bsw/api/auth/login ─────────────────────────────────────────────────

export async function login(request, env) {
  const body = await parseBody(request);
  if (!body) return badRequest("Invalid JSON body");

  const { email, password } = body;

  if (!email?.trim()) return badRequest("email is required");
  if (!password) return badRequest("password is required");

  // TODO: SELECT * FROM users WHERE email = ? AND blocked = false
  // TODO: verify password hash
  // TODO: create session token and store in KV or D1 with TTL
  // TODO: return Set-Cookie with HttpOnly session cookie

  // Return generic error to avoid user enumeration
  return unauthorized("Invalid email or password");
}

// ── POST /bsw/api/auth/logout ────────────────────────────────────────────────

export async function logout(request, env) {
  // TODO: read session token from cookie
  // TODO: DELETE session from KV or D1
  // TODO: clear cookie in response

  return json({ message: "Logged out" });
}
