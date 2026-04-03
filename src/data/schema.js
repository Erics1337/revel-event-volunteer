/**
 * Data models for the Revel / BSW event platform.
 *
 * These are plain JS objects describing the shape of each entity.
 * When the DB (Cloudflare D1 / PostgreSQL) is wired up, use these
 * as the source of truth for table schemas and validation.
 *
 * Session types and categories are defined here so they stay in sync
 * across the API and UI.
 *
 * NOTE: No "tracks" — tracks are a Sched-ism. Use `type` + `category`.
 */

export const SESSION_TYPES = [
  "Keynote",
  "Panel",
  "Workshop",
  "Talk",
  "Networking",
  "Office Hours",
  "Demo",
  "Social",
];

export const SESSION_CATEGORIES = [
  "Fundraising",
  "Product",
  "Engineering",
  "Design",
  "Marketing",
  "Operations",
  "Leadership",
  "Community",
  "Hiring",
  "Legal & Finance",
  "Health & Wellness",
  "Other",
];

export const SESSION_STATUSES = ["draft", "published"];

export const USER_ROLES = ["admin", "facilitator", "attendee"];

export const USER_BADGES = ["facilitator", "volunteer", "sponsor"];

/**
 * Session shape:
 * {
 *   id: string (uuid),
 *   title: string,
 *   description: string,
 *   type: SESSION_TYPES[n],
 *   category: SESSION_CATEGORIES[n],
 *   status: "draft" | "published",
 *   day: "2026-05-04" | "2026-05-05" | "2026-05-06" | "2026-05-07" | "2026-05-08",
 *   start_time: ISO 8601 string,
 *   end_time: ISO 8601 string,
 *   venue_id: string (uuid),
 *   facilitator_ids: string[],
 *   registration_count: number,
 *   attachments: { label: string, url: string }[],
 *   created_at: ISO 8601 string,
 *   updated_at: ISO 8601 string,
 * }
 */

/**
 * Venue shape:
 * {
 *   id: string (uuid),
 *   name: string,
 *   address: string,
 *   maps_url: string,
 *   capacity: number | null,
 *   created_at: ISO 8601 string,
 *   updated_at: ISO 8601 string,
 * }
 */

/**
 * User shape:
 * {
 *   id: string (uuid),
 *   email: string,
 *   name: string,
 *   avatar_url: string | null,
 *   headline: string | null,
 *   bio: string | null,
 *   linkedin_url: string | null,
 *   email_public: boolean,
 *   role: USER_ROLES[n],
 *   badges: USER_BADGES[n][],
 *   blocked: boolean,
 *   created_at: ISO 8601 string,
 * }
 */

/**
 * Registration shape:
 * {
 *   id: string (uuid),
 *   user_id: string,
 *   session_id: string,
 *   registered_at: ISO 8601 string,
 * }
 */
