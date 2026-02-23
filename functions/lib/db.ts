// Cloudflare D1 (SQLite) database helper
// D1 is native to Cloudflare Pages — no external service needed

interface Env {
  DB: D1Database;
  GOOGLE_CLIENT_ID: string;
  JWT_SECRET: string;
  GEMINI_API_KEY: string;
  GITHUB_TOKEN: string;
  GITHUB_REPO: string; // e.g. "arin-jaff/canDLE"
}

export type { Env };
