/**
 * Revel / BSW Event Platform
 * Cloudflare Worker entry point
 */

import { Router, json } from "../api/router.js";
import { listSessions, getSession, createSession, updateSession, deleteSession } from "../api/sessions.js";
import { getSchedule, addToSchedule, removeFromSchedule, exportSchedule } from "../api/schedule.js";
import { listVenues, getVenue, createVenue, updateVenue } from "../api/venues.js";
import { register, login, logout } from "../api/auth.js";
import { getMe, updateMe } from "../api/users.js";
import { getStats, listUsers, updateUser, importAttendees, messageAll, messageSession } from "../api/admin.js";

const router = new Router();

// ── Health ───────────────────────────────────────────────────────────────────
router.get("/health", () => json({ status: "ok" }));

// ── Sessions ─────────────────────────────────────────────────────────────────
router.get("/bsw/api/sessions", listSessions);
router.get("/bsw/api/sessions/:id", getSession);
router.post("/bsw/api/sessions", createSession);
router.put("/bsw/api/sessions/:id", updateSession);
router.delete("/bsw/api/sessions/:id", deleteSession);

// ── Schedule ─────────────────────────────────────────────────────────────────
router.get("/bsw/api/schedule", getSchedule);
router.get("/bsw/api/schedule/export.ics", exportSchedule);
router.post("/bsw/api/schedule/:sessionId", addToSchedule);
router.delete("/bsw/api/schedule/:sessionId", removeFromSchedule);

// ── Venues ───────────────────────────────────────────────────────────────────
router.get("/bsw/api/venues", listVenues);
router.get("/bsw/api/venues/:id", getVenue);
router.post("/bsw/api/venues", createVenue);
router.put("/bsw/api/venues/:id", updateVenue);

// ── Auth ─────────────────────────────────────────────────────────────────────
router.post("/bsw/api/auth/register", register);
router.post("/bsw/api/auth/login", login);
router.post("/bsw/api/auth/logout", logout);

// ── User profile ──────────────────────────────────────────────────────────────
router.get("/bsw/api/users/me", getMe);
router.put("/bsw/api/users/me", updateMe);

// ── Admin ─────────────────────────────────────────────────────────────────────
router.get("/bsw/api/admin/stats", getStats);
router.get("/bsw/api/admin/users", listUsers);
router.put("/bsw/api/admin/users/:id", updateUser);
router.post("/bsw/api/admin/import", importAttendees);
router.post("/bsw/api/admin/message", messageAll);
router.post("/bsw/api/admin/message/:sessionId", messageSession);

// ── Export ────────────────────────────────────────────────────────────────────

export default {
  async fetch(request, env, ctx) {
    // Handle CORS preflight
    if (request.method === "OPTIONS") {
      return new Response(null, {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, Authorization",
        },
      });
    }

    return router.handle(request, env, ctx);
  },
};
