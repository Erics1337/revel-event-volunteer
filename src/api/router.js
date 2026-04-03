/**
 * Lightweight router for Cloudflare Workers.
 *
 * Usage:
 *   const router = new Router();
 *   router.get("/bsw/api/sessions", handler);
 *   router.post("/bsw/api/sessions", handler);
 *
 * Route params:
 *   router.get("/bsw/api/sessions/:id", (req, env, ctx, params) => { ... });
 */

export class Router {
  constructor() {
    this.routes = [];
  }

  _add(method, pattern, handler) {
    // Convert "/path/:param" to a named-group regex
    const keys = [];
    const regexStr = pattern.replace(/:([^/]+)/g, (_, key) => {
      keys.push(key);
      return "([^/]+)";
    });
    this.routes.push({
      method,
      regex: new RegExp(`^${regexStr}$`),
      keys,
      handler,
    });
  }

  get(pattern, handler) { this._add("GET", pattern, handler); }
  post(pattern, handler) { this._add("POST", pattern, handler); }
  put(pattern, handler) { this._add("PUT", pattern, handler); }
  delete(pattern, handler) { this._add("DELETE", pattern, handler); }

  async handle(request, env, ctx) {
    const url = new URL(request.url);
    const pathname = url.pathname.replace(/\/$/, "") || "/";

    for (const route of this.routes) {
      if (route.method !== request.method) continue;
      const match = pathname.match(route.regex);
      if (!match) continue;

      const params = {};
      route.keys.forEach((key, i) => {
        params[key] = decodeURIComponent(match[i + 1]);
      });

      return route.handler(request, env, ctx, params);
    }

    return json({ error: "Not Found" }, 404);
  }
}

// ── Response helpers ────────────────────────────────────────────────────────

export function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
    },
  });
}

export function notFound(msg = "Not found") {
  return json({ error: msg }, 404);
}

export function badRequest(msg = "Bad request") {
  return json({ error: msg }, 400);
}

export function unauthorized(msg = "Unauthorized") {
  return json({ error: msg }, 401);
}

export function forbidden(msg = "Forbidden") {
  return json({ error: msg }, 403);
}

/**
 * Parse JSON body safely. Returns null if body is missing or malformed.
 */
export async function parseBody(request) {
  try {
    return await request.json();
  } catch {
    return null;
  }
}
